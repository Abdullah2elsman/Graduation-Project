# Smart Book V2 — Rebuild Context

This document is the canonical implementation handoff for Smart Book V2. Future agents must read it together with `PROJECT_STATE.md`, `DECISIONS.md`, `ROADMAP.md`, and the latest entry in `SESSION_LOG.md` before proposing or changing implementation code.

## Goal

Complete the incomplete graduation project as a coherent, reproducible learning platform. V2 is a clean rebuild: preserve useful product intent and workflows from the legacy application, but do not preserve broken schema, API, or frontend contracts for compatibility.

## Repository and Git safety

- Original reference commit: `fbfcdda`
- Historical branch: `legacy/original` (read-only)
- Immutable starting tag: `legacy-original-2026-08-31`
- Active rebuild branch: `rebuild/v2`
- V2 worktree: `~/Projects/Smart-Book` on `rebuild/v2`
- Legacy worktree: `~/Projects/Smart-Book-Legacy` on `legacy/original`
- Never implement V2 work on or modify `legacy/original`.
- Never modify files in `~/Projects/Smart-Book-Legacy`; it is an independently runnable, read-only reference worktree.
- Do not rewrite or move the immutable tag.
- Do not commit unless the user explicitly asks.

## Legacy/V2 comparison contract

- Legacy and V2 must be able to run at the same time on one developer machine.
- Legacy is reference code and a source of historical screen/behavior evidence only.
- V2 must not import from, call, mount, or otherwise depend on the legacy worktree or legacy runtime.
- Rebuilding a page includes opening the equivalent Legacy and V2 pages side by side when a legacy equivalent exists, then comparing the workflow and behavior. V2 is still free to improve the UI and correct legacy defects.
- Legacy and V2 must never use the same application database, schema, data directory, or Docker volume. V2 receives its own MySQL database and persistent volume.

## Locked architecture

- Frontend: Angular SPA, redesigned rather than pixel-perfect legacy migration.
- Backend: Laravel, with clean validation, authorization, transactions, services/actions, and tests.
- Authentication: Laravel Sanctum cookie/session authentication for the Angular SPA.
- Database: MySQL 8.x with new canonical migrations; legacy migrations are not preserved.
- AI: separate internal Flask service. Only Laravel may call Flask.
- Development runtime: Docker Compose from the beginning.
- Delivery: foundation first, then vertical product slices.

```text
Angular SPA
    |
    | Sanctum cookie/session + JSON API
    v
Laravel API ------> MySQL 8
    |  \
    |   \--------> file storage / PDF extraction
    |
    \------------> internal Flask AI service

Development email: Laravel SMTP -> Mailpit
```

## Authentication contract

- Email is the only login identifier. Do not introduce username login.
- Normalize email consistently, preferably by trimming and lowercasing before validation/persistence/login lookup.
- `users.email` is unique.
- Use one `users` table with roles `ADMIN`, `INSTRUCTOR`, and `STUDENT`.
- Do not create separate admin, instructor, or student authentication tables.
- The canonical current-user endpoint is `/api/auth/me`.
- Use Laravel's signed email-verification flow. Do not invent an OTP flow unless a later accepted requirement requires one.

## Student signup and account lifecycle

Public self-registration is available only to students. Admin creates instructor accounts. A self-registered account begins with:

```text
role = STUDENT
status = PENDING
email_verified_at = null
```

Required lifecycle:

```text
student signup
  -> PENDING account
  -> signed verification email
  -> email_verified_at set
  -> account remains PENDING
  -> administrator approval
  -> ACTIVE account
```

Canonical account statuses are:

- `PENDING`
- `ACTIVE`
- `SUSPENDED`
- `REJECTED`

Email verification is not an account status. Course enrollment is also separate from verification and account status.

Access rules:

- Pending and unverified users may authenticate only to restricted authentication/session endpoints. Angular must ask them to verify their email.
- Pending and verified users may access `auth/me` and logout. Angular must show “Waiting for administrator approval.”
- Pending users must not access normal course or application APIs.
- Suspended and rejected users must not access normal application APIs.
- A rejected email remains reserved; deleting and registering again must not bypass rejection.
- Do not destructively delete accounts that may own academic history. Suspension/rejection must preserve enrollments, attempts, grades, reports, and audit context.
- Store explicit approval metadata and sufficient status-change metadata.

## Development email

- Docker Compose includes Mailpit.
- Laravel development SMTP routes to Mailpit.
- Mailpit provides the development inbox UI.
- Production email provider selection is deferred.

## Domain model

### Users and profiles

Keep common profile data on `users` for V2. Add a separate role-specific profile table only when an accepted requirement introduces genuinely role-specific attributes; do not create empty speculative profile tables.

### Courses and instructors

- Every course has exactly one assigned instructor through `courses.instructor_id`.
- There is no `course_instructors` many-to-many table.
- Admin may reassign the direct instructor reference later.
- Application authorization must verify that an instructor owns the course being managed.

### Course books

- A course may contain multiple PDF books.
- Store books in `course_books`.
- Reading, extraction, interactions, and AI generation reference a specific `course_book`.
- Archive/replace files without destroying academic history that references them.

### Enrollment

- Admin alone manages enrollment in the initial V2.
- Instructor may view the roster for assigned courses but may not enroll, cancel, or reactivate students initially.
- Student activation does not create enrollment.
- Enrollment lifecycle supports `ACTIVE` and `CANCELLED`.
- A student/course pair has one canonical enrollment record whose lifecycle may change.

### Quizzes and attempts

- Instructor configures `max_attempts` per quiz.
- Preserve each attempt independently.
- Attempt records include `attempt_number`, `started_at`, `submitted_at`, lifecycle/status, score, and a maximum-score snapshot.
- Valid submitted attempts determine the final grade:

```text
final grade = highest score among valid SUBMITTED attempts
```

- Do not store or overwrite a single “final attempt.” Compute the best valid submitted score.
- Enforce `max_attempts`, timing, enrollment, and ownership server-side.

### Result release

The locked initial policy is release after `quizzes.ends_at`.

Before `ends_at`, a submitted student sees only submission confirmation. The server must not return score, correct answers, previous-attempt scores, or detailed review—even if the student can start another attempt.

At or after `ends_at`, authorized students may see results and attempt details. The quiz schema includes a result-release policy and optional release timestamp so later policies can be added without redesigning attempts.

### Academic history

- Published quiz structure must not be destructively mutated in a way that corrupts attempts.
- Attempts and answers store scoring snapshots needed for reliable history.
- Users, courses, books, quizzes, and attempts use lifecycle/archive behavior where deletion would break history.

## AI quiz generation

The required communication path is:

```text
Angular -> Laravel -> Flask
```

Never allow Angular to call Flask directly.

Laravel is responsible for:

- authenticating the instructor;
- authorizing course/book access;
- validating the selected `course_book` and page range;
- extracting PDF text;
- constructing the provider-independent AI request;
- calling Flask with timeouts and failure handling;
- validating the response schema;
- persisting request/audit state and accepted quiz data.

Flask returns a quiz draft. The instructor must review and edit the draft before publishing. Generation references one `course_book`, `start_page`, and `end_page`.

Flask uses a provider adapter so hosted, local, and fake test providers can be substituted without changing Laravel or Angular.

## Frontend delivery rule

Legacy Vanilla JavaScript screens are workflow and product references only. Angular pages may improve information architecture, accessibility, responsiveness, and interaction design.

Build vertical slices. A screen is not complete when it merely renders. A completed slice includes:

```text
schema/model
  -> business rules
  -> API
  -> validation and authorization
  -> backend tests
  -> Angular service/state
  -> Angular page
  -> loading/error/empty/success behavior
  -> manual smoke test
  -> side-by-side Legacy/V2 comparison when an equivalent legacy page exists
```

## Admin slice order

After foundation, implement:

1. Admin authentication and app shell
2. Admin Dashboard
3. Pending Student Approval
4. Instructor Management
5. Student Management
6. Course Management
7. Instructor Assignment
8. Enrollment Management
9. Course Details
10. Reports only after attempts and grading data are trustworthy

Pending Student Approval must distinguish at least:

- awaiting email verification;
- verified and awaiting approval;
- active;
- rejected or suspended where useful.

## Docker onboarding target

Initial Compose services:

- `backend`: Laravel/PHP
- `frontend`: Angular/Node
- `db`: MySQL 8
- `ai`: Flask/Python
- `mailpit`: SMTP and development inbox

Locked host-port allocation:

| Runtime | Service | Host port | Container port |
|---|---|---:|---:|
| Legacy | Static frontend | `5501` | Not Docker-managed by V2 |
| Legacy | Laravel backend | `8005` | Not Docker-managed by V2 |
| V2 | Angular frontend | `4200` | To be defined by the frontend container |
| V2 | Laravel API | `8080` | To be defined by the backend container |
| V2 | Flask AI | `5001` | To be defined by the AI container |
| V2 | MySQL | `3307` | `3306` |
| V2 | Mailpit UI | `8025` | `8025` |

These V2 host ports must remain non-conflicting with the legacy ports. Container-to-container traffic must use Compose service names and container ports rather than host `localhost` mappings. The V2 database name, credentials, and named volume must be distinct from every legacy database configuration.

Target onboarding:

```bash
git clone ...
cp .env.example .env
docker compose up --build
```

Document internal URLs, environment variables, persistent volumes, startup dependencies, and health checks. Do not rely on host PHP, Node, Python, or MySQL versions. Validate that the Legacy and V2 runtimes can remain available together without a port or database collision. Add Redis, workers, object storage, or other infrastructure only when a demonstrated requirement justifies it.

## Current boundary

Architecture decisions and the V2 ERD are locked. No Laravel, Angular, Flask, or Docker scaffolding has started. The next implementation phase is Docker/Foundation as defined in `ROADMAP.md`.
