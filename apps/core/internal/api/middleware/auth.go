package middleware

import (
	"net/http"
	"strings"

	"blackbox.io/core/internal/auth"
	"github.com/gin-gonic/gin"
)

const (
	CtxUserID     = "userID"
	CtxUserEmail  = "userEmail"
	CtxMembership = "membership"
	CtxProjectID  = "projectID"
)

func JWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := ""

		// Authorization header takes priority (REST).
		if h := c.GetHeader("Authorization"); strings.HasPrefix(h, "Bearer ") {
			tokenStr = strings.TrimPrefix(h, "Bearer ")
		}

		// Fall back to ?token= query param — used by WebSocket connections
		// since browsers cannot set custom headers on WS upgrades.
		if tokenStr == "" {
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		claims, err := auth.Verify(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxUserEmail, claims.Email)
		c.Next()
	}
}

func RequirePermission(perm auth.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		// membership is attached by a project-scoped loader middleware (see router.go)
		m := MembershipFromCtx(c)
		if m == nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no project membership"})
			return
		}
		if !auth.Can(m.Role, perm) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			return
		}
		c.Next()
	}
}
