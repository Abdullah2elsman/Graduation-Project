# Smart Book V2 — Decisions

## Accepted

### D-001 — Preserve legacy and rebuild separately
**Decision:** Keep `legacy/original` immutable; build V2 on `rebuild/v2`.

### D-002 — Angular frontend
**Decision:** Rebuild the frontend in Angular. Do not perform a pixel-perfect migration. Preserve product behavior/identity while allowing better UX/UI.

### D-003 — Laravel backend
**Decision:** Keep Laravel but rebuild architecture, API contracts, validation, authorization, and broken business logic cleanly.

### D-004 — Unified users
**Decision:** Use one users model/table with a role instead of three authentication tables. Add profile tables only when role-specific data warrants them.

### D-005 — Authentication
**Decision:** Laravel Sanctum cookie/session SPA authentication with a canonical current-user endpoint (`/api/auth/me`).

### D-006 — Database
**Decision:** Rebuild clean MySQL 8.x migrations. Legacy schema/API names do not need compatibility.

### D-007 — AI boundary
**Decision:** Flask remains a separate AI service. Angular never calls it directly; Laravel authorizes and calls it internally.

### D-008 — Docker
**Decision:** Use Docker Compose from the first implementation phase for backend, frontend, MySQL, and AI service.

### D-009 — Delivery strategy
**Decision:** Small foundation first, then page-by-page vertical slices.

## Open decisions

### O-001 — Instructor cardinality
Can one course have one instructor only, or multiple instructors?
**Current schema proposal:** multiple instructors through `course_instructors`.

### O-002 — Course books
Can one course contain multiple PDF books?
**Current schema proposal:** yes, through `course_books`.

### O-003 — Quiz attempt policy
One attempt only, or configurable `max_attempts` per quiz?
**Current schema proposal:** configurable.

### O-004 — Result/review policy
When can a student see grade and correct answers: immediately, after quiz end, or manually released by instructor?

### O-005 — Enrollment permissions
Who manages enrollment in MVP?
**Recommendation:** Admin only first; optionally allow instructors later.

### O-006 — Public signup
Should users self-register?
**Recommendation:** No for MVP. Admin creates Student/Instructor accounts; add public signup only if product requirements demand it.
