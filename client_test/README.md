# client_test

Test suite for emitting logs to a running BlackBox instance.

## Usage

```bash
go test -v -run <TestName> -token=<issuer-token> [flags]
```

### Flags

| Flag | Default | Description |
|---|---|---|
| `-token` | — | Issuer token **(required)** |
| `-slug` | `teste-123` | Project slug |
| `-folder` | *(empty = root)* | Folder ID to emit into |
| `-api` | `http://localhost:8080` | Core API base URL |

### Tests

| Test | What it does |
|---|---|
| `TestEmitSingleLog` | Emits one `info` log with metadata |
| `TestEmitAllLevels` | Emits one log per level: debug → fatal |
| `TestEmitBurst` | Emits 20 sequential logs (stress the hash chain) |
| `TestEmitMultiEnv` | Emits `warn` logs across all three environments |

### Examples

```bash
# single log to root
go test -v -run TestEmitSingleLog -token=<token>

# burst into a specific folder
go test -v -run TestEmitBurst -token=<token> -folder=<folder-id>

# all levels against a different API
go test -v -run TestEmitAllLevels -token=<token> -api=http://localhost:8080

# run everything
go test -v -token=<token>
```
