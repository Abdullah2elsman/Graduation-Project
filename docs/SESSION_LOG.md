# Smart Book V2 — Session Log

## 2026-08-31 — Rebuild direction and safety checkpoint

### Goal
Preserve the graduation-project code and define a clean V2 rebuild direction.

### Completed
- Audited the legacy repository read-only.
- Created `legacy/original` from `fbfcdda`.
- Created tag `legacy-original-2026-08-31`.
- Pushed both legacy references.
- Created and pushed `rebuild/v2`.
- Chose Angular frontend, Laravel backend, MySQL 8.x, Flask AI service.
- Chose unified users/roles and Sanctum SPA authentication.
- Chose Docker from day one.
- Defined foundation-first + Admin page-by-page vertical-slice workflow.

### Implementation
No V2 application code has been written yet.

### Decisions pending at that checkpoint

Instructor cardinality, course-book cardinality, attempt policy, result release, enrollment permissions, and public signup were still open at this checkpoint. They are resolved and locked in the later 2026-08-31 entry below.

### Then-current next step

The then-current plan was to add the documentation pack and resolve the domain questions. This is retained as history and superseded by the later entry below.

### Historical next-agent prompt

This prompt is superseded. Future agents must use the latest session-log entry and the locked decisions in `DECISIONS.md`.

## 2026-08-31 — V2 product decisions and ERD finalized

### Goal

Convert the preliminary rebuild proposal into a locked implementation source of truth and redesign the ERD before any application scaffolding.

### Decisions locked

- Email-only login with unique, consistently normalized email.
- One `users` table and roles `ADMIN`, `INSTRUCTOR`, `STUDENT`.
- Sanctum cookie/session authentication and `/api/auth/me`.
- Public signup for students only; instructor accounts are created by Admin.
- New students begin `STUDENT/PENDING`.
- Signed email verification is required and remains separate from Admin approval and enrollment.
- Account states are `PENDING`, `ACTIVE`, `SUSPENDED`, and `REJECTED`.
- Pending users may authenticate only to restricted auth/session endpoints and must not access normal APIs.
- Rejected emails remain reserved, and historical academic data must survive suspension/rejection.
- Mailpit is required for Docker development email; production provider is deferred.
- Every course has exactly one direct instructor reference; Admin may reassign it.
- Courses may have multiple PDFs through `course_books`.
- Admin alone manages enrollment initially; activation never implies enrollment.
- Each quiz has instructor-configurable `max_attempts`.
- Preserve all attempts; best/final grade is the highest valid submitted score.
- Scores, previous-attempt scores, correct answers, and detailed review are server-hidden before `quiz.ends_at`.
- Angular is a redesigned accessible/responsive SPA delivered through vertical slices.
- Laravel may rebuild broken business logic and API contracts without legacy compatibility.
- MySQL 8.x and clean new migrations are canonical.
- AI communication is `Angular -> Laravel -> Flask`; generated content is an instructor-reviewed draft tied to one book/page range.
- Docker Compose begins with Laravel, Angular, MySQL 8, Flask, and Mailpit.
- Admin vertical slices follow the agreed fixed implementation order.

### ERD outcome

- Removed the proposed `course_instructors` many-to-many table.
- Removed speculative profile tables; limited common profile fields remain on `users`.
- Added account approval/status metadata without conflating it with email verification.
- Added direct course instructor ownership and multiple `course_books`.
- Added enrollment lifecycle/audit fields and one student/course record.
- Added quiz release-policy fields and per-quiz `max_attempts`.
- Expanded attempt and answer snapshots for reliable independent history.
- Tied AI generation requests and book interactions to a specific `course_book`.
- Included Laravel database sessions for Sanctum SPA authentication.

### Implementation

No application source code, package installation, scaffolding, Docker configuration, or commit was performed. Only the requested canonical documentation and draw.io ERD were updated.

### Exact next step

Wait for user review. After approval, implement the Phase 1 Docker/Foundation skeleton defined in `ROADMAP.md`; do not start Admin feature pages before the foundation exit criteria pass.

### Prompt for the next implementation agent

Read all canonical Markdown files under `docs/` and open `docs/database/Smart_Book_V2_ERD.drawio`. Confirm branch `rebuild/v2` and inspect the worktree before editing. Then propose the exact Phase 1 Docker/Foundation file tree, pinned service versions, ports, volumes, health checks, and environment-variable contract for approval. Do not implement product pages yet.

## 2026-08-31 — Side-by-side Legacy/V2 development locked

### Worktree and comparison decision

- Verified V2 at `~/Projects/Smart-Book` on `rebuild/v2`.
- Verified the preserved application at `~/Projects/Smart-Book-Legacy` on `legacy/original`.
- The Legacy worktree is read-only and must never be modified.
- Legacy and V2 must run concurrently so equivalent pages can be compared side by side during page-by-page rebuilding.
- Legacy screens and logic are historical evidence only; V2 must not depend on the Legacy worktree or runtime.

### Runtime isolation locked

- Preserve Legacy host ports: static frontend `5501`, Laravel backend `8005`.
- Use V2 host ports: Angular `4200`, Laravel API `8080`, Flask AI `5001`, MySQL `3307 -> 3306`, Mailpit UI `8025`.
- Legacy and V2 must never share an application database, schema, data directory, or Docker volume.
- V2 containers will use Compose service names and container ports for internal communication.

### Documentation and ERD impact

The canonical handoff, roadmap, project state, and decisions were updated. No ERD change was required because worktree placement, host-port allocation, and physical database isolation do not alter the locked V2 relational schema.

### Implementation

No application source code, package installation, scaffolding, Docker configuration, legacy-worktree change, or commit was performed.

### Exact next step

Wait for user review. After approval, implement Phase 1 Docker/Foundation with the locked ports and a V2-only MySQL database/volume, then prove concurrent Legacy/V2 startup before product-page work.

## 2026-08-31 — Phase 1A Docker/Foundation complete

### Goal

Resume an interrupted Phase 1A task: recover the partial Laravel/Angular scaffold, then build and verify the Docker development foundation (backend, frontend, db, ai, mailpit) with the locked V2 ports and an isolated V2-only MySQL database. No Phase 1B (domain migrations/seeders) and no product features.

### Recovery assessment

- Complete: Laravel 13.29.0 scaffold with vendor and `.env`; Angular 22.1.6 scaffold (routing + SCSS, SSR off); docs pack; read-only Legacy worktree.
- Partial/cleanup: `backend/.env` and `.env.example` still targeted SQLite; disposable `backend/database/database.sqlite` present; no Compose/Docker.
- Not started: Docker foundation, `ai/`, Mailpit, docs updates.

### Implementation

- Repointed `backend/.env` and `.env.example` to MySQL + Mailpit (V2-only database `smart_book_v2`, user `smartbook`).
- Removed the disposable `backend/database/database.sqlite`; MySQL is canonical.
- Added root `compose.yaml`, `.env.example`, `.gitignore`.
- Added `backend/Dockerfile` (php:8.4-cli + composer:2.10.2), `backend/docker/entrypoint.sh` (creates `.env`, generates APP_KEY if empty, `composer install`, `php artisan migrate --force`, then `php artisan serve --host=0.0.0.0 --port=8080`), `backend/.dockerignore`.
- Added `frontend/Dockerfile` (node:22.22.3-bookworm-slim), `frontend/docker/entrypoint.sh` (`npm install` then `npm start -- --host 0.0.0.0 --port 4200`), `frontend/.dockerignore`.
- Added `ai/` minimal Flask service with `GET /health`, `requirements.txt` (Flask==3.1.1), Dockerfile (python:3.12-slim), ignores.
- Compose wiring: locked ports, per-service health checks, `db` gates `backend` via `depends_on: service_healthy`, named volumes for db/vendor/node_modules, Laravel mail via `smtp -> mailpit:1025`.

### Environment workaround (this machine)

Docker's embedded DNS cannot resolve external names on the default bridge network here (upstream WARP/systemd-resolved DNS on `127.x`). Confirmed: host-network containers resolve; default-network containers fail; `--dns 1.1.1.1` resolves external names while preserving Docker service-name DNS. Applied scoped workarounds in `compose.yaml`:

- `build.network: host` for the `backend` apt step and the `ai` pip step (build-time only).
- `dns: [${DOCKER_DNS:-1.1.1.1}]` on `backend` and `frontend` (runtime `composer install` / `npm install`; internal service-name DNS unaffected).

A Docker daemon `"dns": ["1.1.1.1"]` config would remove the need for these. This is an environment accommodation, not an architecture decision (DECISIONS unchanged).

### Exact commands used

```bash
cd ~/Projects/Smart-Book
docker compose build            # backend/ai needed build.network host; images written:
                                #   smart-book-v2-backend, -frontend, -ai
docker compose up -d
docker compose ps
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/      # 200 (Laravel)
curl -s http://localhost:5001/health                                 # {"service":"smart-book-ai","status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8025/      # 200 (Mailpit UI)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4200/      # 200 (Angular)
mysql -h 127.0.0.1 -P 3307 -u smartbook -p... -e "SHOW DATABASES; USE smart_book_v2; SHOW TABLES;"
docker volume ls | grep smart_book_v2
git -C ~/Projects/Smart-Book-Legacy status --short                    # clean
git status                                                            # only intended V2 files untracked
```

### Verification results (all observed)

- `docker compose config` OK.
- Containers: `db` healthy (3307 -> 3306), `backend` healthy (8080, welcome page title "Smart Book V2"), `frontend` healthy (4200, Angular app served), `ai` healthy (5001 `/health` 200), `mailpit` healthy (8025 UI).
- MySQL `smart_book_v2` contains only stock Laravel framework tables (users, password_reset_tokens, sessions, cache, cache_locks, jobs, job_batches, failed_jobs, migrations). No domain migrations.
- `smart_book_v2_db_data`, `smart_book_v2_backend_vendor`, `smart_book_v2_frontend_node_modules` named volumes exist.
- Backend vendor and frontend node_modules installed into their named volumes (host checkout stays free of them).
- Legacy worktree clean on `legacy/original`; Legacy ports 5501/8005 free; Legacy DB name `project` absent from the V2 MySQL.
- Root `.env` and `backend/.env` are git-ignored.

### Notes for the next agent

- Containers run as root; they may leave root-owned Laravel cache files in the bind-mounted `backend/bootstrap/cache` and `backend/storage/framework/views`. They are git-ignored; `sudo chown` if they bother the host user.
- `frontend/package-lock.json` was generated by the container's `npm install` (untracked). It should be committed for reproducibility once a commit is authorized.
- Stock Laravel migrations were run only to bootstrap the framework runtime (sessions/cache/jobs); Phase 1B supersedes them with the canonical ERD schema.
- Rebuild backend/ai if their build steps are ever changed; `build.network: host` is required on machines with the Docker-DNS caveat.

### Exact next step

After user review of this checkpoint: Phase 1B canonical persistence from `docs/database/Smart_Book_V2_ERD.drawio`, database sessions, deterministic seeders, and an empty-database migration proof. Do not start Admin pages before the Phase 1 exit criteria pass.

### Hardening pass (idempotent dependency init) — same session

- `backend/docker/entrypoint.sh`: `composer install` now runs only when the vendor
  volume is missing/out of date. A stamp (`vendor/.sb-deps.sha256`) inside the
  vendor volume records the `composer.lock` sha256 from the last completed install;
  a changed lock file triggers a reinstall on the next start.
- `frontend/docker/entrypoint.sh`: `npm install` now runs only when node_modules is
  missing/out of date, using the same stamp pattern (`node_modules/.sb-deps.sha256`
  vs `package-lock.json` sha256).
- Purpose: ordinary container restarts do not reinstall dependencies.
- Caveat in this repo: entrypoint scripts are baked into the images (not
  bind-mounted), so entrypoint edits require `docker compose build backend frontend`
  then `up -d --force-recreate` (a plain `restart` runs the previous image's code).
- Verified: after rebuild + recreate, the first boot installs once and writes
  stamps; a subsequent plain `docker compose restart backend frontend` skipped both
  installs. All endpoints still 200; all 5 containers healthy; Legacy clean.
- DNS workaround comments in `compose.yaml` made explicit that `build.network: host`
  and the `dns:` override are environment accommodations (configurable via
  `DOCKER_DNS` in `.env.example`), not Smart Book architectural requirements.
- `frontend/package-lock.json` (untracked, root-owned) confirmed present, valid, and
  NOT git-ignored — intended to be committed with the checkpoint.

## 2026-08-31 — Phase 1B.1 canonical database contract complete

### Goal

Review the draft ERD and stock Laravel scaffold against all locked business rules and Legacy schema evidence, then produce the implementation-ready database contract and updated ERD. Documentation only; no migrations, models, seeders, or product code.

### Review inputs

- Canonical docs (`REBUILD_CONTEXT.md`, `DECISIONS.md`, `PROJECT_STATE.md`, `ROADMAP.md`, prior log entries, draft `Smart_Book_V2_ERD.drawio`).
- Stock Laravel 13 migrations (users/password_reset_tokens/sessions, cache/cache_locks, jobs/job_batches/failed_jobs) and live `smart_book_v2` tables (verified via `smart-book-v2-db`).
- Legacy read-only evidence: enrollments (single active row via generated-column partial unique), students (profile fields), exam attempts (destructive cascade — the anti-pattern V2 forbids), book_interactions (daily per-student/course engagement bucket consumed only by report counts), exam submit API (`answers.*.option_id` → single-choice legacy).

### Decisions finalized (approved by user)

- **D-028 — Type-driven questions and normalized selections:** `questions.type` = SINGLE_CHOICE / MULTI_SELECT; TRUE_FALSE authored as SINGLE_CHOICE; no essay type; normalized selected-option set in new `student_answer_options` (composite PK, no timestamps); exact-set-match grading, no partial credit; a published quiz's content is immutable once the first attempt starts.
- **D-029 — Attempt lifecycle separated from submission provenance:** `status {IN_PROGRESS, SUBMITTED}` + `submission_reason {MANUAL, TIME_EXPIRED}`; TIME_EXPIRED scored normally, consumes an attempt, valid for best grade; no EXPIRED/ABANDONED/INVALIDATED statuses; best grade = MAX(score) over SUBMITTED, never stored.
- **D-030 — Submitted-attempt completeness and immutability:** symmetric DB CHECK — IN_PROGRESS rows carry no submission data (submitted_at/graded_at/score/submission_reason all NULL); SUBMITTED rows are complete (all four NOT NULL); write-immutability of SUBMITTED rows is an application-level invariant.
- **D-027 — Defer book interactions to Phase 3:** legacy semantics documented (daily per student/course engagement bucket consumed only by report counts); redesign when Phase 3 defines real interaction events.
- Earlier decisions applied to the contract: dropped `users.phone`/`birth_date`/`avatar_path` (D-023); `courses.instructor_id` nullable while DRAFT with DB CHECKs binding ACTIVE to exactly one assigned instructor (D-016); `ai_generation_requests.question_type` removed (part of D-028).

### Contract deliverable

- `docs/database/SCHEMA_CONTRACT.md` — per-table columns/types/nullability/defaults, FKs (ON DELETE RESTRICT / ON UPDATE CASCADE; `constrained()` creates the conventional FK while referential actions are declared explicitly via `restrictOnDelete()`/`cascadeOnUpdate()`), unique constraints, indexes, CHECK constraints, status sets, archive rules, timestamps/timezone (UTC), full DB-vs-app invariant matrix, grading model reference, and stock-migration disposition (rewrite `users`; retain all framework tables; `sessions` stays the canonical database-session table).
- `docs/database/Smart_Book_V2_ERD.drawio` — rewritten to match; validated as well-formed XML.

### Files changed

- `docs/database/SCHEMA_CONTRACT.md` (new)
- `docs/database/Smart_Book_V2_ERD.drawio` (rewritten)
- `docs/DECISIONS.md` (D-027…D-030)
- `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/SESSION_LOG.md` (status/log updates)

### Exact next step

After user review of this checkpoint: Phase 1B.2 — migrations implementing `SCHEMA_CONTRACT.md` (rewrite stock `users`; add domain migrations in dependency order), deterministic seeders, Laravel database sessions, and a `php artisan migrate:fresh --seed` empty-database proof. Do not start Admin feature pages before the Phase 1 exit criteria pass. No commit authorized yet.

## 2026-08-31 — Phase 1B.1 review corrections applied

Phase 1B.1 approved with four documentation corrections, applied here (no migrations, no Phase 1B.2, no commit):

1. **Alignment.** Standardized the D-027…D-030 IDs/meanings across `DECISIONS.md`, `SCHEMA_CONTRACT.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `SESSION_LOG.md`, and the report: **D-027** = defer book interactions to Phase 3; **D-028** = type-driven questions and normalized selections (incl. exact-set grading, no partial credit); **D-029** = attempt lifecycle separated from submission provenance; **D-030** = submitted-attempt completeness and immutability.
2. **Laravel FK wording.** `->constrained()` creates the conventional FK (column type/name/table inference); referential actions are declared explicitly and deliberately (`restrictOnDelete()` / `cascadeOnUpdate()` where the contract intends RESTRICT/CASCADE). Removed the "defaults to CASCADE" claim from the contract and this log.
3. **Symmetric attempt CHECK.** `quiz_attempts` now documents a symmetric lifecycle invariant: IN_PROGRESS ⇒ `submitted_at`/`graded_at`/`score`/`submission_reason` all NULL; SUBMITTED ⇒ all four NOT NULL. Submitted-attempt immutability remains application-level.
4. **Result release.** Removed the persisted `result_release_policy`/`results_released_at` columns from the `quizzes` contract; MVP release is fixed to `AFTER_END` (D-020). MANUAL/custom release is documented as a future extension added by migration when a concrete flow exists.

Files changed: `docs/DECISIONS.md`, `docs/database/SCHEMA_CONTRACT.md`, `docs/database/Smart_Book_V2_ERD.drawio`, `docs/REBUILD_CONTEXT.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/SESSION_LOG.md`. Wait for review before Phase 1B.2.

## 2026-08-31 — Phase 1B.2 canonical database implementation complete

### Goal

Implement the Phase 1B.1 contract as real Laravel migrations and deterministic seeders inside the running Docker stack, prove it from an empty database, and verify every constraint. No commit.

### Scope guardrails honored

- No business-rule inference, no schema redesign, no auth/controllers/APIs/grading/AI features.
- No change to the Legacy worktree. No modifications to the stock framework migrations (`cache`, `jobs`), `UserFactory`, or `composer.json`.

### Implementation

- **`users` migration rewritten** (`0001_01_01_000000_create_users_table.php`): canonical users columns (role/status default STUDENT/PENDING), 3 self-FKs (approved_by/status_changed_by/created_by) as RESTRICT/CASCADE, `(role,status)` + `(status,email_verified_at)` indexes, `users_role_check`, `users_status_check`; `password_reset_tokens` and `sessions` kept byte-for-byte stock (sessions = Laravel database-session table, index-only user_id, no FK).
- **10 domain migrations** `2026_08_31_000001`…`000010` (courses, course_books, enrollments, quizzes, questions, options, quiz_attempts, student_answers, student_answer_options, ai_generation_requests) matching SCHEMA_CONTRACT exactly: 25 CHECK constraints via explicit `DB::statement`, all UNIQUEs, all indexes.
- **DatabaseSeeder rewritten** with Query Builder + `WithoutModelEvents` (no new Eloquent models): Seed Admin (ACTIVE, bootstrap), Seed Instructor (ACTIVE, created/approved by admin), Seed Active Student (ACTIVE, enrolled), Seed Pending Student (PENDING, verified, not enrolled), 1 ACTIVE course (admin-assigned instructor), 1 ACTIVE enrollment, 1 PUBLISHED quiz (starts −2d / ends +7d, max_attempts 3), 1 SINGLE_CHOICE question (4 options, one correct) + 1 MULTI_SELECT question (4 options, three correct). Passwords `password` via `Hash::make`; emails lowercase.

### Conflicts found and resolved

1. **MySQL 8.0 error 3823 (verified empirically in-container):** a CHECK constraint may not reference a column whose FK declares a referential action other than RESTRICT/NO ACTION; `ON UPDATE CASCADE` is rejected. `courses.instructor_id` is referenced by two contract CHECKs → changed only that FK to `restrictOnDelete()->restrictOnUpdate()` (ON DELETE RESTRICT / ON UPDATE RESTRICT). User approved this minimal deviation; recorded as **D-031** in `DECISIONS.md` and referenced inline in `SCHEMA_CONTRACT.md`. All other domain FKs verified RESTRICT/CASCADE via `information_schema.referential_constraints`.
2. **Identifier length:** the auto-generated composite index on `ai_generation_requests(requested_by_instructor_id, created_at)` exceeded MySQL’s 64-char limit → explicit shorter names used.
3. **Seeder bug:** mutable `Carbon::now()` collapsed the quiz window (starts_at == ends_at) → switched to `$now->copy()` derived values. Verified ends_at > starts_at.
4. **Skipped `laravel/boost`** (suggested in `backend/AGENTS.md`): would modify `composer.json` and is outside approved phase scope; note for later if wanted.

### Verification

- `php artisan migrate:fresh --seed` passed in the dev container: 13 migrations, **19 tables** (9 framework incl. `users` + 10 domain), 25 CHECKs.
- Seed fixtures verified by select: 4 users (2 roles covered, ACTIVE + PENDING states), course ACTIVE with instructor assigned, 1 ACTIVE enrollment, PUBLISHED quiz (schedule valid), both question types with correct option cardinality (SINGLE_CHOICE exactly one correct; MULTI_SELECT three correct).
- 11 focused **negative SQL tests** — each rejected with the exact expected constraint: users_role_check, users_status_check, courses_requires_instructor_check, courses_assignment_consistency_check, quizzes_schedule_range_check, quizzes_max_attempts_check, questions_type_check, enrollments_course_id_student_id_unique, quiz_attempts_lifecycle_check, options_question_id_position_unique, student_answers_points_bounds_check.
- **Positive proof (D-028/029/030):** valid IN_PROGRESS→SUBMITTED transition (all four submit fields set, score within bounds), a MULTI_SELECT answer with 3 selected options, and composite-PK rejection of a duplicate selection.

### Files changed

- `backend/database/migrations/0001_01_01_000000_create_users_table.php` (rewritten: canonical users)
- `backend/database/migrations/2026_08_31_000001_create_courses_table.php` … `000010_create_ai_generation_requests_table.php` (new)
- `backend/database/seeders/DatabaseSeeder.php` (rewritten: deterministic fixtures)
- `docs/DECISIONS.md` (D-031)
- `docs/database/SCHEMA_CONTRACT.md` (migration plan status, D-031 FK exception)
- `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/SESSION_LOG.md` (status/log updates)
- Unchanged: stock `cache`/`jobs` migrations, `password_reset_tokens`, `sessions`, `UserFactory.php`, Legacy worktree, `composer.json`.

### Exact next step

Phase 1B exit review: verify the implementation against `SCHEMA_CONTRACT.md` (incl. D-031), then commit/push the Phase 1B.2 checkpoint when the user authorizes. Do not start admin/auth feature work before Phase 1 exit criteria pass.

## 2026-08-31 — Phase 1C.1 authentication contract frozen

### Goal

Complete the read-only authentication contract review, resolve its remaining product questions, and freeze the result in canonical documentation before any Sanctum or authentication implementation.

### Verified repository baseline

- Reconfirmed Laravel Framework `13.29.0` / PHP `^8.3`, no installed Sanctum, no `config/sanctum.php`, no API route file/wiring, no published CORS config, and the default session guard.
- Reconfirmed database-backed sessions and the stock sessions/password-reset-token infrastructure.
- Reconfirmed Mailpit SMTP development routing and the canonical users lifecycle/provenance schema.
- Reconfirmed the stock-like `User` model has not enabled `MustVerifyEmail` and Angular 22 has no auth client/state/guards yet.
- Reconfirmed Legacy used separate guards/models and mixed bearer-token behavior; it remains read-only historical evidence and is not the V2 contract.
- Corrected stale Phase 1B status: the database implementation was reviewed and committed at `d474d70`.

### Contract frozen

- Created `docs/auth/AUTH_CONTRACT.md` as the single detailed source for identity, password, Sanctum SPA/session, account states, allowed transitions, Student registration/approval, authenticated signed verification, Instructor invitations, password recovery, first production Admin bootstrap, MVP endpoints, authorization layering, security, implementation slices, and deferrals.
- Locked restricted authenticated sessions for PENDING/SUSPENDED/REJECTED accounts and verified+ACTIVE as the normal application-access gate.
- Locked the eight-character/letter/number password rule.
- Locked seven-day Instructor invitations: acceptance sets password + verifies + activates; atomic reissue revokes unused invitations; expiry leaves PENDING; reissue is the only pre-acceptance Admin recovery.
- Locked Admin-only session-revoking suspension reactivation and Admin-only `REJECTED -> PENDING` reversal through the normal verification/approval lifecycle.
- Locked lifecycle-neutral email-link password recovery for accounts with established passwords.
- Locked immediate restricted session creation after Student registration and authenticated-session + signed-link email verification.
- Locked `php artisan app:create-admin` as the production first-Admin path and internal-only Student rejection reasons.
- Recorded these product decisions as D-032 through D-039.

### Scope and consistency

- Documentation only. No package installation, migrations, routes, controllers, middleware, Angular code, tests, or other application implementation.
- No Legacy worktree modifications.
- No remaining UNKNOWN authentication business decisions block Phase 1C.2.
- Deferred features remain explicit in `AUTH_CONTRACT.md`; they are not silently promoted into the MVP.

### Exact next step

Phase 1C.2 only: install/configure Sanctum, wire stateful API routing/middleware, establish CSRF/CORS/session and Angular development-proxy contracts, and add focused foundation tests. Do not implement login or later authentication slices in Phase 1C.2.

## 2026-08-31 — Phase 1C.2 Sanctum/API/CSRF foundation implemented

### Goal

Establish the minimum reliable first-party Angular → Laravel Sanctum cookie/session foundation without implementing login, registration, verification, lifecycle behavior, or auth UI.

### Implementation

- Installed `laravel/sanctum` `v4.3.3` (`^4.3`), whose official package constraints support Illuminate/Laravel 13.
- Deliberately did not run `php artisan install:api`: it would publish the optional `personal_access_tokens` migration, which first-party session authentication does not require.
- Added only the application Sanctum settings needed here: stateful hosts `localhost:4200,localhost:8080` and guard `web`. No `HasApiTokens`, PAT migration, or token endpoint.
- Registered `backend/routes/api.php` through Laravel 13 bootstrap routing. Added only permanent infrastructure `GET /api/health`; preserved web, console, and `/up` routes.
- Enabled `$middleware->statefulApi()` and retained JSON rendering for `api/*`.
- Preserved `SESSION_DRIVER=database`. Local browser cookies use unique name `smart_book_v2_session`, host-only domain, HttpOnly, SameSite=Lax, and Secure=false for HTTP development; settings remain environment-driven.
- Added exact credentialed CORS for `http://localhost:4200`; no wildcard origin. The single-origin CORS library may emit that configured value for an untrusted preflight, but it never reflects the untrusted origin, so the browser rejects the mismatch; this is covered by a test.
- Added Angular proxy rules for relative `/api` and `/sanctum` requests to `http://backend:8080`. `backend` is the correct target because Angular runs inside the frontend container.
- Added centralized Angular HttpClient configuration: relative API base, credentials interceptor, and standard `XSRF-TOKEN` → `X-XSRF-TOKEN` handling. No AuthService, store, guard, method, or page was created.
- Added `SpaFoundationTest` and Angular provider tests. The protected backend proof route is registered only inside the test process; no fake protected runtime endpoint remains.

### Verification

- `composer validate --strict --no-check-publish`: passed.
- Sanctum package resolution: `v4.3.3`; no security advisory reported during install.
- Targeted Pint for all Phase 1C.2 PHP files: passed. Repository-wide Pint also identified 12 pre-existing style issues in Phase 1B migrations/seeder; those unrelated canonical files were not reformatted.
- `php artisan test`: 10 passed, 30 assertions.
- Prettier check for all changed Angular files: passed.
- `npm test -- --watch=false`: 2 files, 5 tests passed.
- `npm run build`: passed; production bundle generated.
- Route/config inspection: `/api/health` uses the `api` group; `/sanctum/csrf-cookie` uses `web`; runtime session driver is database; Sanctum stateful hosts and exact CORS origin match this contract.
- Docker browser-equivalent proof through `http://localhost:4200`: `/sanctum/csrf-cookie` returned `204` with `XSRF-TOKEN` and `smart_book_v2_session`; `/api/health` returned the expected JSON through the proxy.
- All five services healthy; frontend, backend `/up`, Flask health, and Mailpit returned HTTP 200.
- Legacy worktree remained clean and untouched.

### Scope notes

- No database schema change. Sanctum's optional PAT migration was not published.
- No business-rule change and no new decision ID.
- No login, logout, `/api/auth/me`, registration, verification, account-state middleware, Admin lifecycle, invitation, password recovery, first-Admin command, auth UI/store/guard, or domain API.

### Exact next step

Phase 1C.3 only: implement email-only login, logout, and `GET /api/auth/me` with canonical lowercase normalization, session regeneration/invalidation, safe lifecycle state output, throttling, and focused backend tests. Do not implement later Phase 1C slices yet.

## 2026-09-01 — Phase 1C.3 login/logout/me implemented and verified

### Goal

Implement email-only login, logout, and `GET /api/auth/me` on the proven Sanctum session foundation, with canonical normalization, session regeneration/invalidation, safe auth-state output, throttling, and focused backend tests.

### Scope guardrails honored

- No registration, email verification, account-state application middleware, Admin approval/rejection, invitations, password recovery, Admin bootstrap command, or Angular auth UI/store/guards (these remain later Phase 1C slices).
- No bearer/PAT auth and no remember-me. Docker/PHPUnit changes were limited to the isolated MySQL test-database foundation required for safe automated testing.

### Implementation

- `App\Support\EmailNormalizer` — reusable trim + lowercase normalization applied before login lookup/validation.
- `POST /api/auth/login` (public): validation `422`; generic invalid-credentials `401`; `PENDING`/`ACTIVE`/`SUSPENDED`/`REJECTED` may authenticate with correct credentials; session regeneration; explicit `last_login_at` update; no remember-me; no bearer/PAT.
- `GET /api/auth/me` (`auth:sanctum`): all authenticated account statuses; safe representation only (`id`, `name`, `email`, `role`, `status`, `email_verified_at`).
- `POST /api/auth/logout` (`auth:sanctum`): current-session logout, session invalidation, CSRF token regeneration, `204`; subsequent `/api/auth/me` → `401`.
- Login throttling: Laravel RateLimiter keyed by normalized email + IP; 5 failed credential attempts per minute, next attempt `429`; success clears failed-attempt state; validation failures do not consume credential attempts; unknown accounts do not leak existence.

### Test database foundation

- Development DB `smart_book_v2`; automated test DB `smart_book_v2_test`. Canonical PHPUnit execution is inside the backend container and resolves to `mysql://db:3306/smart_book_v2_test`.
- Fresh MySQL Docker volumes auto-provision the test DB through `docker/mysql/init/10-create-test-database.sh`.
- `RefreshDatabase` isolation explicitly proven.
- Historical note (kept concise): during test-infrastructure development one accidental `migrate:fresh` reached `smart_book_v2`; the incident was audited — canonical schema/data hashes matched before/after, though transient runtime tables (sessions/cache/jobs) could not be proven unchanged historically. The infrastructure was subsequently corrected and safe isolation was proven.

### Verification results (all observed)

- Full Laravel suite green: **37 tests, 150 assertions, 0 failures, 0 errors** (PHPUnit 12.5.34, resolved DB `mysql://db:3306/smart_book_v2_test`, no process-level DB overrides).
- Focused `LoginFoundationTest` green after strengthening validation/throttling coverage: **19 tests, 110 assertions**.
- `git diff --check`: clean.
- Dev DB `smart_book_v2` unchanged during the verified automated suite: schema hash MATCH, canonical domain/auth data hash MATCH.
- Runtime auth flow proven against a disposable user in `smart_book_v2_test` using an isolated one-off backend server: `GET /sanctum/csrf-cookie` → `204`; `POST /api/auth/login` → `200`; `GET /api/auth/me` → `200`; `POST /api/auth/logout` → `204`; `GET /api/auth/me` after logout → `401`.
- Accuracy note: the complete runtime login/logout flow was performed **directly against the isolated temporary backend on `:18080`**, NOT through `localhost:4200`. The Angular proxy/Sanctum/CSRF foundation was verified separately in Phase 1C.2; do not claim the full flow was proven end-to-end through the Angular proxy.

### Files changed

- `backend/app/Support/EmailNormalizer.php` (new)
- `backend/app/Http/Controllers/AuthController.php` (new)
- `backend/routes/api.php` (login/**me**/logout routes)
- `backend/tests/Feature/LoginFoundationTest.php`, `AuthMeTest.php`, `AuthLogoutTest.php` (new)
- `docker/mysql/init/10-create-test-database.sh` (new)
- `compose.yaml` (automatic `smart_book_v2_test` provisioning)
- `backend/phpunit.xml` (isolated MySQL PHPUnit configuration)
- `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/SESSION_LOG.md` (status/log updates)
- No commit.

### Exact next step

Phase 1C.4 — Student registration: public Student-only `POST /api/auth/register` creating a `STUDENT/PENDING` account with an immediate restricted session, per `AUTH_CONTRACT.md`. Do not implement verification, account-state middleware, invitations, recovery, Admin lifecycle actions, or Angular auth UI yet.

## 2026-09-01 — Phase 1C.4–1C.5 registration and email verification implemented and verified

### Scope

Implemented Student registration and the dependent email-verification/resend flow on top of the proven Sanctum session foundation. No Phase 1C.6 account-state application gate, Admin lifecycle, recovery, invitations, or full Angular auth integration was started.

### Phase 1C.4 — Student registration

- Added public `POST /api/auth/register`.
- Canonical email normalization: trim + lowercase.
- Password policy: confirmed, minimum 8 characters, at least one letter and one number; no uppercase/symbol requirement.
- Server assigns `role=STUDENT`, `status=PENDING`, `email_verified_at=null`; clients cannot override lifecycle fields.
- Password is stored through Laravel's configured hashing behavior.
- Successful registration immediately establishes and regenerates a restricted authenticated session.
- Verification notification is dispatched and the safe user representation is returned with `201`.
- Existing/reserved email returns validation failure; `REJECTED` emails cannot re-register.
- Registration throttle: normalized email + IP, 3 attempts / 60 seconds.

### Phase 1C.5 — Email verification/resend

- Added `GET /api/auth/email/verify/{id}/{hash}` named `verification.verify`.
- Callback uses `auth:sanctum`, signed URL validation, `EmailVerificationRequest`, and `throttle:6,1`.
- Verification changes only `email_verified_at`; the Student remains `PENDING`.
- Added authenticated resend endpoint for `STUDENT/PENDING` unverified accounts.
- Resend throttle: user ID, 3 attempts / 60 seconds.
- Added configurable frontend success redirect using `FRONTEND_URL` + `/auth/verify-email/success`.
- Added the minimal Angular verification-success route/component; it explicitly states that email verification succeeded while administrator approval is still pending.
- Real Laravel `VerifyEmail` mail rendering and signed URL construction are covered by tests.

### Runtime Mailpit proof

An isolated one-off backend was started against `smart_book_v2_test` on port `18081`.

Observed:

- runtime database: `mysql|db|3306|smart_book_v2_test`;
- real `POST /api/auth/register` returned `201`;
- created user state was `STUDENT/PENDING`, unverified;
- Mailpit changed to `Messages=1`, `Unread=1`, `SMTPAccepted=1`;
- disposable test user was deleted;
- proof container was removed;
- the five normal project services remained healthy.

### Verification

- Laravel full suite: **75 passed, 280 assertions**.
- Angular tests: **7 passed**.
- Angular production build: passed.
- `git diff --check`: passed.

### Approved scope adjustment

The frozen product behavior still requires a user who opens a signed verification URL without a valid session to authenticate and then resume that original verification request.

The browser/UI implementation of preserving and resuming that signed target is intentionally assigned to **Phase 1C.11 — Angular auth integration**, because the Angular login/auth state flow does not exist yet. Phase 1C.5 owns and completes the backend signed-verification/email behavior.

### Exact next step

Phase 1C.6 — centralized account-state authorization: normal application APIs require authenticated + verified + `ACTIVE`, while restricted authenticated states retain only explicitly permitted auth endpoints.

## 2026-09-01 — Phase 1C.6 account-state authorization implemented and verified

### Implementation

- Added centralized `EnsureUserHasApplicationAccess` middleware and registered alias `application.access`.
- Normal application routes compose `auth:sanctum` followed by `application.access`.
- Only verified `ACTIVE` accounts pass the application-access gate.
- Authenticated but restricted accounts receive generic `403` JSON; guests remain `401`.
- `PENDING` verified/unverified, `SUSPENDED`, `REJECTED`, and `ACTIVE` unverified accounts cannot access normal application APIs.
- Existing restricted auth endpoints (`/auth/me`, logout, eligible verification resend, signed verification callback) retain their existing behavior.
- No permanent proof endpoint was added; the protected proof route exists only in the test process.
- No schema, Docker, PHPUnit infrastructure, role-policy, Admin lifecycle, or frontend changes.

### Verification

- Focused `AccountStateAuthorizationTest`: **11 passed, 23 assertions**.
- Full Laravel suite: **86 passed, 303 assertions**.
- `git diff --check`: passed.

### Exact next step

Phase 1C.7 — Admin Student lifecycle: approve verified `PENDING` Students, reject `PENDING` Students with an internal reason, and restore `REJECTED` Students to unverified `PENDING`, preserving transition/provenance rules.

## 2026-09-01 — Phase 1C.7 Admin Student lifecycle implemented and verified

### Implementation

- Added reusable Admin authorization middleware.
- Admin lifecycle routes use `auth:sanctum` → `application.access` → `admin`.
- Added thin Admin lifecycle controller and transactional `StudentLifecycle` action.
- Every transition reloads the Student using `lockForUpdate()` before validating and mutating state.
- Approve: verified `STUDENT/PENDING` → `ACTIVE`; records approval and latest status-transition provenance; does not create enrollment.
- Reject: `STUDENT/PENDING` → `REJECTED`; requires internal reason and records latest status-transition provenance.
- Restore: `STUDENT/REJECTED` → unverified `PENDING`; clears approval metadata and `status_reason`; records restoring Admin/time as the latest status transition.
- Invalid lifecycle transitions return generic `409`; invalid rejection reason input returns `422`.
- Internal rejection reasons are not exposed through lifecycle responses or `/api/auth/me`.

### Contract clarification

The canonical database contract defines `status_changed_at`, `status_changed_by_user_id`, and `status_reason` as current/latest-transition metadata, while a full status audit trail is out of MVP scope.

Accordingly, the Auth Contract restore wording was clarified: restoring `REJECTED` → `PENDING` records the restore itself as the latest transition rather than retaining stale rejection transition values.

No history/audit table or migration was added.

### Verification

- Focused `AdminStudentLifecycleTest`: **15 passed, 78 assertions**.
- Full Laravel suite: **101 passed, 381 assertions**.
- `git diff --check`: passed.

### Exact next step

Phase 1C.8 — Instructor invitation/password setup: Admin-created pending Instructor accounts, seven-day single-use invitations, atomic invitation reissue/revocation, password establishment, email verification, and activation on acceptance.

## 2026-09-01 — Phase 1C.8 Instructor invitation/password setup implemented and verified

### Persistence and security

- Added dedicated `instructor_invitations` persistence.
- Invitation token source is 32 cryptographically random bytes represented as 64 hex characters.
- Only the SHA-256 token digest is persisted; plaintext invitation tokens are never stored.
- Invitations expire after seven days and carry accepted/revoked timestamps.
- Unaccepted Instructor accounts use an unguessable unusable password hash until invitation acceptance.

### Admin creation and reissue

- Admin creation is protected by `auth:sanctum` → `application.access` → `admin`.
- Creation atomically persists an `INSTRUCTOR/PENDING` unverified account and its invitation.
- `created_by_user_id` records the creating Admin.
- Reissue locks/revalidates the Instructor, revokes all previous unused invitations, and persists one replacement invitation transactionally.
- Reissue is throttled to 3 attempts/minute per authenticated Admin.
- Invitation notifications are registered with `DB::afterCommit()` so a rolled-back transaction never sends an unusable invitation link.

### Public validation and acceptance

- Public validation returns only minimal `usable`/expiry state.
- Invalid, expired, revoked, accepted, and lifecycle-invalid invitations share a safe unusable response.
- Validation is throttled to 10 requests/minute per IP.
- Acceptance is throttled to 5 requests/minute per IP.
- Acceptance uses transaction + row locking and rechecks invitation and Instructor invariants under lock.
- Successful acceptance establishes the password, marks email verified, changes status to `ACTIVE`, records current transition provenance, consumes the invitation, and revokes other unused invitations.
- Acceptance returns `204` and does not authenticate the Instructor; normal login is required afterward.
- The invitation email uses `FRONTEND_URL/auth/instructor-invitations/{token}`. Angular route/UI implementation remains deferred.

### Verification

- Focused `InstructorInvitationTest`: **21 passed, 161 assertions**.
- Full Laravel suite: **122 passed, 542 assertions**.
- `git diff --check`: passed.
- No Phase 1C.9 implementation was started.

### Exact next step

Phase 1C.9 — forgot/reset password: established-password eligibility, enumeration-safe forgot responses, lifecycle preservation, and invalidation of existing sessions after successful reset.
