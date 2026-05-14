package handlers

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/oklog/ulid/v2"
)

type ProjectHandler struct {
	store *storage.DB
}

func NewProjectHandler(store *storage.DB) *ProjectHandler {
	return &ProjectHandler{store: store}
}

var slugRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$`)

func (h *ProjectHandler) List(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)

	projects, err := h.store.ProjectsByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

type createProjectRequest struct {
	Name string `json:"name" binding:"required"`
	Slug string `json:"slug" binding:"required"`
}

func (h *ProjectHandler) Create(c *gin.Context) {
	userID := c.GetString(middleware.CtxUserID)

	var req createProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.Slug = strings.ToLower(strings.TrimSpace(req.Slug))
	if !slugRe.MatchString(req.Slug) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug must be 3–50 lowercase letters, numbers or hyphens (no leading/trailing hyphen)"})
		return
	}

	exists, err := h.store.ProjectSlugExists(c.Request.Context(), req.Slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "slug already taken"})
		return
	}

	now := time.Now().UTC()
	project := &domain.Project{
		ID:        ulid.Make().String(),
		Name:      strings.TrimSpace(req.Name),
		Slug:      req.Slug,
		CreatedAt: now,
	}

	if err := h.store.CreateProject(c.Request.Context(), project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	membership := &domain.Membership{
		ID:        ulid.Make().String(),
		ProjectID: project.ID,
		UserID:    userID,
		Role:      domain.RoleOwner,
		CreatedAt: now,
	}
	if err := h.store.CreateMembership(c.Request.Context(), membership); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"project": project})
}
