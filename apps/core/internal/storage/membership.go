package storage

import (
	"context"
	"errors"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func (s *DB) CreateMembership(ctx context.Context, m *domain.Membership) error {
	_, err := s.col("memberships").InsertOne(ctx, m)
	return err
}

// MembershipBySlug resolves the project by slug then returns the user's membership.
func (s *DB) MembershipBySlug(ctx context.Context, userID, slug string) (*domain.Membership, error) {
	var project domain.Project
	err := s.col("projects").FindOne(ctx, bson.M{"slug": slug}).Decode(&project)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var m domain.Membership
	err = s.col("memberships").FindOne(ctx, bson.M{
		"project_id": project.ID,
		"user_id":    userID,
	}).Decode(&m)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &m, err
}
