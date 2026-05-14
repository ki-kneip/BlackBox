package handlers

import (
	"net/http"
	"time"

	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/issuer"
	"blackbox.io/core/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/oklog/ulid/v2"
)

type IssuerHandler struct {
	store *storage.DB
}

func NewIssuerHandler(store *storage.DB) *IssuerHandler {
	return &IssuerHandler{store: store}
}

func (h *IssuerHandler) List(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)

	issuers, err := h.store.IssuersByProject(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"issuers": issuers})
}

type createIssuerRequest struct {
	Name             string               `json:"name"              binding:"required"`
	RequireSignature bool                 `json:"require_signature"`
	PublicKey        string               `json:"public_key"`
	AllowedFolders   []string             `json:"allowed_folders"`
	AllowedEnvs      []domain.Environment `json:"allowed_envs"`
}

func (h *IssuerHandler) Create(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)

	var req createIssuerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.RequireSignature && req.PublicKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "public_key is required when require_signature is true"})
		return
	}

	if len(req.AllowedEnvs) == 0 {
		req.AllowedEnvs = []domain.Environment{domain.EnvDev, domain.EnvProduction, domain.EnvApp}
	}

	raw, hash, err := issuer.Generate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	iss := &domain.Issuer{
		ID:               ulid.Make().String(),
		Name:             req.Name,
		TokenHash:        hash,
		RequireSignature: req.RequireSignature,
		PublicKey:        req.PublicKey,
		AllowedFolders:   req.AllowedFolders,
		AllowedEnvs:      req.AllowedEnvs,
		ProjectID:        projectID,
		Active:           true,
		CreatedAt:        time.Now().UTC(),
	}

	if err := h.store.CreateIssuer(c.Request.Context(), iss); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// token is returned only once — never retrievable again.
	c.JSON(http.StatusCreated, gin.H{
		"issuer": iss,
		"token":  raw,
	})
}

func (h *IssuerHandler) Revoke(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)
	issuerID := c.Param("issuerID")

	iss, err := h.store.IssuerByID(c.Request.Context(), issuerID)
	if err != nil || iss == nil || iss.ProjectID != projectID {
		c.JSON(http.StatusNotFound, gin.H{"error": "issuer not found"})
		return
	}
	if !iss.Active {
		c.JSON(http.StatusConflict, gin.H{"error": "issuer is already revoked"})
		return
	}

	if err := h.store.RevokeIssuer(c.Request.Context(), issuerID, projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
