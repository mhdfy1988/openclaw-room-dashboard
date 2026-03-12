# Room Dashboard TODO

Execution rule: finish items from top to bottom unless a blocker forces reordering.

## Phase 1 - Safety and correctness

- [x] Harden Windows OpenClaw CLI invocation
  Files: `backend/src/providers/openclaw/gateway.js`
  Goal: stop building a raw `cmd.exe /c` command string for gateway calls.
  Tasks:
  - wrap CLI execution in a dedicated helper with safe argument escaping
  - avoid passing token and JSON params through an unescaped shell string
  - add clear error messages for timeout, auth failure, and malformed JSON
  Done when:
  - tokens/URLs containing spaces, `&`, quotes, or query params do not break calls
  - no command string concatenation remains in the Windows path

- [x] Fix frontend room state error handling
  Files: `frontend/src/hooks/useRoomState.ts`, `frontend/src/lib/room-alerts.ts`
  Goal: separate initial load failure, refresh failure, and SSE failure.
  Tasks:
  - check `response.ok` before parsing payloads
  - validate that refresh responses match the expected room-state shape
  - split stream states into explicit lifecycle states
  - avoid turning every later fetch failure into `initial-error`
  Done when:
  - first-load failure and later refresh failure produce different UI states
  - non-200 responses cannot be treated as room data

- [x] Fix agent focus exit behavior in prod
  Files: `frontend/src/App.tsx`, `frontend/src/components/panels/AgentDetailPanel.tsx`, `frontend/src/components/agent/AgentAvatarCard.tsx`, `frontend/src/hooks/useSelectedAgent.ts`
  Goal: users must always be able to leave focused agent mode.
  Tasks:
  - show a stable "back to overview" control in all environments
  - or support click-again / background click to clear selection
  - make the behavior consistent on desktop and mobile
  Done when:
  - focused mode never traps the user
  - the interaction is the same in dev and prod

- [x] Replace per-client SSE polling loops with a shared broadcaster
  Files: `backend/src/app/create-app.js`, `backend/src/providers/openclaw/gateway.js`
  Goal: one backend refresh loop should feed all SSE clients.
  Tasks:
  - keep one shared latest room state in memory
  - fan out updates to all connected SSE clients
  - add `try/catch` around async write loops and clean shutdown handling
  Done when:
  - multiple browser tabs do not multiply OpenClaw polling load linearly
  - SSE errors do not create unhandled async failures

## Phase 2 - Backend refactor

- [x] Split `openclaw-gateway.js` into focused modules
  Current file: `backend/src/providers/openclaw/gateway.js`
  Goal: reduce the 900+ line single-file gateway pipeline into smaller units.
  Suggested split:
  - `openclaw-client.js` for gateway/CLI transport
  - `openclaw-normalizers.js` for session/agent/meta shaping
  - `openclaw-alerts.js` for alert rules
  - `openclaw-provider.js` for cache and refresh lifecycle
  Done when:
  - each file has one main responsibility
  - alert changes no longer require editing transport code

- [x] Add runtime schema guards for external gateway payloads
  Files: `backend/src/providers/openclaw/gateway.js` or new normalizer/schema files
  Goal: avoid silent breakage when OpenClaw payload shapes drift.
  Tasks:
  - normalize unknown/null/missing fields consistently
  - centralize all external field reads in one adapter layer
  - capture suspicious payload mismatches as warnings
  Done when:
  - the dashboard degrades gracefully on partial payload changes
  - shape assumptions are not scattered across the file

- [x] Unify fallback state builders
  Files: `backend/src/state/room-state.js`, `backend/src/state/mock-room-state.js`, `backend/src/state/empty-room-state.js`, `backend/src/providers/openclaw/gateway.js`
  Goal: align empty/mock/error states to one shared room-state shape helper.
  Tasks:
  - create shared builders for gateway, alerts, events, and default timestamps
  - remove duplicated room-state literals where possible
  Done when:
  - mock, empty, error, and real states share the same structural defaults

- [x] Make alert rules configurable
  Files: `backend/src/providers/openclaw/gateway.js`, `backend/src/config/openclaw-config.js`
  Goal: move stale-agent and token thresholds out of hardcoded constants.
  Tasks:
  - define alert thresholds in config
  - expose effective values in health/config endpoints if useful
  Done when:
  - threshold changes do not require code edits

## Phase 3 - Frontend refactor

- [x] Extract dashboard selectors/computed state from components
  Files: `frontend/src/App.tsx`, `frontend/src/components/topbar/Topbar.tsx`, `frontend/src/lib/room-summary.ts`, `frontend/src/lib/room-alerts.ts`
  Goal: stop recalculating room summaries in multiple UI components.
  Tasks:
  - create shared selectors for summary counts, primary alert, latest event, and default agent
  - keep presentational components mostly render-only
  Done when:
  - `Topbar` and side panels consume shared derived state instead of duplicating logic

- [x] Deduplicate avatar density logic
  Files: `frontend/src/components/scene/RoomScene.tsx`, `frontend/src/components/scene/ZoneCard.tsx`
  Goal: one density policy for all room/zone renders.
  Tasks:
  - move density thresholds to `frontend/src/lib` or `frontend/src/constants`
  - reuse the same helper in every avatar layout
  Done when:
  - changing one threshold updates all render paths

- [x] Improve focus-mode layout rules
  Files: `frontend/src/App.tsx`, `frontend/src/components/panels/*`, `frontend/src/App.css`, `frontend/src/components/panels/panels.css`
  Goal: make overview mode and focused-agent mode feel intentionally different.
  Tasks:
  - define a dedicated focused sidebar layout
  - consider stronger hierarchy for detail sections
  - keep non-focused informational panels hidden but restorable
  Done when:
  - focused mode feels designed, not just conditionally hidden

- [x] Normalize date/time formatting usage
  Files: `frontend/src/lib/format.ts`, `frontend/src/components/topbar/Topbar.tsx`, `frontend/src/components/panels/EventListPanel.tsx`, `frontend/src/components/panels/AgentDetailPanel.tsx`
  Goal: remove ad hoc `toLocaleTimeString()` usage.
  Tasks:
  - route all visible timestamps through shared formatting helpers
  - support explicit full datetime where recency is ambiguous
  Done when:
  - all time displays follow one formatting policy

## Phase 4 - Tests and developer workflow

- [x] Add backend unit tests for state shaping and alert rules
  Files: new `backend/src/**/*.test.js` or `backend/test/**/*.test.js`
  Priority cases:
  - latest events across sessions
  - channel health alerts
  - stale token-metrics warning
  - gateway error fallback state
  Done when:
  - alert regressions are caught without manual browser checks

- [x] Add frontend tests for key interaction flows
  Files: new `frontend/src/**/*.test.tsx`
  Priority cases:
  - select agent -> focus mode
  - clear selection -> overview mode
  - stream error -> merged alert visible
  - detail panel shows token-metrics warning text
  Done when:
  - key UI state transitions are covered by automated tests

- [x] Add one lightweight end-to-end smoke test
  Files: `scripts/` or a new Playwright test folder
  Goal: verify dev dashboard boots, room state renders, and focus mode works.
  Done when:
  - one command can validate the main happy path

- [x] Add real project test scripts
  Files: root `package.json`, `frontend/package.json`, `backend/package.json`
  Goal: make `build`, `lint`, and `test` workflows obvious.
  Tasks:
  - add `test` scripts for frontend and backend
  - add a root script to run the full verification set
  Done when:
  - contributors can run one command before merging changes

## Suggested execution order

1. Finish all Phase 1 items.
2. Split backend gateway code before adding many more alerts.
3. Extract frontend selectors and focus-mode rules.
4. Add tests immediately after each refactor block, not only at the end.

## Nice-to-have later

- [x] Persist selected agent in URL/query state for deep-linking
- [x] Add alert mute/acknowledge support
- [x] Add a dedicated mock mode entry instead of reusing the real dev backend
- [x] Add structured logs for gateway refresh duration and failure reasons
