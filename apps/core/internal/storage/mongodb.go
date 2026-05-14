package storage

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type DB struct {
	client *mongo.Client
	db     *mongo.Database
}

func Connect(ctx context.Context, uri string) (*DB, error) {
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}
	return &DB{client: client, db: client.Database("blackbox")}, nil
}

func (s *DB) col(name string) *mongo.Collection {
	return s.db.Collection(name)
}

