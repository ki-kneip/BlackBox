package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/domain"
	issuerpkg "blackbox.io/core/internal/issuer"
	"blackbox.io/core/internal/storage"
	"blackbox.io/core/internal/worker"
	"github.com/gin-gonic/gin"
	"github.com/oklog/ulid/v2"
)

type LogHandler struct {
	store *storage.DB
	pool  *worker.Pool
}

func NewLogHandler(store *storage.DB, pool *worker.Pool) *LogHandler {
	return &LogHandler{store: store, pool: pool}
}

// ── Ingest ────────────────────────────────────────────────────────────────────

type ingestRequest struct {
	FolderID    string             `json:"folder_id"`
	Environment domain.Environment `json:"environment" binding:"required"`
	Level       domain.Level       `json:"level"       binding:"required"`
	Message     string             `json:"message"     binding:"required"`
	Tags        []string           `json:"tags"`
	Metadata    map[string]any     `json:"metadata"`
	Signature   string             `json:"signature"`
}

func (h *LogHandler) Ingest(c *gin.Context) {
	iss := middleware.IssuerFromCtx(c)
	if iss == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "issuer not in context"})
		return
	}

	var req ingestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !envAllowed(req.Environment, iss.AllowedEnvs) {
		c.JSON(http.StatusForbidden, gin.H{"error": "environment not allowed for this issuer"})
		return
	}
	if len(iss.AllowedFolders) > 0 && !folderAllowed(req.FolderID, iss.AllowedFolders) {
		c.JSON(http.StatusForbidden, gin.H{"error": "folder not allowed for this issuer"})
		return
	}

	if iss.RequireSignature {
		if req.Signature == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "signature required"})
			return
		}
		payload := issuerpkg.SignaturePayload(
			req.FolderID, string(req.Environment), string(req.Level), req.Message,
		)
		if err := issuerpkg.VerifyECDSA(iss.PublicKey, req.Signature, payload); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
			return
		}
	}

	projectID := c.GetString(middleware.CtxProjectID)
	log := domain.Log{
		ID:          ulid.Make().String(),
		ProjectID:   projectID,
		FolderID:    req.FolderID,
		Environment: req.Environment,
		Level:       req.Level,
		Message:     req.Message,
		Tags:        req.Tags,
		IssuerID:    iss.ID,
		Signature:   req.Signature,
		Metadata:    req.Metadata,
	}
	if log.Tags == nil {
		log.Tags = []string{}
	}

	h.pool.Enqueue(worker.Job{Payload: log})
	c.JSON(http.StatusAccepted, gin.H{"id": log.ID})
}

// ── Query ─────────────────────────────────────────────────────────────────────

func (h *LogHandler) Query(c *gin.Context) {
	projectID := c.GetString(middleware.CtxProjectID)
	m := middleware.MembershipFromCtx(c)

	q := storage.LogQuery{
		ProjectID:   projectID,
		FolderID:    c.Query("folder_id"),
		Level:       domain.Level(c.Query("level")),
		Environment: domain.Environment(c.Query("environment")),
		Cursor:      c.Query("cursor"),
		Limit:       parseLimit(c.Query("limit")),
		AllowedEnvs: m.EnvAccess,
	}

	if tags := c.Query("tags"); tags != "" {
		q.Tags = strings.Split(tags, ",")
	}

	logs, err := h.store.QueryLogs(c.Request.Context(), q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	var nextCursor string
	if len(logs) == q.Limit {
		nextCursor = logs[len(logs)-1].ID
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":        logs,
		"next_cursor": nextCursor,
		"has_more":    nextCursor != "",
	})
}

// ── helpers ───────────────────────────────────────────────────────────────────

func envAllowed(env domain.Environment, allowed []domain.Environment) bool {
	for _, a := range allowed {
		if a == env {
			return true
		}
	}
	return false
}

func folderAllowed(folderID string, allowed []string) bool {
	for _, a := range allowed {
		if a == folderID {
			return true
		}
	}
	return false
}

func parseLimit(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}
