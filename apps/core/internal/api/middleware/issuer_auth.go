package middleware

import (
	"context"
	"net/http"

	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/issuer"
	"github.com/gin-gonic/gin"
)

const (
	CtxIssuerID = "issuerID"
	headerToken = "X-Issuer-Token"
)

type IssuerStore interface {
	ProjectBySlug(ctx context.Context, slug string) (*domain.Project, error)
	IssuerByTokenHash(ctx context.Context, tokenHash string) (*domain.Issuer, error)
}

// IssuerAuth authenticates log ingest requests using the X-Issuer-Token header.
// It does NOT require a JWT — issuers use their own tokens.
func IssuerAuth(store IssuerStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.GetHeader(headerToken)
		if raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing X-Issuer-Token"})
			return
		}

		slug := c.Param("projectSlug")
		project, err := store.ProjectBySlug(c.Request.Context(), slug)
		if err != nil || project == nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}

		tokenHash := issuer.Hash(raw)
		iss, err := store.IssuerByTokenHash(c.Request.Context(), tokenHash)
		if err != nil || iss == nil || iss.ProjectID != project.ID || !iss.Active {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid issuer token"})
			return
		}

		c.Set(CtxIssuerID, iss.ID)
		c.Set(CtxProjectID, project.ID)
		// Attach the full issuer so the handler can access AllowedFolders/Envs/RequireSignature.
		c.Set("issuer", iss)
		c.Next()
	}
}

func IssuerFromCtx(c *gin.Context) *domain.Issuer {
	v, _ := c.Get("issuer")
	iss, _ := v.(*domain.Issuer)
	return iss
}
