package storage

import (
	"context"
	"errors"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// WriteLog inserts a log document. Must never be called with update/delete.
func (s *DB) WriteLog(ctx context.Context, log *domain.Log) error {
	log.Readonly = true
	_, err := s.col("logs").InsertOne(ctx, log)
	return err
}

// LastLogInFolder returns the highest-seq log in a folder for hash chaining.
func (s *DB) LastLogInFolder(ctx context.Context, folderID string) (*domain.Log, error) {
	var log domain.Log
	err := s.col("logs").FindOne(ctx,
		bson.M{"folder_id": folderID},
		options.FindOne().SetSort(bson.M{"seq": -1}),
	).Decode(&log)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &log, err
}

type LogQuery struct {
	ProjectID   string
	FolderID    string
	Environment domain.Environment
	Level       domain.Level
	Tags        []string
	AllowedEnvs []domain.Environment // enforced from membership.env_access
	Cursor      string               // last seen _id (ULID) for keyset pagination
	Limit       int
}

func (s *DB) QueryLogs(ctx context.Context, q LogQuery) ([]*domain.Log, error) {
	filter := bson.M{"project_id": q.ProjectID}

	if q.FolderID != "" {
		filter["folder_id"] = q.FolderID
	}
	if q.Level != "" {
		filter["level"] = string(q.Level)
	}
	if len(q.Tags) > 0 {
		filter["tags"] = bson.M{"$all": q.Tags}
	}

	// Environment filter: intersect user request with membership restriction.
	switch {
	case q.Environment != "" && len(q.AllowedEnvs) > 0:
		if !envIn(q.Environment, q.AllowedEnvs) {
			return []*domain.Log{}, nil // requested env not in access list → empty
		}
		filter["environment"] = string(q.Environment)
	case q.Environment != "":
		filter["environment"] = string(q.Environment)
	case len(q.AllowedEnvs) > 0:
		envs := make([]string, len(q.AllowedEnvs))
		for i, e := range q.AllowedEnvs {
			envs[i] = string(e)
		}
		filter["environment"] = bson.M{"$in": envs}
	}

	// Keyset pagination: ULIDs are lexicographically sortable by time.
	if q.Cursor != "" {
		filter["_id"] = bson.M{"$lt": q.Cursor}
	}

	limit := q.Limit
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	cur, err := s.col("logs").Find(ctx, filter,
		options.Find().
			SetSort(bson.M{"_id": -1}).
			SetLimit(int64(limit)),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var logs []*domain.Log
	if err := cur.All(ctx, &logs); err != nil {
		return nil, err
	}
	return logs, nil
}

func envIn(env domain.Environment, list []domain.Environment) bool {
	for _, e := range list {
		if e == env {
			return true
		}
	}
	return false
}
