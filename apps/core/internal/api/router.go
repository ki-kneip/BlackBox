package api

import (
	"context"
	"net/http"
	"os"

	"blackbox.io/core/internal/api/handlers"
	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/api/ws"
	"blackbox.io/core/internal/auth"
	"blackbox.io/core/internal/storage"
	"blackbox.io/core/internal/worker"
	"github.com/gin-gonic/gin"
)

type Server struct {
	db   *storage.DB
	pool *worker.Pool
	http *http.Server
}

func NewServer(db *storage.DB, pool *worker.Pool) *Server {
	return &Server{db: db, pool: pool}
}

func (s *Server) Run(ctx context.Context) error {
	r := gin.New()
	r.Use(gin.Recovery())

	authH    := handlers.NewAuthHandler(s.db)
	projectH := handlers.NewProjectHandler(s.db)
	memberH  := handlers.NewMemberHandler(s.db)
	folderH  := handlers.NewFolderHandler(s.db)
	issuerH  := handlers.NewIssuerHandler(s.db)
	logH     := handlers.NewLogHandler(s.db, s.pool)
	triggerH := handlers.NewTriggerHandler(s.db)

	// ── Public ────────────────────────────────────────────────────────────────
	r.POST("/auth/register", authH.Register)
	r.POST("/auth/login", authH.Login)

	// ── Issuer-authenticated ingest (no JWT) ──────────────────────────────────
	// Issuers authenticate with X-Issuer-Token; this route must stay outside the
	// JWT group so SDKs/services can emit logs without user credentials.
	r.POST("/projects/:projectSlug/logs", middleware.IssuerAuth(s.db), logH.Ingest)

	// ── JWT-authenticated dashboard routes ────────────────────────────────────
	authed := r.Group("/", middleware.JWT())
	{
		authed.GET("/projects", projectH.List)
		authed.POST("/projects", projectH.Create)

		proj := authed.Group("/projects/:projectSlug", middleware.MembershipLoader(s.db))
		{
			// logs (read — for query and stream)
			proj.GET("/logs", logH.Query)
			proj.GET("/ws/logs", ws.LogStream(s.pool))

			// folders
			proj.GET("/folders", folderH.List)
			proj.POST("/folders", middleware.RequirePermission(auth.PermFoldersManage), folderH.Create)
			proj.PATCH("/folders/:folderID/archive", middleware.RequirePermission(auth.PermFoldersManage), folderH.Archive)

			// issuers
			proj.GET("/issuers", middleware.RequirePermission(auth.PermIssuersManage), issuerH.List)
			proj.POST("/issuers", middleware.RequirePermission(auth.PermIssuersManage), issuerH.Create)
			proj.DELETE("/issuers/:issuerID", middleware.RequirePermission(auth.PermIssuersManage), issuerH.Revoke)

			// triggers
			proj.GET("/triggers", middleware.RequirePermission(auth.PermTriggersManage), triggerH.List)
			proj.POST("/triggers", middleware.RequirePermission(auth.PermTriggersManage), triggerH.Create)
			proj.PATCH("/triggers/:triggerID", middleware.RequirePermission(auth.PermTriggersManage), triggerH.Update)

			// members
			proj.GET("/me", memberH.Me)
			proj.GET("/members", memberH.List)
			proj.POST("/members", middleware.RequirePermission(auth.PermMembersManage), memberH.Add)
			proj.PATCH("/members/:memberID", middleware.RequirePermission(auth.PermMembersManage), memberH.Update)
			proj.DELETE("/members/:memberID", middleware.RequirePermission(auth.PermMembersManage), memberH.Remove)
		}
	}

	s.http = &http.Server{
		Addr:    ":" + port(),
		Handler: r,
	}

	errCh := make(chan error, 1)
	go func() { errCh <- s.http.ListenAndServe() }()

	select {
	case <-ctx.Done():
		return s.http.Shutdown(context.Background())
	case err := <-errCh:
		return err
	}
}

func port() string {
	if p := os.Getenv("PORT"); p != "" {
		return p
	}
	return "8080"
}

