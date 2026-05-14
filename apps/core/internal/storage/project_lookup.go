package storage

import (
	"context"
	"errors"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func (s *DB) ProjectBySlug(ctx context.Context, slug string) (*domain.Project, error) {
	var p domain.Project
	err := s.col("projects").FindOne(ctx, bson.M{"slug": slug}).Decode(&p)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &p, err
}
