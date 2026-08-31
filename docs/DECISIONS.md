# Smart Book V2 — Locked Decisions

All decisions below are accepted and are the implementation source of truth. Superseding one requires an explicit new decision and corresponding documentation/ERD update.

## Repository and delivery

### D-001 — Preserve legacy and rebuild separately

**Decision:** Keep `legacy/original` immutable, retain tag `legacy-original-2026-08-31`, and build V2 on `rebuild/v2`.

**Rationale:** The original repository remains useful evidence without constraining or risking the clean rebuild.

### D-002 — Vertical-slice delivery

**Decision:** Build foundation first, then complete page-sized vertical slices through schema, backend, API, tests, Angular states, and smoke testing.

**Rationale:** A rendered screen without working business rules and integration is not a completed product feature.

### D-003 — Admin implementation order

**Decision:** After foundation: Admin auth/shell, Dashboard, Pending Student Approval, Instructor Management, Student Management, Course Management, Instructor Assignment, Enrollment Management, Course Details, then Reports after grading data is trustworthy.

**Rationale:** The order establishes accounts and academic structure before dependent reporting.

## Applications and runtime

### D-004 — Angular frontend

**Decision:** Build an accessible, responsive Angular SPA. Legacy Vanilla JavaScript pages are workflow references, not a pixel-perfect migration target.

**Rationale:** V2 may improve UX and avoids carrying forward brittle legacy browser code.

### D-005 — Laravel backend

**Decision:** Keep Laravel, but rebuild validation, authorization, transactions, services/actions, tests, and API contracts where necessary. Legacy API compatibility is not required.

**Rationale:** The legacy implementation is inconsistent and cannot safely define the V2 contract.

### D-006 — Flask AI service boundary

**Decision:** Flask remains a separate internal service. Communication is `Angular -> Laravel -> Flask`; Angular never calls Flask directly.

**Rationale:** Laravel remains the security, ownership, validation, extraction, persistence, and public API boundary.

### D-007 — Docker from the beginning

**Decision:** Initial Compose services are `backend`, `frontend`, `db`, `ai`, and `mailpit`, with documented ports, environment variables, volumes, and health checks.

**Rationale:** Onboarding must not depend on developer-machine PHP, Node, Python, or MySQL versions.

### D-008 — Development email through Mailpit

**Decision:** Laravel development SMTP routes to Mailpit. Production email-provider choice is deferred.

**Rationale:** Signed email verification must be testable locally without selecting production infrastructure prematurely.

## Authentication, users, and lifecycle

### D-009 — Unified users and fixed roles

**Decision:** Use one `users` table with roles `ADMIN`, `INSTRUCTOR`, and `STUDENT`. Do not use separate authentication tables. Add profile tables only for accepted, genuinely role-specific data.

**Rationale:** One identity model simplifies Sanctum sessions, policies, auditing, and cross-role administration.

### D-010 — Email-only authentication

**Decision:** Email is the only login identifier; `users.email` is unique and normalized consistently, preferably lowercase. Do not introduce username login.

**Rationale:** This is the finalized product contract and avoids ambiguous identity lookup.

### D-011 — Sanctum SPA sessions and current user

**Decision:** Use Laravel Sanctum cookie/session authentication and canonical `GET /api/auth/me`.

**Rationale:** It provides a first-party SPA authentication model without exposing tokens to Angular storage.

### D-012 — Student-only public signup

**Decision:** Students may self-register. Instructors cannot self-register and are created by Admin. New self-registered accounts are `STUDENT/PENDING`.

**Rationale:** Student onboarding remains public while privileged instructor provisioning stays administrative.

### D-013 — Signed email verification before approval

**Decision:** Use Laravel signed email verification. Verification sets `email_verified_at` but leaves the account `PENDING` until Admin approval.

**Rationale:** Email ownership, account status, and course enrollment are distinct concerns; a custom OTP system is unnecessary.

### D-014 — Account states and restricted pending access

**Decision:** Account states are `PENDING`, `ACTIVE`, `SUSPENDED`, and `REJECTED`. Pending users may authenticate only to restricted auth/session endpoints; normal APIs require the appropriate verified/active state.

**Rationale:** The UI must distinguish verification from approval while the server enforces access, not merely hides pages.

### D-015 — Preserve identity and academic history

**Decision:** Rejected emails remain reserved, and users with academic history are not destructively deleted. Suspension/rejection and archive behavior must preserve attempts, grades, reports, and relationships.

**Rationale:** Deletion would permit rejection bypass and corrupt historical reporting.

## Academic model

### D-016 — One instructor per course

**Decision:** Each course has exactly one direct `instructor_id`; there is no `course_instructors` many-to-many table. Admin may reassign the instructor.

**Rationale:** This is the actual V2 ownership rule and keeps authorization straightforward.

### D-017 — Multiple books per course

**Decision:** Store multiple PDFs through `course_books`. Reading, extraction, interaction tracking, and AI generation reference a specific book.

**Rationale:** Course-level file fields cannot represent multiple books or reliable source attribution.

### D-018 — Admin-managed enrollment

**Decision:** Admin alone creates, cancels, or reactivates enrollment initially. Instructors may view assigned-course rosters. Activation does not enroll a student. Enrollment states include `ACTIVE` and `CANCELLED`.

**Rationale:** Account admission and academic placement are separate administrative workflows.

### D-019 — Configurable quiz attempts and best grade

**Decision:** Each quiz defines `max_attempts`. Preserve every attempt with its number, lifecycle, timestamps, score, and history. Final grade is the highest score among valid submitted attempts.

**Rationale:** A single overwritten grade cannot support configurable attempts or reliable audit/history.

### D-020 — Results released after quiz end

**Decision:** Before `ends_at`, students receive submission confirmation only; scores, prior-attempt scores, correct answers, and detailed review are server-hidden. At/after `ends_at`, authorized results are available. The MVP persists **no release-policy column**: release behavior is fixed to `AFTER_END`. A `MANUAL`/custom release is a future extension that adds `result_release_policy` + `results_released_at` by migration only when a concrete flow requires it.

**Rationale:** Server enforcement prevents early answer disclosure and supports fair multiple attempts.

### D-021 — AI creates a reviewed draft from a specific book range

**Decision:** Laravel extracts selected pages from one `course_book`, calls Flask, validates the returned draft, and records generation state. Instructor review/edit is mandatory before publishing. Flask providers sit behind an adapter supporting hosted, local, and fake implementations.

**Rationale:** This preserves human control, traceable source selection, provider portability, and testability.

## Persistence

### D-022 — Canonical MySQL 8 schema

**Decision:** Target MySQL 8.x and create new normalized migrations with deliberate foreign keys, indexes, unique constraints, lifecycle fields, and timestamps. Legacy migration chronology and naming are discarded.

**Rationale:** The legacy schema cannot be recreated reliably and should not constrain V2.

### D-023 — Minimal profile schema

**Decision:** Keep the limited common profile fields needed initially on `users`. Do not create speculative role-profile tables.

**Rationale:** No accepted V2 requirement currently defines role-specific profile attributes that justify extra entities.

## Legacy/V2 development isolation

### D-024 — Separate worktrees and side-by-side comparison

**Decision:** V2 lives at `~/Projects/Smart-Book` on `rebuild/v2`; the preserved application lives at `~/Projects/Smart-Book-Legacy` on `legacy/original`. The Legacy worktree is never modified. Both applications must be runnable concurrently so equivalent pages can be opened side by side during each applicable vertical slice.

**Rationale:** Direct comparison preserves useful historical behavior and visual context while maintaining a safe, immutable reference.

### D-025 — Runtime independence and database isolation

**Decision:** V2 may study Legacy screens and logic but must not depend on the Legacy worktree or runtime. Legacy and V2 never share an application database, schema, data directory, or Docker volume.

**Rationale:** Runtime and data isolation prevent accidental legacy mutation, cross-version data corruption, and a hidden deployment dependency.

### D-026 — Non-conflicting development ports

**Decision:** Preserve Legacy host ports `5501` (static frontend) and `8005` (Laravel). Use V2 host ports `4200` (Angular), `8080` (Laravel API), `5001` (Flask AI), `3307 -> 3306` (MySQL), and `8025` (Mailpit UI). Compose services communicate through service names and container ports.

**Rationale:** A stable, explicit allocation lets both applications run simultaneously and avoids confusing host/container addressing.

### D-027 — Defer book interactions to Phase 3

**Decision:** Do not create a `book_interactions` table in Phase 1B. The documented Legacy semantics are a coarse per-student, per-course, per-day engagement bucket (`type` in view/click/download, unique per student/course/date) consumed only by report aggregations. The draft ERD's event-log shape (per book/page) would invent semantics no locked MVP requirement consumes. Redesign when the Phase 3 Angular reader defines actual interaction events used by a product or analytics feature.

**Rationale:** Avoids speculative persistence and keeps the Phase 1B contract limited to behavior actually documented or required.

### D-028 — Type-driven questions and normalized selections

**Decision:** `questions.type` supports `SINGLE_CHOICE` and `MULTI_SELECT`. TRUE/FALSE is authored as `SINGLE_CHOICE` with True/False options. No free-text/essay type until a requirement justifies it. Student selections are stored as a normalized set in `student_answer_options` (composite PK `student_answer_id` + `option_id`); `student_answers` keeps one row per question per attempt plus snapshots (`question_text_snapshot`, `question_type_snapshot`, `max_points_snapshot`, `points_awarded`, `is_correct`, `answered_at`). Grading is exact-set match only (no partial credit); correct-option cardinality (exactly one for SINGLE_CHOICE, at least one for MULTI_SELECT) is enforced transactionally at the application layer.

**Rationale:** Multi-select cannot be represented by a single `selected_option_id`; type-driven design avoids a later restructuring and keeps existing/question grading deterministic and auditable.

### D-029 — Attempt lifecycle separated from submission provenance

**Decision:** `quiz_attempts.status` is `IN_PROGRESS` or `SUBMITTED`. `submission_reason` is `MANUAL` or `TIME_EXPIRED` and is set only when an attempt becomes `SUBMITTED`. A `TIME_EXPIRED` attempt is system-submitted at the deadline, scored normally, consumes an attempt, is immutable, and is valid for highest-score calculation. EXPIRED/ABANDONED/INVALIDATED terminal statuses are not introduced in the MVP (no admin-invalidation requirement). Best grade is `MAX(score)` over `SUBMITTED` attempts and is never stored.

**Rationale:** Lifecycle and provenance are distinct concerns; reducing statuses to two states with a provenance field keeps the grading rule simple while preserving how each submission ended.

### D-030 — Submitted-attempt completeness and immutability

**Decision:** A database CHECK enforces the symmetric lifecycle invariant: an `IN_PROGRESS` attempt has `submitted_at`, `graded_at`, `score`, and `submission_reason` all NULL; a `SUBMITTED` attempt has all four NOT NULL (with `score` within `0..max_score_snapshot`). Changing an attempt after submission (immutability) is an application-level invariant enforced by the attempt service and covered by tests; the database does not use triggers to write-protect rows.

**Rationale:** CHECK constraints guarantee integrity at rest; immutability is a behavioral rule best owned and tested by the application layer.

### D-031 — MySQL 8.0 CHECK/FK interplay exception (confirmed Phase 1B.2)

**Decision:** MySQL 8.0 rejects a CHECK constraint that references a column whose foreign key declares a referential action other than `RESTRICT`/`NO ACTION` (error 3823 — verified empirically in the dev container: `ON UPDATE CASCADE` fails, `ON DELETE RESTRICT ON UPDATE RESTRICT` succeeds). The CHECKs `courses_assignment_consistency_check` and `courses_requires_instructor_check` both reference `courses.instructor_id`, so that single FK deviates from the blanket domain rule and is declared **ON DELETE RESTRICT / ON UPDATE RESTRICT** (`restrictOnDelete()->restrictOnUpdate()`) instead of ON UPDATE CASCADE. All other domain FKs keep RESTRICT/CASCADE. This is semantically inert because surrogate PKs are never updated.

**Rationale:** Keeping the two contract-mandated courses constraints is more valuable than a uniform referential-action rule that can never fire; the deviation is localized and documented rather than silently dropping constraints.

## Open architectural decisions

None currently block Phase 1 coding. Deferred product choices must remain deferred until a concrete requirement justifies them.
