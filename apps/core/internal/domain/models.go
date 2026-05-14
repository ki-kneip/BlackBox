package domain

import "time"

type Environment string

const (
	EnvDev        Environment = "dev"
	EnvProduction Environment = "production"
	EnvApp        Environment = "app"
)

type Level string

const (
	LevelDebug Level = "debug"
	LevelInfo  Level = "info"
	LevelWarn  Level = "warn"
	LevelError Level = "error"
	LevelFatal Level = "fatal"
)

type Role string

const (
	RoleOwner  Role = "owner"
	RoleAdmin  Role = "admin"
	RoleMember Role = "member"
	RoleViewer Role = "viewer"
)

type Log struct {
	ID          string            `bson:"_id"          json:"id"`
	ProjectID   string            `bson:"project_id"   json:"project_id"`
	FolderID    string            `bson:"folder_id"    json:"folder_id"`
	Environment Environment       `bson:"environment"  json:"environment"`
	Level       Level             `bson:"level"        json:"level"`
	Message     string            `bson:"message"      json:"message"`
	Tags        []string          `bson:"tags"         json:"tags"`
	IssuerID    string            `bson:"issuer_id"    json:"issuer_id"`
	Signature   string            `bson:"signature,omitempty" json:"signature,omitempty"`
	Metadata    map[string]any    `bson:"metadata,omitempty"  json:"metadata,omitempty"`
	PrevHash    string            `bson:"prev_hash"    json:"prev_hash"`
	Hash        string            `bson:"hash"         json:"hash"`
	Seq         int64             `bson:"seq"          json:"seq"`
	CreatedAt   time.Time         `bson:"created_at"   json:"created_at"`
	Readonly    bool              `bson:"_readonly"    json:"_readonly"`
}

type Issuer struct {
	ID               string        `bson:"_id"               json:"id"`
	Name             string        `bson:"name"              json:"name"`
	TokenHash        string        `bson:"token_hash"        json:"-"`
	RequireSignature bool          `bson:"require_signature" json:"require_signature"`
	PublicKey        string        `bson:"public_key,omitempty" json:"public_key,omitempty"`
	AllowedFolders   []string      `bson:"allowed_folders"   json:"allowed_folders"`
	AllowedEnvs      []Environment `bson:"allowed_envs"      json:"allowed_envs"`
	ProjectID        string        `bson:"project_id"        json:"project_id"`
	Active           bool          `bson:"active"            json:"active"`
	CreatedAt        time.Time     `bson:"created_at"        json:"created_at"`
}

type Folder struct {
	ID        string    `bson:"_id"       json:"id"`
	Name      string    `bson:"name"      json:"name"`
	ParentID  *string   `bson:"parent_id" json:"parent_id"`
	ProjectID string    `bson:"project_id" json:"project_id"`
	Tags      []string  `bson:"tags"      json:"tags"`
	Archived  bool      `bson:"archived"  json:"archived"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

type TriggerCondition struct {
	Level          Level       `bson:"level,omitempty"           json:"level,omitempty"`
	Folders        []string    `bson:"folders,omitempty"         json:"folders,omitempty"`
	Tags           []string    `bson:"tags,omitempty"            json:"tags,omitempty"`
	MessageContains string     `bson:"message_contains,omitempty" json:"message_contains,omitempty"`
	Environment    *Environment `bson:"environment,omitempty"     json:"environment,omitempty"`
}

type TriggerChannel struct {
	Type   string         `bson:"type"   json:"type"`
	Config map[string]any `bson:"config" json:"config"`
}

type Trigger struct {
	ID              string           `bson:"_id"              json:"id"`
	ProjectID       string           `bson:"project_id"       json:"project_id"`
	Active          bool             `bson:"active"           json:"active"`
	Condition       TriggerCondition `bson:"condition"        json:"condition"`
	ThrottleSeconds int              `bson:"throttle_seconds" json:"throttle_seconds"`
	Channels        []TriggerChannel `bson:"channels"         json:"channels"`
	CreatedAt       time.Time        `bson:"created_at"       json:"created_at"`
}

type Project struct {
	ID        string    `bson:"_id"        json:"id"`
	Name      string    `bson:"name"       json:"name"`
	Slug      string    `bson:"slug"       json:"slug"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

type User struct {
	ID           string    `bson:"_id"           json:"id"`
	Name         string    `bson:"name"          json:"name"`
	Email        string    `bson:"email"         json:"email"`
	PasswordHash string    `bson:"password_hash" json:"-"`
	CreatedAt    time.Time `bson:"created_at"    json:"created_at"`
}

// Membership links a User to a Project with a Role.
// EnvAccess restricts which environments the member can see (nil = all).
type Membership struct {
	ID        string      `bson:"_id"        json:"id"`
	ProjectID string      `bson:"project_id" json:"project_id"`
	UserID    string      `bson:"user_id"    json:"user_id"`
	Role      Role        `bson:"role"       json:"role"`
	EnvAccess []Environment `bson:"env_access,omitempty" json:"env_access,omitempty"`
	CreatedAt time.Time   `bson:"created_at" json:"created_at"`
}
