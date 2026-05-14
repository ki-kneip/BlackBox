package issuer

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"strings"
)

// SignaturePayload returns the canonical byte slice that the issuer must sign.
// Format: "<folder_id>|<environment>|<level>|<message>" — deterministic and simple.
func SignaturePayload(folderID, environment, level, message string) []byte {
	return []byte(strings.Join([]string{folderID, environment, level, message}, "|"))
}

// VerifyECDSA verifies a base64-encoded ASN.1 DER ECDSA signature against the
// given PEM-encoded EC public key and canonical payload.
func VerifyECDSA(publicKeyPEM, signatureB64 string, payload []byte) error {
	block, _ := pem.Decode([]byte(publicKeyPEM))
	if block == nil {
		return errors.New("invalid PEM block")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return fmt.Errorf("parse public key: %w", err)
	}

	ecPub, ok := pub.(*ecdsa.PublicKey)
	if !ok {
		return errors.New("public key is not ECDSA")
	}

	sig, err := base64.StdEncoding.DecodeString(signatureB64)
	if err != nil {
		return fmt.Errorf("decode signature: %w", err)
	}

	hash := sha256.Sum256(payload)
	if !ecdsa.VerifyASN1(ecPub, hash[:], sig) {
		return errors.New("signature verification failed")
	}

	return nil
}
