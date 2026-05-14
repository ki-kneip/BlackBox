package middleware

import (
	"context"
	"net/http"

	"blackbox.io/core/internal/domain"
	"github.com/gin-gonic/gin"
)

// MembershipLoader fetches the user's Membership for the project in the URL
// and stores it in the context. Must run after JWT().
func MembershipLoader(store MembershipStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString(CtxUserID)
		projectSlug := c.Param("projectSlug")

		m, err := store.MembershipBySlug(c.Request.Context(), userID, projectSlug)
		if err != nil || m == nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "not a member of this project"})
			return
		}
		c.Set(CtxMembership, m)
		c.Set(CtxProjectID, m.ProjectID)
		c.Next()
	}
}

func MembershipFromCtx(c *gin.Context) *domain.Membership {
	v, exists := c.Get(CtxMembership)
	if !exists {
		return nil
	}
	m, _ := v.(*domain.Membership)
	return m
}

type MembershipStore interface {
	MembershipBySlug(ctx context.Context, userID, projectSlug string) (*domain.Membership, error)
}
