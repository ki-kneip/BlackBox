# BlackBox

Immutable, hash-chained log service. Self-hosted or SaaS.

Every log is SHA-256 chained to the previous one in its folder — making tampering detectable. Logs are write-once, never updated, never deleted.

---

## Stack

| Layer | Tech |
|---|---|
| Core API | Go · Gin · MongoDB |
| Dashboard | Next.js 15 · App Router · Tailwind |
| Message broker | NATS *(M9)* |
| Notifications | Node.js *(M10)* |

---

## Running locally

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| Core API | http://localhost:8080 |

MongoDB and NATS run on an internal network — not exposed to the host.

---

## Architecture

```
Issuer → POST /projects/:slug/logs
           │
           ▼
        Worker pool
        (per-folder mutex → hash chain → MongoDB)
           │
           ▼
        WebSocket broadcast → Dashboard (live stream)
```

**Ingest flow:**
1. Issuer token validated (SHA-256 lookup)
2. Signature verified if `require_signature = true` (ECDSA P-256)
3. Job enqueued to worker pool — response is immediate (202)
4. Worker acquires per-folder lock, computes `hash = SHA256(payload + prev_hash)`, writes to MongoDB
5. Log broadcast to active WebSocket subscribers matching project + filters

---

## RBAC

| Role | Logs | Folders | Issuers | Members |
|---|---|---|---|---|
| viewer | read | read | — | — |
| member | read | create | — | — |
| admin | read | manage | manage | manage |
| owner | read | manage | manage | manage + transfer |

Members can be restricted to specific environments via `env_access`.

---

## Domain

### Log
```json
{
  "_id":         "ULID",
  "folder_id":   "string",
  "environment": "dev | production | app",
  "level":       "debug | info | warn | error | fatal",
  "message":     "string",
  "tags":        ["string"],
  "issuer_id":   "string",
  "signature":   "string (optional)",
  "metadata":    {},
  "prev_hash":   "sha256",
  "hash":        "sha256",
  "seq":         42,
  "created_at":  "ISO8601",
  "_readonly":   true
}
```

### Issuer
Certificate that authorizes log emission. Token is shown once on creation and never stored in plaintext — only its SHA-256 hash is persisted.

---

## Emitting logs

```bash
curl -X POST http://localhost:8080/projects/<slug>/logs \
  -H "X-Issuer-Token: <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "dev",
    "level": "info",
    "message": "hello world",
    "tags": ["backend"]
  }'
```

Or use the Go test suite in [`client_test/`](./client_test/README.md).

---

## Project structure

```
blackbox/
├── apps/
│   ├── core/           Go — REST API + worker pool
│   ├── notifications/  Node.js — multi-channel dispatcher (M10)
│   └── web/            Next.js — dashboard
├── packages/
│   ├── contracts/      Shared JSON schemas
│   └── sdk/            Go + JS client SDKs
├── infra/
│   ├── docker/
│   └── k8s/
├── client_test/        Go test suite for log emission
└── docker-compose.yml
```

---

## Hard rules

- **Logs are immutable.** No update or delete on the `logs` collection. Ever.
- **No TTL.** Retention is managed via folder archiving only.
- **Archived ≠ deleted.** Archived folders remain queryable.
- **Hash chain must be continuous.** Every log references `prev_hash` of the previous log in the same folder.
- **Issuer scope is enforced.** Logs are rejected if the issuer's `allowed_folders` or `allowed_envs` doesn't include the target.
