package storage

import (
	"context"
	"errors"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func (s *DB) FoldersByProject(ctx context.Context, projectID string, includeArchived bool) ([]*domain.Folder, error) {
	filter := bson.M{"project_id": projectID}
	if !includeArchived {
		filter["archived"] = bson.M{"$ne": true}
	}

	cur, err := s.col("folders").Find(ctx, filter,
		options.Find().SetSort(bson.M{"name": 1}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var folders []*domain.Folder
	if err := cur.All(ctx, &folders); err != nil {
		return nil, err
	}
	return folders, nil
}

func (s *DB) FolderByID(ctx context.Context, folderID string) (*domain.Folder, error) {
	var f domain.Folder
	err := s.col("folders").FindOne(ctx, bson.M{"_id": folderID}).Decode(&f)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &f, err
}

func (s *DB) CreateFolder(ctx context.Context, f *domain.Folder) error {
	_, err := s.col("folders").InsertOne(ctx, f)
	return err
}

func (s *DB) ArchiveFolder(ctx context.Context, folderID, projectID string) error {
	_, err := s.col("folders").UpdateOne(ctx,
		bson.M{"_id": folderID, "project_id": projectID},
		bson.M{"$set": bson.M{"archived": true}},
	)
	return err
}
