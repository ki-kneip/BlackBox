package issuer

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
)

const tokenBytes = 32

// Generate creates a cryptographically random token.
// Returns the raw value (shown once to the caller) and its SHA-256 hex digest (stored in DB).
// SHA-256 is appropriate here because the token has 256 bits of entropy — bcrypt is
// designed for low-entropy secrets (passwords) and adds unnecessary latency on every ingest call.
func Generate() (raw, hash string, err error) {
	b := make([]byte, tokenBytes)
	if _, err = rand.Read(b); err != nil {
		return
	}
	raw = hex.EncodeToString(b)
	hash = Hash(raw)
	return
}

// Hash returns the SHA-256 hex digest of a raw token.
func Hash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
