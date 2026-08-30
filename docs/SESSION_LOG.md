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
