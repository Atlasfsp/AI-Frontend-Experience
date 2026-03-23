# Architecture Summary

Use [ARCHITECTURE.md](/Users/AbiolaOgunsakin1/Workflows/AI-Frontend-Experience/docs/ARCHITECTURE.md) as the canonical repository architecture guide.

Short version:

- this repo is the BAC web experience layer
- it serves AI Software Factory, AI Platform Automation, and Docs Portal
- Next.js 15, strict TypeScript, Tailwind v4, shared `@bac/*` packages, Authentik-oriented auth, BFF proxy routes, and mock-first client seams form the baseline
- shared UI, auth, config, observability, and API packages carry the long-term maintainability load
