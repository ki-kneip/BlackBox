package client_test

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"
)

var (
	apiURL    = flag.String("api", "http://localhost:8080", "Core API base URL")
	slug      = flag.String("slug", "teste-123", "Project slug")
	folderID  = flag.String("folder", "", "Folder ID (empty = root)")
	issuerTok = flag.String("token", "", "Issuer token for authentication")
)

type logRequest struct {
	FolderID    string         `json:"folder_id,omitempty"`
	Environment string         `json:"environment"`
	Level       string         `json:"level"`
	Message     string         `json:"message"`
	Tags        []string       `json:"tags"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

func emit(t *testing.T, level, env, message string, meta map[string]any) string {
	t.Helper()

	body, _ := json.Marshal(logRequest{
		FolderID:    *folderID,
		Environment: env,
		Level:       level,
		Message:     message,
		Tags:        []string{"test", level},
		Metadata:    meta,
	})

	req, _ := http.NewRequest(http.MethodPost,
		fmt.Sprintf("%s/projects/%s/logs", *apiURL, *slug),
		bytes.NewReader(body),
	)
	req.Header.Set("X-Issuer-Token", *issuerTok)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusAccepted {
		t.Fatalf("status %d: %s", resp.StatusCode, raw)
	}

	var result struct {
		ID string `json:"id"`
	}
	json.Unmarshal(raw, &result)
	t.Logf("[%s/%s] %s → %s", level, env, message, result.ID)
	return result.ID
}

func TestEmitSingleLog(t *testing.T) {
	emit(t, "info", "dev", "hello from client_test", map[string]any{
		"source": "go-test",
		"time":   time.Now().Format(time.RFC3339),
	})
}

func TestEmitAllLevels(t *testing.T) {
	for _, lvl := range []string{"debug", "info", "warn", "error", "fatal"} {
		emit(t, lvl, "dev", fmt.Sprintf("level test — %s", lvl), nil)
	}
}

func TestEmitBurst(t *testing.T) {
	for i := range 20 {
		emit(t, "info", "dev", fmt.Sprintf("burst log #%02d", i+1), map[string]any{"index": i + 1})
	}
}

func TestEmitMultiEnv(t *testing.T) {
	for _, env := range []string{"dev", "production", "app"} {
		emit(t, "warn", env, fmt.Sprintf("multi-env — %s", env), nil)
	}
}
