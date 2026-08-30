# Smart Book V2 — Rebuild Context

## Goal
Rebuild the incomplete graduation project into a clean, reproducible learning platform while preserving the original repository as a legacy reference.

## Git safety
- Original reference commit: `fbfcdda`
- Legacy branch: `legacy/original`
- Immutable tag: `legacy-original-2026-08-31`
- Active rebuild branch: `rebuild/v2`

## Locked direction
- Frontend: Angular, rebuilt rather than pixel-perfect migration.
- Backend: Laravel, clean architecture/business logic/API rebuild.
- Auth: Laravel Sanctum cookie/session SPA auth.
- Users: one `users` table with a role; profile data separated only when useful.
- Database: clean MySQL 8.x schema and migrations.
- AI: separate Flask service; Laravel is the only public boundary to it.
- Docker: from day one for Laravel + Angular + MySQL + Flask.
- Delivery style: foundation first, then page-by-page vertical slices.

## Legacy usage rule
Do not modify `legacy/original`. Use it only to recover product intent, business rules, UI ideas, and useful algorithms. Do not copy legacy bugs blindly.

## Core product flow
Admin manages users/courses/enrollment → Instructor uploads course PDF and creates manual or AI-assisted quizzes → Student reads enrolled course material and takes quizzes → Laravel grades attempts → Instructor/Admin view results and analytics.
