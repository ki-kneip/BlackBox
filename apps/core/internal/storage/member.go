package storage

import (
	"context"

	"blackbox.io/core/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type MemberRow struct {
	ID        string               `bson:"_id"        json:"id"`
	UserID    string               `bson:"user_id"    json:"user_id"`
	Name      string               `bson:"name"       json:"name"`
	Email     string               `bson:"email"      json:"email"`
	Role      domain.Role          `bson:"role"       json:"role"`
	EnvAccess []domain.Environment `bson:"env_access" json:"env_access"`
	CreatedAt interface{}          `bson:"created_at" json:"created_at"`
}

func (s *DB) MembersWithUsers(ctx context.Context, projectID string) ([]MemberRow, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"project_id": projectID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}}},
		{{Key: "$unwind", Value: "$user"}},
		{{Key: "$project", Value: bson.M{
			"user_id":    1,
			"role":       1,
			"env_access": 1,
			"created_at": 1,
			"name":       "$user.name",
			"email":      "$user.email",
		}}},
		{{Key: "$sort", Value: bson.M{"created_at": 1}}},
	}

	cur, err := s.col("memberships").Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var rows []MemberRow
	if err := cur.All(ctx, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func (s *DB) MembershipByID(ctx context.Context, memberID string) (*domain.Membership, error) {
	var m domain.Membership
	err := s.col("memberships").FindOne(ctx, bson.M{"_id": memberID}).Decode(&m)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	return &m, err
}

func (s *DB) MembershipExistsByUser(ctx context.Context, projectID, userID string) (bool, error) {
	count, err := s.col("memberships").CountDocuments(ctx,
		bson.M{"project_id": projectID, "user_id": userID},
	)
	return count > 0, err
}

func (s *DB) UpdateMembership(ctx context.Context, memberID string, role domain.Role, envAccess []domain.Environment) error {
	update := bson.M{"$set": bson.M{"role": role, "env_access": envAccess}}
	_, err := s.col("memberships").UpdateOne(ctx, bson.M{"_id": memberID}, update)
	return err
}

func (s *DB) DeleteMembership(ctx context.Context, memberID string) error {
	_, err := s.col("memberships").DeleteOne(ctx, bson.M{"_id": memberID})
	return err
}

func (s *DB) CountOwners(ctx context.Context, projectID string) (int64, error) {
	return s.col("memberships").CountDocuments(ctx,
		bson.M{"project_id": projectID, "role": domain.RoleOwner},
	)
}
