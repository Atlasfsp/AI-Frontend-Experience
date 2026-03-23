# Staging Deployment Dry-Run

Build and validate all three BAC frontend applications in a production-like Docker environment.

## Prerequisites

- Docker and Docker Compose v2+
- `curl` and `jq` installed locally

## Applications

| App                      | Port | Description                  |
|--------------------------|------|------------------------------|
| software-factory-web     | 3000 | Software Factory dashboard   |
| platform-automation-web  | 3001 | Platform Automation console  |
| docs-portal              | 3002 | Documentation portal         |

## Usage

### Quick dry-run (build, start, health-check, stop)

```bash
./scripts/staging-dry-run.sh
```

### Manual control

```bash
# Build all images
docker compose -f deploy/staging/docker-compose.yml build

# Start services in the background
docker compose -f deploy/staging/docker-compose.yml up -d

# Tail logs
docker compose -f deploy/staging/docker-compose.yml logs -f

# Stop and remove containers
docker compose -f deploy/staging/docker-compose.yml down
```

### Environment variables

Override defaults by exporting variables or using a `.env` file next to the compose file:

| Variable       | Default              | Description              |
|----------------|----------------------|--------------------------|
| BAC_API_URL    | http://api:8080      | Backend API base URL     |
| BAC_REGION     | ng                   | Deployment region code   |
| SENTRY_DSN     | (empty)              | Sentry error tracking    |
