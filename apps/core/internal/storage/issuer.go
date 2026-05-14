package storage

import (
	"context"
	"errors"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func (s *DB) IssuersByProject(ctx context.Context, projectID string) ([]*domain.Issuer, error) {
	cur, err := s.col("issuers").Find(ctx,
		bson.M{"project_id": projectID},
		options.Find().SetSort(bson.M{"created_at": -1}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var issuers []*domain.Issuer
	if err := cur.All(ctx, &issuers); err != nil {
		return nil, err
	}
	return issuers, nil
}

func (s *DB) IssuerByID(ctx context.Context, issuerID string) (*domain.Issuer, error) {
	var issuer domain.Issuer
	err := s.col("issuers").FindOne(ctx, bson.M{"_id": issuerID}).Decode(&issuer)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &issuer, err
}

// IssuerByTokenHash looks up an active issuer by its SHA-256 token hash.
func (s *DB) IssuerByTokenHash(ctx context.Context, tokenHash string) (*domain.Issuer, error) {
	var iss domain.Issuer
	err := s.col("issuers").FindOne(ctx, bson.M{"token_hash": tokenHash, "active": true}).Decode(&iss)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &iss, err
}

func (s *DB) ActiveIssuersByProject(ctx context.Context, projectID string) ([]*domain.Issuer, error) {
	cur, err := s.col("issuers").Find(ctx, bson.M{"project_id": projectID, "active": true})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var issuers []*domain.Issuer
	return issuers, cur.All(ctx, &issuers)
}

func (s *DB) CreateIssuer(ctx context.Context, issuer *domain.Issuer) error {
	_, err := s.col("issuers").InsertOne(ctx, issuer)
	return err
}

// RevokeIssuer sets active=false — never deletes.
func (s *DB) RevokeIssuer(ctx context.Context, issuerID, projectID string) error {
	_, err := s.col("issuers").UpdateOne(ctx,
		bson.M{"_id": issuerID, "project_id": projectID},
		bson.M{"$set": bson.M{"active": false}},
	)
	return err
}
