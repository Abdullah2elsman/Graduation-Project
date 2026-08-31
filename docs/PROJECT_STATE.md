# Smart Book V2 — Current Project State

**Date:** 2026-08-31

**Current branch:** `rebuild/v2` tracking `origin/rebuild/v2`

**Current worktrees:** V2 at `~/Projects/Smart-Book`; read-only Legacy at `~/Projects/Smart-Book-Legacy`

**Current phase:** Phase 1C.2 Sanctum/API/CSRF Foundation implemented and verified. Phase 1C.3 is the next implementation step.

**Implementation state:** V2 Docker foundation is running locally. Backend (Laravel), frontend (Angular), MySQL 8, AI (Flask), and Mailpit are healthy with the locked ports and an isolated V2-only database. Phase 1B is committed at `d474d70`; the complete authentication contract is committed at `eaa77d3`. Sanctum `v4.3.3`, `/api` routing, stateful middleware, database-session/cookie settings, exact credentialed CORS, the Angular same-origin dev proxy, centralized HttpClient/XSRF infrastructure, and focused foundation tests are now implemented. Login, logout, `/api/auth/me`, and all later authentication behavior remain unimplemented.

## Completed

### Phase 0 (architecture and safety)

- Audited the incomplete legacy repository in read-only mode.
- Preserved original code in read-only branch `legacy/original`.
- Created immutable tag `legacy-original-2026-08-31`.
- Created and pushed `rebuild/v2`.
- Created the canonical Markdown handoff pack and draw.io ERD.
- Locked the V2 product, architecture, authentication, role, lifecycle, grading, AI, and Docker decisions.
- Verified separate worktrees for `rebuild/v2` and read-only `legacy/original`.

### Phase 1A (Docker/Foundation — complete)

- Scaffolded a clean Laravel 13 backend (`backend/`) — Framework 13.29.0.
- Scaffolded a clean Angular 22 frontend (`frontend/`, routing + SCSS, SSR disabled).
- Added a minimal Flask service (`ai/`) exposing `GET /health`.
- Added `compose.yaml` with services `backend`, `frontend`, `db`, `ai`, `mailpit`.
- Pinned images: `php:8.4-cli`, `composer:2.10.2`, `node:22.22.3-bookworm-slim`, `python:3.12-slim`, `mysql:8.0`, `axllent/mailpit:v1.21`.
- Applied the locked V2 host ports: Angular `4200`, Laravel `8080`, Flask `5001`, MySQL `3307 -> 3306`, Mailpit UI `8025`.
- Preserved Legacy host ports `5501` and `8005` (both unused by V2, verified free).
- Containers reach each other by Compose service names and container ports (internal Compose DNS), never by host `localhost` mappings.
- Created V2-only MySQL database `smart_book_v2` and named volume `smart_book_v2_db_data`.
- Named volumes also for backend vendor (`smart_book_v2_backend_vendor`) and frontend node_modules (`smart_book_v2_frontend_node_modules`).
- Provided root and backend service `.env.example` templates with development placeholders only; root `.env` and `backend/.env` are git-ignored.
- Routed Laravel development mail to Mailpit (`MAIL_HOST=mailpit`, `MAIL_PORT=1025`, `MAIL_MAILER=smtp`).
- Added health checks for all five services and `depends_on` startup ordering from `db`.
- Fresh-clone onboarding demonstrates `cp .env.example .env && docker compose up --build`.
- Verified the full stack: all five services healthy, all endpoints reachable, stock Laravel framework migrations ran against MySQL.
- Removed the disposable scaffold `backend/database/database.sqlite`; MySQL is the canonical V2 database.
- Confirmed the Legacy worktree (`~/Projects/Smart-Book-Legacy`) remained clean and untouched.

## Verified at Phase 1A exit

- `docker compose config` succeeds.
- Containers build: `smart-book-v2-backend`, `smart-book-v2-frontend`, `smart-book-v2-ai`.
- `db` healthy; `smart_book_v2` database created in the named volume.
- Laravel starts on `http://localhost:8080` (welcome page, app name "Smart Book V2", stock migrations applied).
- Angular dev server starts on `http://localhost:4200`.
- Flask `GET http://localhost:5001/health` returns `{"service":"smart-book-ai","status":"ok"}`.
- Mailpit UI reachable on `http://localhost:8025`.
- V2 database/volume is isolated from Legacy (Legacy database is `project`; not present in the V2 MySQL).

## Running the stack

```bash
cp .env.example .env        # root Compose environment
docker compose up --build
```

Useful targets:

```bash
docker compose ps
docker compose logs -f backend|frontend|ai|mailpit|db
docker compose exec backend php artisan ...
docker compose down          # leaves named volumes; use -v to wipe data
```

## Locked

See `DECISIONS.md` for D-001 through D-039 and `docs/auth/AUTH_CONTRACT.md` for the complete frozen Phase 1C authentication behavior.

## Completed

### Phase 1B.1 (canonical database contract — complete)

- Re-evaluated the draft ERD and locked business rules against the Legacy schema evidence (read-only) and the stock Laravel scaffold.
- Created `docs/database/SCHEMA_CONTRACT.md` — the implementation-ready contract: per-table columns/types/nullability/defaults, FKs with ON DELETE RESTRICT / ON UPDATE CASCADE, unique constraints, indexes, CHECK constraints, status value sets, archive/soft-delete behavior, timestamps/timezone rules, and the DB-enforced vs application-level invariant matrix.
- Rewrote `docs/database/Smart_Book_V2_ERD.drawio` to match the approved contract (validated XML).
- Type-driven questions finalized: `SINGLE_CHOICE` / `MULTI_SELECT` with a normalized `student_answer_options` selection set (D-028).
- Attempt lifecycle finalized: `status {IN_PROGRESS, SUBMITTED}` + `submission_reason {MANUAL, TIME_EXPIRED}`; EXPIRED attempts scored normally and valid for the best grade (D-029); symmetric lifecycle invariant (IN_PROGRESS empty / SUBMITTED complete) enforced by a DB CHECK, immutability app-enforced (D-030).
- Result release is fixed to AFTER_END for MVP; no persisted policy column; MANUAL/custom release documented as a future extension (D-020).
- `ai_generation_requests.question_type` removed; draft questions carry their own type.
- `courses.instructor_id` nullable while configuring, with DB CHECKs requiring exactly one assigned instructor for the ACTIVE (usable) state.
- Dropped speculative `users.phone` / `birth_date` / `avatar_path` (D-023).
- Deferred `book_interactions` (D-027); documented its Legacy semantics and the Phase 3 revisit.
- Stock migrations disposition decided: `users` rewritten, framework tables retained stock, `sessions` kept as the Laravel database-session table.
- Updated `DECISIONS.md` (D-027…D-030), `ROADMAP.md`, `SESSION_LOG.md`, `PROJECT_STATE.md`.
- Reviewed (4 corrections applied) and committed as `2babd1a`; pushed to `origin/rebuild/v2`.

### Phase 1B.2 (canonical database implementation — complete)

- Rewrote `0001_01_01_000000_create_users_table.php`: canonical `users` (role/status, self-FKs for approval/status/creation provenance, `(role,status)` + `(status,email_verified_at)` indexes, `users_role_check`, `users_status_check`); `password_reset_tokens` and `sessions` retained byte-for-byte stock.
- Created domain migrations `2026_08_31_000001`…`000010` in dependency order: `courses`, `course_books`, `enrollments`, `quizzes`, `questions`, `options`, `quiz_attempts`, `student_answers`, `student_answer_options`, `ai_generation_requests` — matching SCHEMA_CONTRACT exactly.
- Implemented all 25 CHECK constraints via explicit `ALTER TABLE` statements (including the symmetric attempt-lifecycle and exact-set grading bounds), all UNIQUE keys (enrollment duplicate, question/option position, attempt/student/attempt_number, answer/question, composite selection PK, `storage_path`, `email`), and all contract indexes.
- Resolved a MySQL 8.0 limitation (error 3823): `courses.instructor_id` FK declared `ON DELETE RESTRICT / ON UPDATE RESTRICT` (D-031) so its two contract CHECKs can legally reference it; all other domain FKs remain RESTRICT/CASCADE (verified via `information_schema.referential_constraints`).
- Rewrote `DatabaseSeeder.php` (Query Builder, no new Eloquent models, `WithoutModelEvents`): 1 ACTIVE Admin (bootstrap), 1 ACTIVE Instructor (created/approved by admin), 1 ACTIVE + 1 PENDING student, 1 ACTIVE instructor-assigned course, 1 ACTIVE enrollment, 1 PUBLISHED quiz, 1 SINGLE_CHOICE question (4 options) + 1 MULTI_SELECT question (4 options); `email`/`password` deterministic. Kept stock `UserFactory`.
- Empty-database proof passed inside the dev container: `php artisan migrate:fresh --seed` — 13 migrations, 19 tables (9 framework incl. `users` + 10 domain).
- Verified 25 CHECKs, FK referential actions, and every UNIQUE/index via `information_schema`.
- Ran 11 focused negative SQL tests — each failed with exactly the expected CHECK/UNIQUE constraint — plus a positive proof: valid IN_PROGRESS→SUBMITTED lifecycle, a 3-option MULTI_SELECT answer, and composite-PK duplicate-selection rejection.
- Skipped `laravel/boost` (backend/AGENTS.md suggestion) — it would modify `composer.json` and is outside approved phase scope.
- Updated `DECISIONS.md` (D-031), `SCHEMA_CONTRACT.md`, `SESSION_LOG.md`, `PROJECT_STATE.md`.
- Reviewed and committed as `d474d70 feat: implement Smart Book v2 canonical database schema`.

### Phase 1C.1 (authentication contract review — complete)

- Reverified the Laravel, Angular, session, password-broker, Mailpit, API-routing, Sanctum, `User` model, schema, and test baseline from the repository.
- Froze the complete identity, password, account-state, student-registration/approval, signed-verification, Instructor-invitation, password-recovery, first-Admin, endpoint, SPA, authorization, and security contracts in `docs/auth/AUTH_CONTRACT.md`.
- Confirmed that non-active accounts may authenticate only into restricted sessions and that normal APIs require authenticated + verified + `ACTIVE`, followed by role/resource authorization.
- Resolved all remaining authentication business decisions; there are no UNKNOWN blockers before Phase 1C.2.
- No Sanctum installation, routes, controllers, middleware, Angular changes, migrations, or other application implementation was performed in Phase 1C.1.

### Phase 1C.2 (Sanctum/API/CSRF foundation — implemented and verified)

- Installed Laravel Sanctum `v4.3.3`, compatible with Laravel 13; no unrelated authentication package was added.
- Added `/api` route wiring and permanent infrastructure-only `GET /api/health`; retained web/console routes and `/up`.
- Enabled Laravel's `statefulApi()` middleware and configured stateful hosts `localhost:4200,localhost:8080` with the `web` guard.
- Preserved database sessions and set an isolated `smart_book_v2_session` host-only, HttpOnly, SameSite=Lax, non-Secure cookie for local HTTP development.
- Added explicit credentialed CORS for `http://localhost:4200` only; no wildcard origins.
- Added the Angular dev proxy (`/api`, `/sanctum` → `http://backend:8080`) and centralized relative API/credentials/XSRF HttpClient providers.
- Added focused Laravel and Angular tests. No personal-access-token migration, `HasApiTokens`, token endpoint, or auth business endpoint was added.
- Verified proxy CSRF bootstrap (`204`, `XSRF-TOKEN` + V2 session cookie), proxy API health JSON, all five Docker services, Composer validity, backend tests, Angular tests, and production build.

## Not started (later phases)

- Login, logout, and `/api/auth/me` (Phase 1C.3).
- Signup, email verification, account approval/status enforcement, invitations, recovery, and Angular auth integration.
- Any Admin, Instructor, Student, course, book, quiz, AI-generation, analytics, or report implementation.
- Baseline lint/test suite across all three applications (Laravel ships its own test script; see phase notes).
- Production email provider, Redis, workers, object storage.

## Known environment caveat

On this developer machine, Docker's embedded DNS cannot reliably resolve external names on the default bridge network (upstream WARP/systemd-resolved DNS on `127.x`). Two scoped workarounds are in `compose.yaml`:

- `build.network: host` for the `backend` and `ai` image builds (apt/pip need external package servers during build).
- A per-container `dns: ${DOCKER_DNS:-1.1.1.1}` override for `backend` and `frontend` (runtime `composer install` / `npm install`). Internal Compose service-name DNS is unaffected.

A Docker daemon fix (`"dns": ["1.1.1.1"]` in `/etc/docker/daemon.json`) would make these workarounds unnecessary.

## Current documentation changes

Phase 1C.2 application and documentation changes are intentionally uncommitted pending user review.

## Exact next step

Phase 1C.3 — implement email-only login, logout, and `GET /api/auth/me` on the proven Sanctum session foundation, including normalization, session regeneration/invalidation, safe auth-state serialization, throttling, and focused Laravel tests. Do not implement registration, verification, account-state application middleware, invitations, recovery, Admin lifecycle actions, or Angular auth screens/store/guards yet.
