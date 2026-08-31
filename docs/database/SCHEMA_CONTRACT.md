# Smart Book V2 — Canonical Database Schema Contract

**Date:** 2026-08-31 (Phase 1B.1)
**Canonical ERD:** `docs/database/Smart_Book_V2_ERD.drawio`
**Target:** MySQL 8.x, Laravel 13 migrations.
**Read together with:** `docs/DECISIONS.md` (D-001…D-030), `docs/REBUILD_CONTEXT.md`, and the latest `docs/SESSION_LOG.md`.

This document is the precise, implementation-ready database contract. A Phase 1B.2 agent must implement the migrations exactly here without inferring business rules. Deliberations and rationale live in `DECISIONS.md`/`SESSION_LOG.md`; this document states the final contract.

---

## 1. Conventions

- **Engine:** InnoDB on every table.
- **Charset/collation:** `utf8mb4` / `utf8mb4_unicode_ci` (case-insensitive). This makes `users.email` case-insensitively unique at the database level.
- **Primary keys:** `BIGINT UNSIGNED AUTO_INCREMENT` (`$table->id()`), except where a natural PK is stated.
- **Foreign keys:** columns are `BIGINT UNSIGNED`. Unless stated otherwise: **ON DELETE RESTRICT, ON UPDATE CASCADE**. In Laravel, `->constrained()` creates the conventional FK (column type/name/table inference); referential actions are declared explicitly and deliberately. For Smart Book domain FKs, declare `->restrictOnDelete()` and `->cascadeOnUpdate()` where this contract intends RESTRICT/CASCADE. Framework tables keep their stock definitions.
  - **DBMS exception (D-031, confirmed Phase 1B.2):** MySQL 8.0 rejects a CHECK that references a column whose FK declares a referential action other than RESTRICT/NO ACTION (error 3823). The two courses CHECKs reference `courses.instructor_id`; that single FK is therefore `restrictOnDelete()->restrictOnUpdate()` (ON DELETE RESTRICT / ON UPDATE RESTRICT). Semantically inert — surrogate PKs are never updated.
- **Timestamps:** `created_at`/`updated_at` (`TIMESTAMP`, nullable, Eloquent-managed) on every domain table. Business timestamps (e.g. `starts_at`) are also `TIMESTAMP`.
- **Timezones:** all datetimes are stored in UTC. The MySQL container session timezone is UTC. `TIMESTAMP` columns convert between the session timezone and UTC; the contract assumes the connection timezone remains UTC. Display-timezone conversion is application-level.
- **Enums:** every role/status/type field is a `VARCHAR` with a database **CHECK constraint** (not MySQL `ENUM`), so legal values are DB-enforced but still extendable by constraint replacement.
- **CHECK constraints:** `mysql:8.0` enforces CHECK (8.0.16+). Implement each CHECK as an explicit `ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)` statement in the migration (do not rely on Blueprint shorthand).
- **Deletion policy:** no hard deletes in the domain. History is preserved via lifecycle statuses (DRAFT/published/ARCHIVED, ACTIVE/CANCELLED, PENDING/ACTIVE/SUSPENDED/REJECTED) and RESTRICT FKs.

---

## 2. Migration strategy and framework tables

### 2.1 Migration file plan (created and verified in Phase 1B.2)

| File | Content | Status |
|---|---|---|
| `0001_01_01_000000_create_users_table.php` | canonical `users` + stock `password_reset_tokens` + stock `sessions` | **Rewritten** (`users` canonical; other two blocks byte-for-byte stock) |
| `0001_01_01_000001_create_cache_table.php` | `cache`, `cache_locks` | **Retained unchanged** |
| `0001_01_01_000002_create_jobs_table.php` | `jobs`, `job_batches`, `failed_jobs` | **Retained unchanged** |
| `2026_08_31_000001_create_courses_table.php` | `courses` | created |
| `2026_08_31_000002_create_course_books_table.php` | `course_books` | created |
| `2026_08_31_000003_create_enrollments_table.php` | `enrollments` | created |
| `2026_08_31_000004_create_quizzes_table.php` | `quizzes` | created |
| `2026_08_31_000005_create_questions_table.php` | `questions` | created |
| `2026_08_31_000006_create_options_table.php` | `options` | created |
| `2026_08_31_000007_create_quiz_attempts_table.php` | `quiz_attempts` | created |
| `2026_08_31_000008_create_student_answers_table.php` | `student_answers` | created |
| `2026_08_31_000009_create_student_answer_options_table.php` | `student_answer_options` | created |
| `2026_08_31_000010_create_ai_generation_requests_table.php` | `ai_generation_requests` | created |

Domain migrations appear after the framework migrations in dependency order. The empty-database proof passed with `php artisan migrate:fresh --seed` inside the dev container (13 migrations, 19 tables — 9 framework incl. `users`, 10 domain — and 25 CHECKs).

### 2.2 Framework tables (retained stock, not part of the domain model)

| Table | Kept because | Notes |
|---|---|---|
| `users` | domain identity table (rewritten below) | — |
| `password_reset_tokens` | Laravel forgot-password flow | `email` PK; unchanged |
| `sessions` | Laravel **database session driver** for Sanctum SPA auth (`SESSION_DRIVER=database`); this is the dedicated session table — no new table needed | stock shape; `user_id` intentionally **index-only, no FK** (framework-managed SET NULL on logout) |
| `cache`, `cache_locks` | `CACHE_STORE=database` | stock |
| `jobs`, `job_batches`, `failed_jobs` | `QUEUE_CONNECTION=database` (future async AI/notifications) | stock |
| `migrations` | framework bookkeeping | stock |

---

## 3. Domain tables

### 3.1 `users`

Purpose: single identity table for all roles (D-009). Admin-created instructors and self-registered students.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| name | VARCHAR(255) | no | — | display name |
| email | VARCHAR(255) | no | — | **UQ**; stored normalized lowercase; CI collation blocks case-variant duplicates (rejection bypass) |
| password | VARCHAR(255) | no | — | bcrypt |
| remember_token | VARCHAR(100) | yes | NULL | stock Laravel |
| role | VARCHAR(16) | no | `'STUDENT'` | CHECK `IN ('ADMIN','INSTRUCTOR','STUDENT')` |
| status | VARCHAR(16) | no | `'PENDING'` | CHECK `IN ('PENDING','ACTIVE','SUSPENDED','REJECTED')` |
| email_verified_at | TIMESTAMP | yes | NULL | verification only; **not** an account status |
| approved_at | TIMESTAMP | yes | NULL | admin approval moment |
| approved_by_user_id | BIGINT UNSIGNED | yes | NULL | FK → users.id |
| status_changed_at | TIMESTAMP | yes | NULL | last status change moment |
| status_changed_by_user_id | BIGINT UNSIGNED | yes | NULL | FK → users.id |
| status_reason | TEXT | yes | NULL | e.g. rejection/suspension reason |
| created_by_user_id | BIGINT UNSIGNED | yes | NULL | FK → users.id; null for self-registered students |
| last_login_at | TIMESTAMP | yes | NULL | updated on login (app-level) |
| created_at / updated_at | TIMESTAMP | yes | NULL | Eloquent |

Keys / constraints:
- `UQ (email)`
- `INDEX (role, status)`, `INDEX (status, email_verified_at)`
- FKs (`approved_by_user_id`, `status_changed_by_user_id`, `created_by_user_id`) → `users.id`: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
- CHECK `role`, CHECK `status`

Business semantics:
- Public signup: students only, begin `STUDENT/PENDING`, unverified. Instructor accounts are created by an admin (`created_by_user_id` set).
- Lifecycle: signup → verify email (`email_verified_at`) → still `PENDING` → admin approval → `ACTIVE`. Activation never enrolls.
- `REJECTED` emails remain reserved forever; re-registering the same email is blocked (app normalization + CI unique).
- No destructive deletion of accounts that may own academic history; suspension/rejection preserve enrollments/attempts/grades.
- Current-state metadata fields capture the latest transition; a full status audit trail is out of scope for the MVP.

DB-enforced: email uniqueness (case-insensitive), role/status value sets.
App-level: lowercase email normalization before persist/login/verification; role/status transition policies (who may approve/suspend/reject); `ACTIVE`-state access enforcement; no-deletion invariant.

### 3.2 `sessions`

Framework table, stock definition (see §2.2). `user_id` nullable, indexed, **no FK**. Not a domain table.

### 3.3 `courses`

Purpose: course catalogue; exactly one direct instructor (D-016) enforced structurally by a single FK column (no pivot).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| instructor_id | BIGINT UNSIGNED | **yes** | NULL | FK → users.id; nullable while course is DRAFT; required when ACTIVE |
| created_by_admin_id | BIGINT UNSIGNED | yes | NULL | FK → users.id |
| instructor_assigned_by_id | BIGINT UNSIGNED | yes | NULL | FK → users.id |
| title | VARCHAR(255) | no | — | |
| description | TEXT | yes | NULL | |
| status | VARCHAR(16) | no | `'DRAFT'` | CHECK `IN ('DRAFT','ACTIVE','ARCHIVED')` |
| instructor_assigned_at | TIMESTAMP | yes | NULL | set when an instructor is assigned |
| archived_at | TIMESTAMP | yes | NULL | set on ARCHIVED |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- `INDEX (instructor_id, status)`, `INDEX (status)`
- FK `instructor_id` → `users.id`: RESTRICT/RESTRICT (D-031 — CHECK references this column); FKs `created_by_admin_id`, `instructor_assigned_by_id` → `users.id`: RESTRICT/CASCADE
- CHECK `(instructor_id IS NULL OR instructor_assigned_at IS NOT NULL)`
- CHECK `(status <> 'ACTIVE' OR instructor_id IS NOT NULL)`

Business semantics:
- Admin creates the course (DRAFT) before assigning an instructor (matches Admin slice order Course Management → Instructor Assignment).
- A course **cannot be ACTIVE (usable/published) without exactly one assigned instructor** — the single FK column guarantees structure; the CHECK guarantees an ACTIVE course has one assigned; the app guarantees the FK references an `INSTRUCTOR` role.
- Reassignment mutates the row: new `instructor_id`, refreshed `instructor_assigned_at`/`instructor_assigned_by_id`. Full assignment-history is not required by any locked rule.
- ARCHIVED preserves course/history; no deletion.

DB-enforced: status values; assignment-sanity CHECKs; ACTIVE-requires-instructor CHECK.
App-level: FK target must be `role = INSTRUCTOR`; ownership authorization for course management; status transitions.

### 3.4 `course_books`

Purpose: multiple PDFs per course (D-017); reading, extraction, AI generation reference one specific book.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| course_id | BIGINT UNSIGNED | no | — | FK → courses.id |
| uploaded_by_user_id | BIGINT UNSIGNED | no | — | FK → users.id (instructor/admin) |
| title | VARCHAR(255) | no | — | display title |
| original_name | VARCHAR(255) | no | — | uploaded file name |
| storage_path | VARCHAR(500) | no | — | **UQ**; one file = one row |
| mime_type | VARCHAR(100) | no | — | |
| file_size | BIGINT UNSIGNED | no | — | bytes |
| checksum_sha256 | CHAR(64) | yes | NULL | upload integrity/dedupe |
| page_count | INT UNSIGNED | yes | NULL | needed for AI page-range validation and reader |
| status | VARCHAR(16) | no | `'ACTIVE'` | CHECK `IN ('ACTIVE','ARCHIVED')` |
| archived_at | TIMESTAMP | yes | NULL | |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- `UQ (storage_path)`
- `INDEX (course_id, status)`
- FKs → courses.id, users.id: RESTRICT

Business semantics:
- Archive/replace: upload a new row and ARCHIVE the old one; never delete. History that references a book (AI requests) is preserved.
- `page_count` is captured at upload; AI page ranges are validated against it (app-level).

### 3.5 `enrollments`

Purpose: one canonical enrollment lifecycle per student/course pair (D-018); admin-managed in MVP.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| course_id | BIGINT UNSIGNED | no | — | FK → courses.id |
| student_id | BIGINT UNSIGNED | no | — | FK → users.id |
| status | VARCHAR(16) | no | `'ACTIVE'` | CHECK `IN ('ACTIVE','CANCELLED')` |
| enrolled_by_admin_id | BIGINT UNSIGNED | no | — | FK → users.id |
| enrolled_at | TIMESTAMP | no | — | |
| cancelled_by_admin_id | BIGINT UNSIGNED | yes | NULL | FK → users.id |
| cancelled_at | TIMESTAMP | yes | NULL | |
| cancellation_reason | TEXT | yes | NULL | |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- **`UQ (course_id, student_id)`** — exactly one logical enrollment row per pair (reactivation reuses this row)
- `INDEX (course_id, status)`, `INDEX (student_id, status)`
- FKs → courses.id, users.id (×2 admin): RESTRICT

Business semantics:
- Statuses only ACTIVE/CANCELLED in MVP. Reactivation = UPDATE the same row to ACTIVE (clear cancellation fields). No deletion.
- Account activation does **not** create enrollment (app).
- Admin alone creates/cancels/reactivates initially (D-018); instructors may view rosters only.

DB-enforced: pair uniqueness; status values.
App-level: `student_id` must reference `role = STUDENT`; admin-only mutation; instructor roster read-only.

### 3.6 `quizzes`

Purpose: once per course; configurable attempts; scheduled availability; server-controlled result release (D-019, D-020).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| course_id | BIGINT UNSIGNED | no | — | FK → courses.id |
| created_by_instructor_id | BIGINT UNSIGNED | no | — | FK → users.id |
| title | VARCHAR(255) | no | — | |
| instructions | TEXT | yes | NULL | |
| creation_method | VARCHAR(16) | no | `'MANUAL'` | CHECK `IN ('MANUAL','AI')` |
| status | VARCHAR(16) | no | `'DRAFT'` | CHECK `IN ('DRAFT','PUBLISHED','ARCHIVED')` |
| starts_at | TIMESTAMP | yes | NULL | required to PUBLISH |
| ends_at | TIMESTAMP | yes | NULL | required to PUBLISH |
| max_attempts | INT UNSIGNED | no | `1` | CHECK `max_attempts >= 1` |
| published_at | TIMESTAMP | yes | NULL | |
| archived_at | TIMESTAMP | yes | NULL | |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- `INDEX (course_id, status)`, `INDEX (status, starts_at, ends_at)`
- FKs → courses.id, users.id: RESTRICT
- CHECK `max_attempts >= 1`
- CHECK `(ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)`
- CHECK `(status <> 'PUBLISHED' OR (starts_at IS NOT NULL AND ends_at IS NOT NULL))`

Business semantics:
- DRAFT editable → PUBLISHED (requires schedule window and app checks: course ACTIVE, author is the course instructor) → ARCHIVED (immutable history).
- Editing published content after the first started attempt exists is **blocked at the app level** (see §5). Archive + create a new quiz instead. Content immutability is the documented, tested invariant that makes snapshot design safe.
- Results are hidden before `ends_at`; MVP release behavior is fixed to `AFTER_END` (D-020). No policy column is persisted. `MANUAL`/custom release is a future extension — it would add `result_release_policy` + `results_released_at` via migration only when a concrete flow exists.

DB-enforced: status/method/policy values; scheduling and attempt-count CHECKs.
App-level: publish authorization (course instructor + ACTIVE course); attempt-count enforcement; result-release visibility.

### 3.7 `questions`

Purpose: type-driven question bank within a quiz (D-028). No global single-choice assumption.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| quiz_id | BIGINT UNSIGNED | no | — | FK → quizzes.id |
| type | VARCHAR(16) | no | `'SINGLE_CHOICE'` | CHECK `IN ('SINGLE_CHOICE','MULTI_SELECT')` |
| text | TEXT | no | — | |
| points | DECIMAL(8,2) | no | `1.00` | CHECK `points > 0` |
| position | INT UNSIGNED | no | — | ordering within quiz |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- `UQ (quiz_id, position)`
- FK → quizzes.id: RESTRICT

Business semantics:
- `TRUE_FALSE` is authored as `SINGLE_CHOICE` with two options (True/False); no distinct persistence type.
- No essay/free-text type in MVP.
- Content of a PUBLISHED quiz is immutable once the first attempt starts (app-enforced; snapshots exist on `student_answers` as a backstop).

DB-enforced: type values; points positive; position uniqueness.
App-level (aggregate rules MySQL CHECK cannot express): `SINGLE_CHOICE` ⇒ exactly one correct option; `MULTI_SELECT` ⇒ at least one correct option; position contiguity; immutability after attempts.

### 3.8 `options`

Purpose: answer options per question; correctness flag drives both `SINGLE_CHOICE` and `MULTI_SELECT` grading.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| question_id | BIGINT UNSIGNED | no | — | FK → questions.id |
| text | TEXT | no | — | |
| is_correct | BOOLEAN | no | `false` | |
| position | INT UNSIGNED | no | — | ordering |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- `UQ (question_id, position)`
- FK → questions.id: RESTRICT

Business semantics: correct-set for scoring is read from `is_correct` at grading time (stable because content is immutable once attempts start). Options may not be deleted once referenced by any `student_answer_options` row (RESTRICT).

DB-enforced: position uniqueness.
App-level: correct-option cardinality per question type (§3.7); options belong to the same quiz via the question; no-deletion after references (RESTRICT backs this).

### 3.9 `quiz_attempts`

Purpose: independent, preserved attempts with deterministic numbering; provenance separated from lifecycle (D-029); submitted-attempt completeness and immutability (D-030). Best grade is the highest valid submitted score — never stored.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| quiz_id | BIGINT UNSIGNED | no | — | FK → quizzes.id |
| student_id | BIGINT UNSIGNED | no | — | FK → users.id |
| attempt_number | INT UNSIGNED | no | — | per student/quiz, starting at 1 |
| status | VARCHAR(16) | no | `'IN_PROGRESS'` | CHECK `IN ('IN_PROGRESS','SUBMITTED')` |
| submission_reason | VARCHAR(16) | yes | NULL | CHECK `IN ('MANUAL','TIME_EXPIRED')` or NULL; set only when SUBMITTED |
| started_at | TIMESTAMP | no | — | attempt start |
| submitted_at | TIMESTAMP | yes | NULL | when finalized |
| score | DECIMAL(8,2) | yes | NULL | set at grading; NULL while IN_PROGRESS |
| max_score_snapshot | DECIMAL(8,2) | no | — | Σ question.points at attempt start |
| graded_at | TIMESTAMP | yes | NULL | grading moment |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- **`UQ (quiz_id, student_id, attempt_number)`** — deterministic numbering + race backstop
- `INDEX (student_id, quiz_id, status)`, `INDEX (quiz_id, status)`
- FKs → quizzes.id, users.id: RESTRICT
- CHECK:
  - `status IN ('IN_PROGRESS','SUBMITTED')`
  - `submission_reason IS NULL OR submission_reason IN ('MANUAL','TIME_EXPIRED')`
  - `max_score_snapshot >= 0`
  - **Symmetric lifecycle invariant:** `(status = 'IN_PROGRESS' AND submitted_at IS NULL AND graded_at IS NULL AND score IS NULL AND submission_reason IS NULL) OR (status = 'SUBMITTED' AND submitted_at IS NOT NULL AND graded_at IS NOT NULL AND score IS NOT NULL AND submission_reason IS NOT NULL)`
  - `status = 'IN_PROGRESS' OR score BETWEEN 0 AND max_score_snapshot`

Business semantics:
- **Attempt numbering:** allocate as `MAX(attempt_number)+1` for the (quiz, student) inside a transaction; the UQ constraint makes a concurrent double-allocation fail with a duplicate key, which the app retries. This eliminates the numbering race.
- **Lifecycle vs provenance:** `status` says where the attempt is; `submission_reason` says how it ended.
- `SUBMITTED/MANUAL`: student submitted before the deadline.
- `SUBMITTED/TIME_EXPIRED`: system auto-submits at `ends_at` (or configured time limit) with whatever answers are saved; it is **scored normally** (blank ⇒ 0), **consumes an attempt**, and is **valid for highest-score**.
- Every started attempt consumes a slot toward `max_attempts`; a student may not have a concurrent `IN_PROGRESS` attempt for the same quiz.
- **Immutability:** a `SUBMITTED` row is never updated again. The DB CHECK enforces the symmetric lifecycle invariant — `IN_PROGRESS` rows carry no submission data and `SUBMITTED` rows are complete; **write-immutability is an application-level invariant** enforced by the attempt service (the database cannot restrict column writes without triggers) (D-030).
- **Best grade** = `MAX(score)` over rows with `status = 'SUBMITTED'`. There is no stored final grade.

DB-enforced: numbering uniqueness; status/provenance values; symmetric lifecycle invariant (IN_PROGRESS emptiness + SUBMITTED completeness); score bounds.
App-level: immutability of SUBMITTED rows; attempt-slot and `max_attempts` enforcement; no concurrent IN_PROGRESS; start authorization (enrollment, status, timing); transactional starting and grading.

### 3.10 `student_answers`

Purpose: one historical row per question per attempt (D-028), with scoring/text snapshots so history survives any later content change.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| quiz_attempt_id | BIGINT UNSIGNED | no | — | FK → quiz_attempts.id |
| question_id | BIGINT UNSIGNED | no | — | FK → questions.id |
| question_text_snapshot | TEXT | no | — | question.text at attempt start |
| question_type_snapshot | VARCHAR(16) | no | — | CHECK `IN ('SINGLE_CHOICE','MULTI_SELECT')` |
| max_points_snapshot | DECIMAL(8,2) | no | — | question.points at attempt start |
| points_awarded | DECIMAL(8,2) | no | `0.00` | CHECK `points_awarded BETWEEN 0 AND max_points_snapshot` |
| is_correct | BOOLEAN | yes | NULL | `true` = full points; `false` = answered/wrong; `NULL` = unanswered |
| answered_at | TIMESTAMP | yes | NULL | last answer save; NULL = unanswered |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- **`UQ (quiz_attempt_id, question_id)`** — one row per question per attempt
- `INDEX (question_id)`
- FKs → quiz_attempts.id, questions.id: RESTRICT

Business semantics:
- Rows are created for **every** published question when the attempt starts; snapshots (`question_text_snapshot`, `question_type_snapshot`, `max_points_snapshot`) are captured then (content is immutable thereafter).
- The selected set lives in `student_answer_options` (empty set ⇒ unanswered).
- Unanswered ⇒ `is_correct = NULL`, `points_awarded = 0`, `answered_at = NULL`.
- Answer saves during the attempt update `answered_at` and the selected-option set.
- Exact-match grading only:
  - `SINGLE_CHOICE`: full `max_points_snapshot` iff the selected set equals the single correct option; else `0`.
  - `MULTI_SELECT`: full points iff the selected set equals the correct set **exactly**; else `0`. (No partial credit in MVP; scored as `is_correct` true/false.)
- Historical reliability relies on content immutability + these snapshots. Per-option text snapshots are intentionally omitted (MVP decision; revisit if post-attempt content versioning is ever allowed).

DB-enforced: one answer row per question per attempt; type snapshot values; score bounds.
App-level: snapshot capture at attempt start; transactional grading at submit; immutability of a submitted attempt's answer rows.

### 3.11 `student_answer_options`

Purpose: normalized selected-option set per answer (D-028). Supports both `SINGLE_CHOICE` and `MULTI_SELECT` without redesign.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| student_answer_id | BIGINT UNSIGNED | no | — | FK → student_answers.id |
| option_id | BIGINT UNSIGNED | no | — | FK → options.id |

Keys / constraints:
- **`PRIMARY KEY (student_answer_id, option_id)`** (composite; implicitly no duplicate selections)
- `INDEX (option_id)` (FK lookup)
- FKs → student_answers.id, options.id: RESTRICT
- **No `created_at`/`updated_at`** — selection time is already `student_answers.answered_at`; no consumer requires timestamps on this pivot.

Business semantics:
- One row per selected option. Empty set = unanswered.
- Grading compares the selected set against the correct set (options with `is_correct = true`) at grading time; correct sets are stable because content is immutable once attempts start.

### 3.12 `ai_generation_requests`

Purpose: persistence/audit of every Laravel → Flask generation (D-021). Angular never calls Flask; Laravel persists this row before/while/after the call.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | no | auto | PK |
| course_book_id | BIGINT UNSIGNED | no | — | FK → course_books.id (one source book) |
| requested_by_instructor_id | BIGINT UNSIGNED | no | — | FK → users.id |
| quiz_id | BIGINT UNSIGNED | yes | NULL | FK → quizzes.id; the quiz created from an accepted draft (0..1) |
| start_page | INT UNSIGNED | no | — | CHECK `start_page >= 1` |
| end_page | INT UNSIGNED | no | — | CHECK `end_page >= start_page` |
| question_count | INT UNSIGNED | no | — | CHECK `question_count >= 1` |
| difficulty | VARCHAR(16) | no | `'medium'` | app-validated preference (no locked enum) |
| provider | VARCHAR(64) | no | — | Flask adapter name, e.g. `fake`, `openai` |
| model | VARCHAR(128) | yes | NULL | provider model where applicable |
| status | VARCHAR(16) | no | `'PENDING'` | CHECK `IN ('PENDING','PROCESSING','COMPLETED','FAILED')` |
| draft_payload | JSON | yes | NULL | validated quiz draft (questions carry their own `type`) |
| error_message | TEXT | yes | NULL | failure detail |
| started_at | TIMESTAMP | yes | NULL | |
| completed_at | TIMESTAMP | yes | NULL | |
| created_at / updated_at | TIMESTAMP | yes | NULL | |

Keys / constraints:
- `INDEX (course_book_id, status)`, `INDEX (requested_by_instructor_id, created_at)`
- FKs → course_books.id, users.id, quizzes.id: RESTRICT

Business semantics:
- Lifecycle `PENDING → PROCESSING → COMPLETED` or `FAILED`. Synchronous call per D-021; the queued `jobs` table would support async later without schema change.
- One request references one course book and one page range. `start_page..end_page` must be within `course_books.page_count` (**app-level**; the DB CHECK can only enforce internal consistency).
- `draft_payload` is the provider-independent validated draft. **Generated questions each carry their own `type`**; a request has no global question type (D-028).
- Instructor must review/edit the draft before publishing; when a quiz is created from the draft, `quiz_id` back-links it. Discarded drafts simply leave `quiz_id` NULL.
- No invented `CANCELLED` state, no per-request question-type field, no provider-specific columns beyond `provider`/`model`.

DB-enforced: page-range and count CHECKs; status values.
App-level: authorization (requesting instructor owns the course containing the book); page-range ≤ page_count; response schema validation; timeout/failure handling; draft-before-publish rule.

---

## 4. Grading model (summary)

- Points are per-question (`questions.points`); `quiz_attempts.max_score_snapshot = Σ questions.points` at attempt start.
- At submit (transactional): for each question, compare the selected set (`student_answer_options`) with the correct set (`options.is_correct = true` at grading time).
  - `SINGLE_CHOICE`: selected set == the single correct option ⇒ full points, else 0.
  - `MULTI_SELECT`: selected set == correct set exactly ⇒ full points, else 0; no partial credit.
  - Unanswered ⇒ 0 points, `is_correct = NULL`.
- Attempt `score` = Σ `points_awarded`; stored once, `graded_at` set; row becomes `SUBMITTED`.
- Best grade = `MAX(score)` over `status = 'SUBMITTED'` (includes `TIME_EXPIRED`). Never stored.

## 5. Content-immutability invariant (app-level, documented and tested)

Once a published quiz has its **first** started attempt (`quiz_attempts` row exists), its `questions`/`options` rows are read-only. The application refuses structural edits (create/update/delete of questions or options; point changes) thereafter; the archive-plus-new-quiz flow is the sanctioned way to change content. `student_answers` snapshots exist as a backstop, not as a substitute for this rule.

Rationale: it keeps the correct-set and selected-set structures stable without per-option text snapshots or a full versioning subsystem in the MVP (D-028/approved micro-decisions). If post-attempt content versioning is ever introduced, the snapshot/versioning design must be revisited.

## 6. Deferred / excluded

### `book_interactions` — DEFERRED to Phase 3 (D-027)

Legacy evidence (`$P/worktrees: Smart-Book-Legacy`): the legacy table is a coarse **per-student, per-course, per-day engagement bucket** (`type IN (view,click,download)`, `interacted_date`, unique per student/course/date) consumed only by report aggregations (year/month/day counts). The draft ERD's event-log design (OPEN/PAGE_VIEW/CLOSE, page numbers, per-book timestamps) would invent semantics with no locked MVP consumer. Re-design when the Phase 3 Angular reader defines actual interaction events consumed by a product/analytics feature.

### Excluded elsewhere
- `EXPIRED`/`ABANDONED`/`INVALIDATED` attempt statuses (folded into `SUBMITTED` + `submission_reason`; no admin invalidation requirement in MVP).
- Essay/free-text question types.
- Per-option text snapshots (see §5).
- Partial-credit multi-select scoring.
- Profile columns `phone`, `birth_date`, `avatar_path` (D-023; add by migration when a consumer exists). `course_instructors` pivot already prohibited (D-016).
- `final_grade` column (derived, never stored).

## 7. DB-enforced vs app-level invariants (matrix)

| Invariant | Level | Where |
|---|---|---|
| Email uniqueness (case-insensitive) | DB | `users.UQ(email)` + CI collation |
| Role/status/type/method/policy values | DB | CHECK constraints |
| One enrollment row per (course, student) | DB | `enrollments.UQ(course_id, student_id)` |
| Deterministic attempt numbers / no double allocation | DB + app | `quiz_attempts.UQ(...)` + transactional allocation with retry |
| Submitted-attempt lifecycle invariant | **DB** | `quiz_attempts` CHECK (IN_PROGRESS ⇒ submission fields NULL; SUBMITTED ⇒ all four NOT NULL) |
| Submitted-attempt immutability | **App** | attempt service; no DB write protection |
| Exactly one instructor per ACTIVE course / assignment consistency | DB | single FK column + row CHECKs |
| FK target role correctness (INSTRUCTOR, STUDENT) | App | policies (cross-table) |
| Correct-option cardinality (SC exactly 1, MS ≥ 1) | App | transactional question save (aggregate, not expressible in CHECK) |
| Question/option content immutability after attempts | App | content service; tested |
| max_attempts, no concurrent attempt, timing | App | attempt service (UQ backs numbering) |
| Result release before `ends_at` | App | server access rules |
| Page range ≤ book page_count | App | generation service |
| Best-grade derivation | App | query over `quiz_attempts` |

## 8. Timezone and display

All business datetimes (`starts_at`, `ends_at`, `started_at`, `submitted_at`, approval timestamps, etc.) are stored as UTC `TIMESTAMP` values. Frontend display converts to the user's local timezone. No DB-side local-time logic exists.