package chain

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
)

// HashPayload contains the canonical fields that form the hash input.
// Excludes hash and _readonly to avoid circular dependency.
type HashPayload struct {
	ID          string   `json:"id"`
	FolderID    string   `json:"folder_id"`
	Environment string   `json:"environment"`
	Level       string   `json:"level"`
	Message     string   `json:"message"`
	Tags        []string `json:"tags"`
	IssuerID    string   `json:"issuer_id"`
	PrevHash    string   `json:"prev_hash"`
	Seq         int64    `json:"seq"`
}

// Compute returns SHA-256(JSON(payload) + prevHash).
func Compute(payload HashPayload, prevHash string) (string, error) {
	b, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	h := sha256.New()
	h.Write(b)
	h.Write([]byte(prevHash))
	return hex.EncodeToString(h.Sum(nil)), nil
}
