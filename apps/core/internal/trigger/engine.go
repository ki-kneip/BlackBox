package trigger

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/events"
	"blackbox.io/core/internal/storage"
	nats "github.com/nats-io/nats.go"
)

type FireEvent struct {
	TriggerID string                  `json:"trigger_id"`
	ProjectID string                  `json:"project_id"`
	Log       domain.Log              `json:"log"`
	Channels  []domain.TriggerChannel `json:"channels"`
}

type Engine struct {
	db       *storage.DB
	nats     *events.Client
	throttle sync.Map // triggerID → time.Time (last fire)
}

func NewEngine(db *storage.DB, nc *events.Client) *Engine {
	return &Engine{db: db, nats: nc}
}

func (e *Engine) Start(ctx context.Context) error {
	sub, err := e.nats.Subscribe(events.SubjectLogsPrefix+"*", func(msg *nats.Msg) {
		var l domain.Log
		if err := json.Unmarshal(msg.Data, &l); err != nil {
			log.Printf("trigger engine: decode log: %v", err)
			return
		}
		e.evaluate(ctx, &l)
	})
	if err != nil {
		return err
	}
	go func() {
		<-ctx.Done()
		sub.Unsubscribe()
	}()
	return nil
}

func (e *Engine) evaluate(ctx context.Context, l *domain.Log) {
	triggers, err := e.db.ListTriggers(ctx, l.ProjectID)
	if err != nil {
		log.Printf("trigger engine: list triggers for project %s: %v", l.ProjectID, err)
		return
	}
	for _, t := range triggers {
		if !t.Active {
			continue
		}
		if !conditionMatches(t.Condition, l) {
			continue
		}
		if e.isThrottled(t.ID, t.ThrottleSeconds) {
			continue
		}
		e.fire(t, l)
	}
}

func (e *Engine) fire(t domain.Trigger, l *domain.Log) {
	e.throttle.Store(t.ID, time.Now())
	ev := FireEvent{
		TriggerID: t.ID,
		ProjectID: t.ProjectID,
		Log:       *l,
		Channels:  t.Channels,
	}
	data, err := json.Marshal(ev)
	if err != nil {
		log.Printf("trigger engine: marshal fire event: %v", err)
		return
	}
	if err := e.nats.Publish(events.SubjectTriggerFire, data); err != nil {
		log.Printf("trigger engine: publish %s: %v", events.SubjectTriggerFire, err)
	}
}

func (e *Engine) isThrottled(triggerID string, throttleSeconds int) bool {
	if throttleSeconds <= 0 {
		return false
	}
	v, ok := e.throttle.Load(triggerID)
	if !ok {
		return false
	}
	return time.Since(v.(time.Time)) < time.Duration(throttleSeconds)*time.Second
}

func conditionMatches(c domain.TriggerCondition, l *domain.Log) bool {
	if c.Level != "" && c.Level != l.Level {
		return false
	}
	if len(c.Folders) > 0 && !sliceContains(c.Folders, l.FolderID) {
		return false
	}
	if len(c.Tags) > 0 && !anyTagMatch(c.Tags, l.Tags) {
		return false
	}
	if c.MessageContains != "" && !strings.Contains(l.Message, c.MessageContains) {
		return false
	}
	if c.Environment != nil && *c.Environment != l.Environment {
		return false
	}
	return true
}

func sliceContains(slice []string, val string) bool {
	for _, s := range slice {
		if s == val {
			return true
		}
	}
	return false
}

func anyTagMatch(condTags, logTags []string) bool {
	for _, ct := range condTags {
		for _, lt := range logTags {
			if ct == lt {
				return true
			}
		}
	}
	return false
}
