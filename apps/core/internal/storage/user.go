package storage

import (
	"context"
	"errors"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func (s *DB) CreateUser(ctx context.Context, user *domain.User) error {
	_, err := s.col("users").InsertOne(ctx, user)
	return err
}

func (s *DB) UserByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := s.col("users").FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &user, err
}

func (s *DB) UserExistsByEmail(ctx context.Context, email string) (bool, error) {
	count, err := s.col("users").CountDocuments(ctx, bson.M{"email": email})
	return count > 0, err
}
