# BAC Ecosystem — Repository Catalog

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** IMMUTABLE BASELINE — Read before any Codex/Antigravity work

---

## 3-Layer Strategic Model

| Layer | Repositories |
|-------|-------------|
| **DESIGN** | Design-Factory_Stitch, Design-Factory_Figma |
| **BACKEND / CONTROL** | AI-Software-Factory, AI-Platform-Automation |
| **EXPERIENCE** | AI-Frontend-Experience, AI-Companion-Mobile |

---

## Repository Descriptions (Authoritative)

| # | Repository | GitHub Description |
|---|-----------|-------------------|
| 1 | **AI-Software-Factory** | AI-first software generation system for turning PRDs into production-ready services, APIs, tests, docs, and Swagger/OpenAPI compliance workflows. |
| 2 | **AI-Platform-Automation** | BAC platform automation control plane for tenancy, workspace provisioning, promises, GitOps rollout, observability, policy, and governed infrastructure automation. |
| 3 | **Design-Factory_Stitch** | Prompt-driven UI concept generation system for producing broad, high-velocity enterprise design directions and multi-screen UX explorations in Stitch. |
| 4 | **Design-Factory_Figma** | Interactive design convergence system for refining Stitch concepts into production-intent Figma/Figma Make design systems, flows, components, and handoff-ready UI architecture. |
| 5 | **AI-Frontend-Experience** | Unified web frontend experience layer for AI Software Factory and AI Platform Automation, including shared UI, design tokens, docs portal, and Swagger/API explorer. |
| 6 | **AI-Companion-Mobile** | Mobile companion app for alerts, approvals, incidents, monitoring, and quick actions across AI Software Factory and AI Platform Automation. |

---

## Boundary Rules

- Each repo description defines the COMPLETE scope of that repo
- No repo may assume responsibilities described in another repo's entry
- Backend repos produce API contracts; they do not render UI
- Design repos produce design artifacts; they do not run API servers
- Experience repos consume contracts and tokens; they do not define them
- Stitch explores; it does not produce production-intent designs
- Figma converges; it does not explore

---

## Operating Constraint

Any agent (Codex, Antigravity, Claude, or future automation) MUST read this file before beginning work on the ecosystem. Violation of repo boundaries invalidates the work product.
