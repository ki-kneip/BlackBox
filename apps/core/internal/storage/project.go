package storage

import (
	"context"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func (s *DB) CreateProject(ctx context.Context, p *domain.Project) error {
	_, err := s.col("projects").InsertOne(ctx, p)
	return err
}

func (s *DB) ProjectSlugExists(ctx context.Context, slug string) (bool, error) {
	count, err := s.col("projects").CountDocuments(ctx, bson.M{"slug": slug})
	return count > 0, err
}

func (s *DB) ProjectsByUser(ctx context.Context, userID string) ([]*domain.Project, error) {
	cur, err := s.col("memberships").Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var memberships []domain.Membership
	if err := cur.All(ctx, &memberships); err != nil {
		return nil, err
	}
	if len(memberships) == 0 {
		return []*domain.Project{}, nil
	}

	ids := make([]string, len(memberships))
	for i, m := range memberships {
		ids[i] = m.ProjectID
	}

	cur2, err := s.col("projects").Find(ctx,
		bson.M{"_id": bson.M{"$in": ids}},
		options.Find().SetSort(bson.M{"created_at": 1}),
	)
	if err != nil {
		return nil, err
	}
	defer cur2.Close(ctx)

	var projects []*domain.Project
	if err := cur2.All(ctx, &projects); err != nil {
		return nil, err
	}
	return projects, nil
}
