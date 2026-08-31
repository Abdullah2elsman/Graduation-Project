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
- **Phase 1B (NEXT)** — canonical persistence and seeders.

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
- [ ] Add baseline lint/test commands for all three applications. (Laravel ships `composer test`, Angular ships `ng test` and Vitest config; a Flask pytest baseline for the AI service is deferred to Phase 1B.)

### Phase 1B — Canonical persistence (NEXT)

- [ ] Implement the reviewed MySQL 8 schema from `docs/database/Smart_Book_V2_ERD.drawio`.
- [ ] Add foreign keys, unique constraints, lifecycle fields, and indexes explicitly.
- [ ] Configure Laravel database sessions for Sanctum SPA authentication.
- [ ] Add deterministic seed data: one admin, one instructor, representative pending students, one course, one active enrollment, and a minimal quiz fixture.
- [ ] Prove migrations and seeders work from an empty database.

### Authentication and lifecycle vertical slice

- [ ] Email-only login with consistent lowercase normalization.
- [ ] Public student-only signup as `STUDENT/PENDING`.
- [ ] Signed email verification delivered to Mailpit.
- [ ] Sanctum cookie/session login and logout.
- [ ] Canonical `GET /api/auth/me`.
- [ ] Server middleware/policies for verification and account status.
- [ ] Restricted pending-user session behavior.
- [ ] Foundation tests for signup, verification, pending access, activation, suspension, rejection, login, logout, and cross-role authorization.
- [ ] Minimal Angular auth states for verify-email, waiting-for-approval, rejected/suspended, and active-role routing.

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
