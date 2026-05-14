package worker

import (
	"context"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	"blackbox.io/core/internal/chain"
	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/storage"
)

type Job struct {
	Payload domain.Log
}

type Subscription struct {
	Ch     chan *domain.Log
	Filter domain.LogFilter
}

type Pool struct {
	db      *storage.DB
	jobs    chan Job
	subs    []*Subscription
	subsMu  sync.Mutex
	folders sync.Map // map[folderID]*sync.Mutex — serialises hash chain per folder
}

func NewPool(db *storage.DB) *Pool {
	return &Pool{
		db:   db,
		jobs: make(chan Job, 1024),
	}
}

func (p *Pool) Start(ctx context.Context) {
	for range poolSize() {
		go p.work(ctx)
	}
}

func (p *Pool) Enqueue(job Job) {
	p.jobs <- job
}

func (p *Pool) Subscribe(f domain.LogFilter) *Subscription {
	sub := &Subscription{Ch: make(chan *domain.Log, 64), Filter: f}
	p.subsMu.Lock()
	p.subs = append(p.subs, sub)
	p.subsMu.Unlock()
	return sub
}

func (p *Pool) Unsubscribe(sub *Subscription) {
	p.subsMu.Lock()
	defer p.subsMu.Unlock()
	for i, s := range p.subs {
		if s == sub {
			p.subs = append(p.subs[:i], p.subs[i+1:]...)
			close(sub.Ch)
			return
		}
	}
}

func (p *Pool) work(ctx context.Context) {
	for {
		select {
		case job := <-p.jobs:
			persisted := p.process(ctx, job)
			if persisted != nil {
				p.broadcast(persisted)
			}
		case <-ctx.Done():
			return
		}
	}
}

// process computes the hash chain and writes the log atomically per folder.
func (p *Pool) process(ctx context.Context, job Job) *domain.Log {
	folderMu := p.folderLock(job.Payload.FolderID)
	folderMu.Lock()
	defer folderMu.Unlock()

	entry := job.Payload
	entry.CreatedAt = time.Now().UTC()
	entry.Readonly = true

	// Determine prev_hash and seq from the last log in this folder.
	last, err := p.db.LastLogInFolder(ctx, entry.FolderID)
	if err != nil {
		log.Printf("worker: last log in folder %s: %v", entry.FolderID, err)
		return nil
	}

	prevHash := ""
	seq := int64(0)
	if last != nil {
		prevHash = last.Hash
		seq = last.Seq + 1
	}
	entry.PrevHash = prevHash
	entry.Seq = seq

	// Compute hash over the canonical payload fields + prev_hash.
	h, err := chain.Compute(chain.HashPayload{
		ID:          entry.ID,
		FolderID:    entry.FolderID,
		Environment: string(entry.Environment),
		Level:       string(entry.Level),
		Message:     entry.Message,
		Tags:        entry.Tags,
		IssuerID:    entry.IssuerID,
		PrevHash:    prevHash,
		Seq:         seq,
	}, prevHash)
	if err != nil {
		log.Printf("worker: compute hash: %v", err)
		return nil
	}
	entry.Hash = h

	if err := p.db.WriteLog(ctx, &entry); err != nil {
		log.Printf("worker: write log: %v", err)
		return nil
	}

	return &entry
}

func (p *Pool) broadcast(log *domain.Log) {
	p.subsMu.Lock()
	defer p.subsMu.Unlock()
	for _, sub := range p.subs {
		if sub.Filter.Matches(log) {
			select {
			case sub.Ch <- log:
			default: // drop if subscriber is slow
			}
		}
	}
}

func (p *Pool) folderLock(folderID string) *sync.Mutex {
	v, _ := p.folders.LoadOrStore(folderID, &sync.Mutex{})
	return v.(*sync.Mutex)
}

func poolSize() int {
	if s := os.Getenv("WORKER_POOL_SIZE"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			return n
		}
	}
	return 10
}
