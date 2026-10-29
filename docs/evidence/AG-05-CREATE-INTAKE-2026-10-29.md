# AG-05 FluxCore Create intake acceptance

Repository: `Atlasfsp/AI-Frontend-Experience`
Branch: `codex/application-sme-intake`
Tested source: `c76259aa3440307a97b3f05f9a92bd35d79f8753`
Rebased base: `993ed241bdca21746d41147e33544487b09d2441`
PR: https://github.com/Atlasfsp/AI-Frontend-Experience/pull/47

The existing `/software-factory/prd-intake` route now includes a FluxCore Create conversational idea and optional custom-domain intake. It uses the existing authenticated SDX BFF, keeps the SME and engineering team explicitly proposed and unverified, shows unknown cost, and has no executable action. The shared shell and Signal Glass styling remain in place. Engineer navigation opens the current workspace selector with the same signed mock session. No project/repository or cross-surface proposal persistence is implemented.

## Validation on the rebased branch

- `pnpm --filter @bac/software-factory-web typecheck` — exit 0.
- Focused Vitest — 4 files, 10 tests passed. Covers permission denial, custom industry, malformed/failing responses, unknown cost, untrusted strings, and optional tenant expiry/config defaults.
- Changed-file ESLint — exit 0. ESLint emitted the repository `no-html-link-for-pages` warning because this app uses the App Router.
- `node scripts/acceptance/create-fixture.mjs` — passed in a local Next dev server on port 3400. The browser used a local fixture only. Anonymous compile was denied with 403 and made zero fixture requests. Authenticated forwarding preserved tenant/workspace and authorization context; proposal remained unverified and execution blocked; editing cleared the result; Engineer navigation reached `/software-factory/workspaces`.
- Screenshots at 390px and 1440px were regenerated and inspected. `documentWidth` matched each viewport width; no horizontal overflow appeared.

The acceptance record is `create-fixture/acceptance.json`; screenshots are `create-fixture/create-390.png` and `create-fixture/create-1440.png`. These prove fixture-backed UI/BFF behavior only. They do not verify the live Go backend, production identity, a qualified SME, durable project state, model/provider access, agent runtime, tests of generated code, preview, deployment, or release.

The PR was rebased onto the current `main` after GitHub reported a conflict. Conflict resolution kept the latest exported `@bac/config/cdn` import, the boolean-only feature-flag type fix, and the exact-optional-property-safe tenant override assignment. The source tree is clean after the rebase; generated TypeScript build metadata was discarded.
