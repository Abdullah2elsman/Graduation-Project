# Smart Book V2 — Current Project State

**Date:** 2026-08-31

**Current branch:** `rebuild/v2` tracking `origin/rebuild/v2`

**Current worktrees:** V2 at `~/Projects/Smart-Book`; read-only Legacy at `~/Projects/Smart-Book-Legacy`

**Current phase:** Phase 0 architecture/documentation checkpoint; awaiting user review before Phase 1

**Implementation state:** No V2 application or Docker scaffolding has started

## Completed

- Audited the incomplete legacy repository in read-only mode.
- Preserved original code in read-only branch `legacy/original`.
- Created immutable tag `legacy-original-2026-08-31`.
- Created and pushed `rebuild/v2`.
- Created the canonical Markdown handoff pack.
- Re-evaluated the Smart Book V2 database model and draw.io ERD.
- Defined Docker/Foundation as the next implementation phase.
- Verified separate worktrees for `rebuild/v2` and read-only `legacy/original`.

## Locked

- Angular SPA frontend; legacy Vanilla JavaScript is workflow reference only.
- Clean Laravel backend rebuild with new API contracts and tests.
- Separate internal Flask AI service called only by Laravel.
- Docker Compose from the beginning: Laravel, Angular, MySQL 8, Flask, and Mailpit.
- Legacy and V2 run side by side for page-level visual and behavioral comparison; V2 never depends on the Legacy runtime.
- Legacy ports remain static frontend `5501` and Laravel `8005`.
- V2 host ports are Angular `4200`, Laravel API `8080`, Flask AI `5001`, MySQL `3307 -> 3306`, and Mailpit UI `8025`.
- Legacy and V2 never share an application database, schema, data directory, or Docker volume.
- One `users` table with `ADMIN`, `INSTRUCTOR`, and `STUDENT` roles.
- Email-only login, unique normalized email, Sanctum cookie/session auth, and `/api/auth/me`.
- Public student-only signup; new students are `STUDENT/PENDING`.
- Signed email verification followed by separate administrator approval.
- Account states `PENDING`, `ACTIVE`, `SUSPENDED`, and `REJECTED`; verification remains `email_verified_at`.
- Pending users are restricted from normal application APIs.
- Historical academic data is preserved; accounts are suspended/rejected rather than destructively deleted.
- Exactly one instructor per course via direct `courses.instructor_id`; admin can reassign it.
- Multiple PDF books per course through `course_books`.
- Admin-only enrollment management initially; activation does not imply enrollment.
- Per-quiz `max_attempts`; preserve every attempt.
- Final grade is the highest score among valid submitted attempts.
- Scores, previous-attempt scores, correct answers, and detailed review remain server-hidden before `quiz.ends_at`.
- AI generation uses a specific book/page range and produces an instructor-reviewed draft.
- Foundation-first, vertical-slice implementation and fixed Admin slice order.

## Not started

- Docker Compose or container definitions.
- Laravel, Angular, or Flask V2 scaffolding.
- MySQL migrations and seeders.
- Mailpit configuration.
- Authentication endpoints or Angular auth pages.
- Any Admin, Instructor, Student, course, book, quiz, AI, analytics, or report implementation.
- Package installation.

## Current documentation changes

This documentation/ERD update is intentionally uncommitted pending user review.

## Exact next step

After the user approves this checkpoint, implement the Phase 1 Docker/Foundation skeleton: Compose services for `backend`, `frontend`, `db`, `ai`, and `mailpit`, using the locked V2 host ports, an isolated V2 MySQL database/volume, pinned images, environment templates, health checks, and minimal health endpoints. Prove it can coexist with the separately runnable Legacy worktree before implementing product pages.
