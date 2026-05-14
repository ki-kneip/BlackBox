package handlers

import (
	"net/http"
	"strings"
	"time"

	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/oklog/ulid/v2"
)

type FolderHandler struct {
	store *storage.DB
}

func NewFolderHandler(store *storage.DB) *FolderHandler {
	return &FolderHandler{store: store}
}

func (h *FolderHandler) List(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)
	includeArchived := c.Query("archived") == "true"

	folders, err := h.store.FoldersByProject(c.Request.Context(), projectID, includeArchived)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"folders": folders})
}

type createFolderRequest struct {
	Name     string  `json:"name"      binding:"required"`
	ParentID *string `json:"parent_id"`
}

func (h *FolderHandler) Create(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)

	var req createFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	// Validate parent belongs to the same project and is not archived.
	if req.ParentID != nil && *req.ParentID != "" {
		parent, err := h.store.FolderByID(c.Request.Context(), *req.ParentID)
		if err != nil || parent == nil || parent.ProjectID != projectID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "parent folder not found"})
			return
		}
		if parent.Archived {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot create a folder under an archived parent"})
			return
		}
	}

	folder := &domain.Folder{
		ID:        ulid.Make().String(),
		Name:      req.Name,
		ParentID:  req.ParentID,
		ProjectID: projectID,
		Tags:      []string{},
		Archived:  false,
		CreatedAt: time.Now().UTC(),
	}

	if err := h.store.CreateFolder(c.Request.Context(), folder); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"folder": folder})
}

func (h *FolderHandler) Archive(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)
	folderID := c.Param("folderID")

	folder, err := h.store.FolderByID(c.Request.Context(), folderID)
	if err != nil || folder == nil || folder.ProjectID != projectID {
		c.JSON(http.StatusNotFound, gin.H{"error": "folder not found"})
		return
	}
	if folder.Archived {
		c.JSON(http.StatusConflict, gin.H{"error": "folder is already archived"})
		return
	}

	if err := h.store.ArchiveFolder(c.Request.Context(), folderID, projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
