# Smart Book V2 Roadmap

## Phase 0 — Safety & Continuity
- [x] Preserve legacy branch and immutable tag.
- [x] Create `rebuild/v2`.
- [x] Establish rebuild documentation pack.
- [ ] Commit documentation pack to `rebuild/v2`.
- [ ] Finalize high-impact domain decisions.

## Phase 1 — Foundation
- [ ] Docker Compose skeleton: backend, frontend, mysql, ai.
- [ ] Clean Laravel application foundation.
- [ ] Clean Angular application foundation.
- [ ] Canonical MySQL schema and migrations.
- [ ] Deterministic seed data.
- [ ] Unified users/roles.
- [ ] Sanctum SPA authentication.
- [ ] `/api/auth/me`.
- [ ] Foundation auth/authorization tests.
- [ ] Fresh clone can start through Docker.

## Phase 2 — Admin
- [ ] Authenticated shell / Dashboard.
- [ ] Instructors CRUD.
- [ ] Students CRUD.
- [ ] Courses CRUD.
- [ ] Instructor assignment.
- [ ] Enrollment management.
- [ ] Course details.

## Phase 3 — Instructor
- [ ] Assigned courses.
- [ ] PDF upload/replacement/deletion.
- [ ] PDF reader.
- [ ] Manual quiz lifecycle.
- [ ] Attempts/grades.
- [ ] Analytics.

## Phase 4 — Student
- [ ] Enrolled courses.
- [ ] PDF reader.
- [ ] Quiz availability/start/take/submit.
- [ ] Server-side grading.
- [ ] Results/history.

## Phase 5 — AI
- [ ] Flask service + health endpoint.
- [ ] Provider adapter + fake provider.
- [ ] Selected PDF pages → text → AI draft.
- [ ] Laravel AI client and schema validation.
- [ ] Instructor review/edit before persistence.

## Phase 6 — Analytics & Hardening
- [ ] Trustworthy reports.
- [ ] E2E tests.
- [ ] Security/upload limits/rate limits.
- [ ] Reproducible release documentation.
