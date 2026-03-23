# Load Testing

## Prerequisites
- Install k6: `brew install k6`
- Start the target app: `pnpm dev`

## Run
```bash
k6 run tests/load/bff-proxy.js
k6 run --env BASE_URL=https://staging.bac.io tests/load/bff-proxy.js
```

## CI Integration
The load test runs on release branches only (not on every PR).
