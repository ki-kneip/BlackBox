package handlers

import (
	"net/http"

	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/storage"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type TriggerHandler struct{ db *storage.DB }

func NewTriggerHandler(db *storage.DB) *TriggerHandler {
	return &TriggerHandler{db: db}
}

func (h *TriggerHandler) List(c *gin.Context) {
	m := middleware.MembershipFromCtx(c)
	triggers, err := h.db.ListTriggers(c.Request.Context(), m.ProjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, triggers)
}

type createTriggerBody struct {
	Condition       domain.TriggerCondition `json:"condition"`
	ThrottleSeconds int                     `json:"throttle_seconds"`
	Channels        []domain.TriggerChannel `json:"channels"`
}

func (h *TriggerHandler) Create(c *gin.Context) {
	m := middleware.MembershipFromCtx(c)
	var body createTriggerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t := &domain.Trigger{
		ProjectID:       m.ProjectID,
		Active:          true,
		Condition:       body.Condition,
		ThrottleSeconds: body.ThrottleSeconds,
		Channels:        body.Channels,
	}
	if err := h.db.CreateTrigger(c.Request.Context(), t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, t)
}

type updateTriggerBody struct {
	Active          *bool                    `json:"active"`
	Condition       *domain.TriggerCondition `json:"condition"`
	ThrottleSeconds *int                     `json:"throttle_seconds"`
	Channels        []domain.TriggerChannel  `json:"channels"`
}

func (h *TriggerHandler) Update(c *gin.Context) {
	m := middleware.MembershipFromCtx(c)
	triggerID := c.Param("triggerID")
	var body updateTriggerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	patch := bson.M{}
	if body.Active != nil {
		patch["active"] = *body.Active
	}
	if body.Condition != nil {
		patch["condition"] = *body.Condition
	}
	if body.ThrottleSeconds != nil {
		patch["throttle_seconds"] = *body.ThrottleSeconds
	}
	if body.Channels != nil {
		patch["channels"] = body.Channels
	}
	if len(patch) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}
	if err := h.db.UpdateTrigger(c.Request.Context(), triggerID, m.ProjectID, patch); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
