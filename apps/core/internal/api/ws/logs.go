package ws

import (
	"net/http"
	"time"

	"blackbox.io/core/internal/api/middleware"
	"blackbox.io/core/internal/domain"
	"blackbox.io/core/internal/worker"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = 45 * time.Second
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// LogStream upgrades the connection and streams new logs for the project in real time.
// Auth is handled by JWT + MembershipLoader middleware that run before this handler.
// Query params: folder_id, level, environment
func LogStream(pool *worker.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		m := middleware.MembershipFromCtx(c)
		if m == nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no project membership"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		conn.SetReadDeadline(time.Now().Add(pongWait))
		conn.SetPongHandler(func(string) error {
			conn.SetReadDeadline(time.Now().Add(pongWait))
			return nil
		})

		filter := domain.LogFilter{
			ProjectID:   m.ProjectID,
			FolderID:    c.Query("folder_id"),
			Level:       domain.Level(c.Query("level")),
			Environment: domain.Environment(c.Query("environment")),
			AllowedEnvs: m.EnvAccess,
		}

		sub := pool.Subscribe(filter)
		defer pool.Unsubscribe(sub)

		ticker := time.NewTicker(pingPeriod)
		defer ticker.Stop()

		for {
			select {
			case log, ok := <-sub.Ch:
				if !ok {
					return
				}
				conn.SetWriteDeadline(time.Now().Add(writeWait))
				if err := conn.WriteJSON(log); err != nil {
					return
				}
			case <-ticker.C:
				conn.SetWriteDeadline(time.Now().Add(writeWait))
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-c.Request.Context().Done():
				return
			}
		}
	}
}
