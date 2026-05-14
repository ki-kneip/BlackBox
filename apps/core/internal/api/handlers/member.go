package handlers

import (
	"net/http"
	"time"

	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/oklog/ulid/v2"
)

type MemberHandler struct {
	store *storage.DB
}

func NewMemberHandler(store *storage.DB) *MemberHandler {
	return &MemberHandler{store: store}
}

// Me returns the current user's membership for this project.
func (h *MemberHandler) Me(c *gin.Context) {
	m := middleware.MembershipFromCtx(c)
	c.JSON(http.StatusOK, gin.H{
		"role":       m.Role,
		"env_access": m.EnvAccess,
	})
}

// List returns all members with their user info.
func (h *MemberHandler) List(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)

	rows, err := h.store.MembersWithUsers(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"members": rows})
}

type addMemberRequest struct {
	Email     string               `json:"email"      binding:"required,email"`
	Role      domain.Role          `json:"role"       binding:"required"`
	EnvAccess []domain.Environment `json:"env_access"`
}

// Add invites a user by email into the project.
func (h *MemberHandler) Add(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)

	var req addMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role == domain.RoleOwner {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot assign owner role directly — transfer ownership instead"})
		return
	}

	user, err := h.store.UserByEmail(c.Request.Context(), req.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no user found with that email"})
		return
	}

	exists, err := h.store.MembershipExistsByUser(c.Request.Context(), projectID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "user is already a member"})
		return
	}

	m := &domain.Membership{
		ID:        ulid.Make().String(),
		ProjectID: projectID,
		UserID:    user.ID,
		Role:      req.Role,
		EnvAccess: req.EnvAccess,
		CreatedAt: time.Now().UTC(),
	}
	if err := h.store.CreateMembership(c.Request.Context(), m); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"member": m})
}

type updateMemberRequest struct {
	Role      domain.Role          `json:"role"`
	EnvAccess []domain.Environment `json:"env_access"`
}

// Update changes a member's role or env_access.
func (h *MemberHandler) Update(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)
	memberID := c.Param("memberID")

	var req updateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	target, err := h.store.MembershipByID(c.Request.Context(), memberID)
	if err != nil || target == nil || target.ProjectID != projectID {
		c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
		return
	}

	// Guard: cannot demote the last owner.
	if target.Role == domain.RoleOwner && req.Role != domain.RoleOwner {
		count, err := h.store.CountOwners(c.Request.Context(), projectID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		if count <= 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "project must have at least one owner"})
			return
		}
	}

	if err := h.store.UpdateMembership(c.Request.Context(), memberID, req.Role, req.EnvAccess); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Remove removes a member from the project.
func (h *MemberHandler) Remove(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)
	memberID := c.Param("memberID")
	callerID := c.GetString(middleware.CtxUserID)

	target, err := h.store.MembershipByID(c.Request.Context(), memberID)
	if err != nil || target == nil || target.ProjectID != projectID {
		c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
		return
	}

	if target.UserID == callerID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot remove yourself — transfer ownership first"})
		return
	}

	if target.Role == domain.RoleOwner {
		count, err := h.store.CountOwners(c.Request.Context(), projectID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		if count <= 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "project must have at least one owner"})
			return
		}
	}

	if err := h.store.DeleteMembership(c.Request.Context(), memberID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
