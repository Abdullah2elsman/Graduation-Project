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

**Decision:** Before `ends_at`, students receive submission confirmation only; scores, prior-attempt scores, correct answers, and detailed review are server-hidden. At/after `ends_at`, authorized results are available. Keep a configurable release-policy field for later extension.

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

## Open architectural decisions

None currently block Phase 1 coding. Deferred product choices must remain deferred until a concrete requirement justifies them.
