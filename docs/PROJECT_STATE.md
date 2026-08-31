# Smart Book V2 — Current Project State

**Date:** 2026-08-31

**Current branch:** `rebuild/v2` tracking `origin/rebuild/v2`

**Current worktrees:** V2 at `~/Projects/Smart-Book`; read-only Legacy at `~/Projects/Smart-Book-Legacy`

**Current phase:** Phase 1A Docker/Foundation implemented and verified; awaiting user review before Phase 1B (canonical persistence)

**Implementation state:** V2 Docker foundation is running locally. Backend (Laravel), frontend (Angular), MySQL 8, AI (Flask), and Mailpit are all running as a Docker Compose stack with the locked ports and an isolated V2-only MySQL database. No domain migrations, authentication, or product features exist yet.

## Completed

### Phase 0 (architecture and safety)

- Audited the incomplete legacy repository in read-only mode.
- Preserved original code in read-only branch `legacy/original`.
- Created immutable tag `legacy-original-2026-08-31`.
- Created and pushed `rebuild/v2`.
- Created the canonical Markdown handoff pack and draw.io ERD.
- Locked the V2 product, architecture, authentication, role, lifecycle, grading, AI, and Docker decisions.
- Verified separate worktrees for `rebuild/v2` and read-only `legacy/original`.

### Phase 1A (Docker/Foundation — current)

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

Unchanged from Phase 0 (see `DECISIONS.md` for D-001 through D-026).

## Not started (Phase 1B and later)

- Canonical MySQL 8 schema from the ERD (`docs/database/Smart_Book_V2_ERD.drawio`), seeders, Laravel database sessions.
- Authentication endpoints, signup, email verification, account approval/status enforcement.
- Any Admin, Instructor, Student, course, book, quiz, AI-generation, analytics, or report implementation.
- Baseline lint/test suite across all three applications (Laravel ships its own test script; see phase notes).
- Production email provider, Redis, workers, object storage.

## Known environment caveat

On this developer machine, Docker's embedded DNS cannot reliably resolve external names on the default bridge network (upstream WARP/systemd-resolved DNS on `127.x`). Two scoped workarounds are in `compose.yaml`:

- `build.network: host` for the `backend` and `ai` image builds (apt/pip need external package servers during build).
- A per-container `dns: ${DOCKER_DNS:-1.1.1.1}` override for `backend` and `frontend` (runtime `composer install` / `npm install`). Internal Compose service-name DNS is unaffected.

A Docker daemon fix (`"dns": ["1.1.1.1"]` in `/etc/docker/daemon.json`) would make these workarounds unnecessary.

## Current documentation changes

This documentation/implementation update is intentionally uncommitted pending user review.

## Exact next step

After the user approves this checkpoint, implement Phase 1B as defined in `ROADMAP.md`: the reviewed MySQL 8 schema from the ERD, explicit foreign keys/constraints/indexes, Laravel database sessions, deterministic seeders, and a proof that migrations/seeders run from an empty database. Do not start Admin feature pages before the Phase 1 exit criteria pass.