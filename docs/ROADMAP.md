# Smart Book V2 Roadmap

The roadmap is dependency-ordered and delivered as vertical slices. Checkbox completion requires working backend/frontend integration and tests, not only rendered UI.

## Phase 0 — Safety and Architecture

- [x] Preserve `legacy/original` as historical read-only reference.
- [x] Create immutable tag `legacy-original-2026-08-31`.
- [x] Create and push active branch `rebuild/v2`.
- [x] Separate V2 and Legacy into `~/Projects/Smart-Book` and `~/Projects/Smart-Book-Legacy` worktrees.
- [x] Lock side-by-side runtime comparison, runtime independence, port separation, and database isolation.
- [x] Audit the legacy repository and document the implementation reality.
- [x] Lock the V2 product, architecture, authentication, role, lifecycle, grading, AI, and Docker decisions.
- [x] Re-evaluate and document the canonical V2 ERD.
- [ ] User review of this documentation/ERD checkpoint.
- [ ] Commit the reviewed documentation checkpoint when explicitly requested.

## Phase 1 — Docker and Foundation

Phase 1 is split into:

- **Phase 1A (complete 2026-08-31)** — infrastructure/runtime foundation.
- **Phase 1B (complete 2026-08-31)** — canonical persistence: 1B.1 contract/ERD committed at `2babd1a`; 1B.2 migrations/sessions/seeders committed at `d474d70`.
- **Phase 1C (current)** — authentication: 1C.1 contract review complete; 1C.2 Sanctum/API/CSRF/CORS foundation implemented and verified; 1C.3 login/logout/me is next.

### Phase 1A — Reproducible runtime

- [x] Add Docker Compose with `backend`, `frontend`, `db`, `ai`, and `mailpit` services.
- [x] Pin suitable PHP/Composer, Node, Python, and MySQL 8 image versions (`php:8.4-cli`, `composer:2.10.2`, `node:22.22.3-bookworm-slim`, `python:3.12-slim`, `mysql:8.0`, `axllent/mailpit:v1.21`).
- [x] Apply the locked V2 host ports: Angular `4200`, Laravel `8080`, Flask `5001`, MySQL `3307 -> 3306`, and Mailpit UI `8025`.
- [x] Preserve the Legacy host ports `5501` and `8005` so both systems can run concurrently (verified free).
- [x] Define internal service URLs, named volumes, and health checks; containers use Compose DNS rather than host `localhost` for inter-service calls.
- [x] Create a V2-only MySQL database (`smart_book_v2`) and named volume (`smart_book_v2_db_data`) that are never shared with Legacy.
- [x] Provide root and service `.env.example` files without secrets.
- [x] Route Laravel development mail through Mailpit (`smtp -> mailpit:1025`).
- [x] Make fresh-clone onboarding approach `cp .env.example .env && docker compose up --build`.

### Phase 1A — Application foundations

- [x] Scaffold a clean Laravel backend (Framework 13.29.0, runs in Docker on `8080`).
- [x] Scaffold a clean Angular frontend with routing and SCSS (dev server runs in Docker on `4200`); accessible layout primitives and environment configuration land with the first auth shell slice.
- [x] Scaffold a minimal Flask service with `GET /health` on `5001`; the fake AI provider adapter is deferred to Phase 5 with the real AI request contract (D-021).
- [ ] Add baseline lint/test commands for all three applications. (Laravel ships `composer test`; Angular ships `ng test` and Vitest config. A Flask pytest baseline remains outstanding and must land before AI feature implementation.)

### Phase 1B — Canonical persistence (complete 2026-08-31)

#### Phase 1B.1 — Canonical database contract (complete 2026-08-31)

- [x] Re-evaluate the ERD against all locked business decisions and Legacy evidence.
- [x] Create `docs/database/SCHEMA_CONTRACT.md` (per-table spec, constraints/indexes, DB-vs-app invariant matrix).
- [x] Finalize type-driven questions (`SINGLE_CHOICE` / `MULTI_SELECT`) with normalized `student_answer_options` (D-028).
- [x] Finalize attempt lifecycle `IN_PROGRESS`/`SUBMITTED` + `submission_reason {MANUAL, TIME_EXPIRED}` (D-029, D-030).
- [x] Defer `book_interactions` to Phase 3 (D-027); drop speculative users profile columns (D-023).
- [x] Decide stock-migration disposition: rewrite `users`, retain framework tables stock, `sessions` remains the session table.
- [x] Update the canonical ERD (validated draw.io XML) and DECISIONS/ROADMAP/state/log docs.
- [x] Apply review corrections: symmetric `quiz_attempts` lifecycle CHECK, AFTER_END-only result release, `constrained()`/referential-action wording, and aligned decision IDs.
- [x] User review of this contract checkpoint (4 corrections applied 2026-08-31).
- [x] Commit the reviewed contract checkpoint (commit `2babd1a`, pushed to `origin/rebuild/v2`).

#### Phase 1B.2 — Canonical migrations, sessions, seeders (complete 2026-08-31, committed `d474d70`)

- [x] Rewrite the stock `users` migration; retain `password_reset_tokens` and `sessions` byte-for-byte stock.
- [x] Add domain migrations in dependency order per `SCHEMA_CONTRACT.md` (`2026_08_31_000001`…`000010`): courses, course_books, enrollments, quizzes, questions, options, quiz_attempts, student_answers, student_answer_options, ai_generation_requests.
- [x] Add foreign keys (ON DELETE RESTRICT / ON UPDATE CASCADE, with the documented D-031 `courses.instructor_id` exception), unique constraints, 25 CHECK constraints, lifecycle fields, and indexes explicitly.
- [x] Confirm Laravel database sessions for Sanctum SPA authentication (`SESSION_DRIVER=database`, stock `sessions` table; no extra table needed).
- [x] Add deterministic seed data: one admin, one instructor, an ACTIVE and a PENDING student, one course, one active enrollment, and a minimal quiz fixture (one SINGLE_CHOICE and one MULTI_SELECT question).
- [x] Prove migrations and seeders work from an empty database (`php artisan migrate:fresh --seed`, 19 tables) and verify constraints with negative SQL tests.

### Phase 1C — Authentication and account lifecycle

The frozen contract is `docs/auth/AUTH_CONTRACT.md`. Complete these small reviewable slices in order:

- [x] **1C.1 — Authentication Contract Review:** reverify the implementation baseline and freeze identity, password, state machine, student approval, Instructor invitation, signed verification, recovery, Admin bootstrap, endpoints, SPA, authorization, and security behavior.
- [x] **1C.2 — Sanctum/API/CSRF/CORS foundation:** installed Sanctum 4.3.3, wired stateful API routing, configured database sessions/cookies/exact credentialed CORS, added the Angular proxy and central HttpClient/XSRF providers, and verified the foundation with automated and Docker HTTP tests. No token or auth business endpoints were added.
- [ ] **1C.3 — Login, logout, `/api/auth/me` (NEXT):** email normalization, restricted-session state payload, throttling, and session security.
- [ ] **1C.4 — Student registration:** public Student-only creation as `PENDING` plus immediate restricted session.
- [ ] **1C.5 — Email verification/resend:** authenticated signed verification, login/resume behavior, Mailpit delivery, and throttling.
- [ ] **1C.6 — Account-state authorization:** centralized verified/`ACTIVE` gate and restricted PENDING/SUSPENDED/REJECTED behavior.
- [ ] **1C.7 — Admin Student lifecycle:** approval, rejection with internal reason, and Admin-only rejected-to-pending restoration.
- [ ] **1C.8 — Instructor invitation/password setup:** seven-day single-use invitations, atomic reissue/revocation, activation on acceptance.
- [ ] **1C.9 — Forgot/reset password:** established-password eligibility, lifecycle preservation, enumeration safety, and session invalidation.
- [ ] **1C.10 — First production Admin command:** `php artisan app:create-admin` creates an ACTIVE, verified Admin without hardcoded production credentials.
- [ ] **1C.11 — Angular auth integration:** API client/state, CSRF, guards, auth/recovery screens, all restricted states, and browser smoke proof.

### Phase 1 exit criteria

- [ ] A fresh clone starts through Docker without host language/database dependencies. (Phase 1A validated the flow and documented a Docker-DNS caveat on this machine.)
- [x] MySQL, Laravel, Angular, Flask health endpoint, and Mailpit are reachable through documented ports (Phase 1A verification, 2026-08-31).
- [ ] Legacy and V2 can run concurrently without port, database, volume, or runtime dependency conflicts. (V2 ports/db/volume isolation verified; a live concurrent Legacy boot is still outstanding.)
- [ ] A student can sign up, receive a Mailpit verification email, verify, authenticate, and remain restricted while pending.
- [ ] A seeded active admin can authenticate and reach an authorized Angular shell.
- [ ] Automated tests prove pending users cannot access normal application APIs.

## Phase 2 — Admin Vertical Slices

Implement in this exact order:

1. [ ] Admin authentication and app shell
2. [ ] Admin Dashboard
3. [ ] Pending Student Approval
4. [ ] Instructor Management
5. [ ] Student Management
6. [ ] Course Management
7. [ ] Instructor Assignment and reassignment
8. [ ] Enrollment Management
9. [ ] Course Details
10. [ ] Reports after attempts/grading data are trustworthy

Every item includes schema/model changes if needed, business logic, API, validation, authorization, tests, Angular service/state/page, all UI states, a smoke test, and side-by-side comparison with the equivalent Legacy page when one exists. Comparison informs V2 behavior but creates no runtime dependency on Legacy.

## Phase 3 — Course Books and Reading

- [ ] Instructor assigned-course list with ownership enforcement.
- [ ] Multiple PDF books per course.
- [ ] Upload, archive, and replacement lifecycle using Laravel-managed storage.
- [ ] PDF metadata, page count, and safe text extraction through configurable Linux tooling.
- [ ] Authorized Angular PDF reader referencing a specific `course_book`.
- [ ] Student access limited to active account plus active enrollment.
- [ ] Basic book interaction capture.

## Phase 4 — Manual Quiz and Attempt Lifecycle

- [ ] Quiz draft/edit/publish lifecycle.
- [ ] Manual MCQ questions and options.
- [ ] Scheduling with `starts_at` and `ends_at`.
- [ ] Instructor-configurable `max_attempts`.
- [ ] Student start/take/submit flow with transactional server-side grading.
- [ ] Independent attempt history and answer snapshots.
- [ ] Best-grade calculation as highest valid submitted attempt.
- [ ] Server-enforced result hiding before `ends_at`.
- [ ] Results and authorized review at/after release.

## Phase 5 — AI Quiz Draft Vertical Slice

- [ ] Instructor selects a specific book, page range, difficulty, and question count.
- [ ] Laravel authorizes and extracts selected text.
- [ ] Laravel calls Flask internally through the provider-independent contract.
- [ ] Flask provider adapter supports fake tests and one selected real provider.
- [ ] Laravel validates and records AI request/draft/error state.
- [ ] Angular displays an editable generated draft.
- [ ] Instructor review is required before publishing.
- [ ] Integration tests cover success, malformed response, timeout, and provider failure.

## Phase 6 — Analytics, Reports, and Hardening

- [ ] Trustworthy course enrollment and attempt metrics.
- [ ] Average/best-grade and grade-distribution reports.
- [ ] Missing-attempt reports.
- [ ] Book interaction summaries.
- [ ] Authorized report export.
- [ ] Accessibility and responsive-design review.
- [ ] Upload security, AI/login rate limits, safe error responses, and audit review.
- [ ] End-to-end tests for Admin, Instructor, and Student journeys.
- [ ] Reproducible release and operations documentation.

## Deferred Until Justified

- Production email provider.
- Instructor-managed enrollment.
- Google Sheets synchronization.
- OCR for scanned PDFs.
- Personalized recommendations and adaptive difficulty.
- Annotations/highlighting.
- Redis, background workers, object storage, and other extra infrastructure.
