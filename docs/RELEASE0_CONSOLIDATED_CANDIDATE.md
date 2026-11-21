# Release 0 consolidated frontend candidate

AUTHOR_RUN_LOCAL_DEVELOPMENT. NO-GO. `production_ready=false`,
`execution_authorized=false`, 0/18 independently attested gates.

## Preserved provenance

Based on canonical `Atlasfsp/AI-Frontend-Experience` main `e0ca396`.
No cherry-picked duplicate implementations, shared-branch history rewrites,
or automatic closure of the original pull requests.

| PR | Preserved head | Scope |
|---|---|---|
| [#57](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/57) | `2f7a7e4033691f2e33b3e0c73def2a501c400c01` | Authenticated Create/Engineer and fail-closed release packaging |
| [#58](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/58) | `dc95e4448275969fb194771a8bacf2f9e954dc22` | Integrated journey, exact unresolved retry and reload |
| [#59](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/59) | `22932db4d6abbc9f4375d00d3fece26f2e038aa6` | Decision context, tasks and audit paging |
| [#61](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/61) | `e7b12000ca3c8a9461359a3ae12c1daebd82eeeb` | Unconfirmed-write fence |
| [#62](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/62) | `236ec2a43ca5cefedf11df1d42daf2588aaf40c7` | Exact-source matrix/verdict and browser fence |
| [#63](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/63) | `b89d4865ba1ba0d740161b9371271f023effacd9` | Create reload fence |
| [#64](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/64) | `6f4f62f81035d8069502ab907737df6b32dc669e` | Server-authoritative outcome recovery |
| [#65](https://github.com/Atlasfsp/AI-Frontend-Experience/pull/65) | `0f9db691e34742b6cdf6fb6c6a3c4aff61f86f7e` | Build dependencies before typecheck; untrack tsbuildinfo |

#57–#64 form an ancestry chain. #65 was fast-forwarded onto main, followed
by a conflict-free, history-preserving merge of #64. All original tests remain.
#65 can be reviewed/merged first; it is already an ancestor of this candidate.
After this candidate lands, #57–#64 have no remaining unique implementation
to land at the heads above. Recheck changed heads before declaring redundancy.
Only the owner may merge or close PRs. No review decision is implied.

## New candidate changes

- Treat `next-env.d.ts` as generated in all three apps. Ignore and untrack it;
  `next typegen` runs before each app's standalone TypeScript check. This follows
  the installed Next.js TypeScript guide. Do not hand-edit the dev/build imports,
  disable type checking, or hide arbitrary tracked changes from source guards.
- Require seven exact named matrix cases instead of six. The new case loses
  successful Create and intake responses, unmounts components to discard RAM
  retries, and recovers via both BFF GET lookup routes and the Go bridge. It
  checks WAL restart, foreign-subject UNKNOWN, service outage, no extra writes,
  unchanged project state during recovery, and keys in headers, not queries.
  The verdict tests explicitly refuse the old six-case report.

## Validation boundaries

Backend main `424f6e2cd4f4b05d4e6290cfdd926778f5d49ca6` does not contain
the bridge, replay follow-ups or outcome routes: backend #94–#103 merged
into stacked bases, not main. The owner selected a backend landing PR and
then exact-main matrix validation after their merge. Do not substitute the
old #103 head or the landing candidate SHA and call it accepted-main evidence.

The seven-case matrix covers create, repository/source, intake/triage,
plan, approval, staffing, tasks/audit, cross-requester replay, uncertain writes,
outcome recovery and component remount, plus session/tenant/authz denials.
It uses React/jsdom, signed-cookie BFF handlers, a real loopback Go API and
disposable WAL, with simulated JWT issuer, permission responses and source
resolver. Component remount is not a full browser reload. The separate browser
fence tests cover actual reload, multi-tab and corrupt storage on a fixture
page, not the complete authenticated Create/Engineer app journey.

No fresh dependency-install proof is claimed when cached node_modules are
copied into a clean clone. A no-download policy is in force. Tests, builds,
source cleanliness and browser/matrix results must be reported separately
at their actual revisions in the external handoff.

No live Authentik/SpiceDB/YugabyteDB, independent Jenkins/signing, container
image, deployment or execution acceptance is established here.
Storage eviction and legacy locator-less markers remain unresolved;
UNKNOWN never means not committed and cannot authorize a new-key retry.
