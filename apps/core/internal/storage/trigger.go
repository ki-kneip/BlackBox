package storage

import (
	"context"
	"time"

	"blackbox.io/core/internal/domain"
	"github.com/oklog/ulid/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func (db *DB) CreateTrigger(ctx context.Context, t *domain.Trigger) error {
	t.ID = ulid.Make().String()
	t.CreatedAt = time.Now().UTC()
	_, err := db.col("triggers").InsertOne(ctx, t)
	return err
}

func (db *DB) ListTriggers(ctx context.Context, projectID string) ([]domain.Trigger, error) {
	cur, err := db.col("triggers").Find(ctx, bson.M{"project_id": projectID})
	if err != nil {
		return nil, err
	}
	var out []domain.Trigger
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (db *DB) UpdateTrigger(ctx context.Context, triggerID, projectID string, patch bson.M) error {
	_, err := db.col("triggers").UpdateOne(ctx,
		bson.M{"_id": triggerID, "project_id": projectID},
		bson.M{"$set": patch},
	)
	return err
}
