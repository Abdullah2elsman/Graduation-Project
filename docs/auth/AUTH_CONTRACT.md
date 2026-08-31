# Smart Book V2 — Authentication Contract

**Status:** LOCKED for Phase 1C implementation

**Frozen:** 2026-08-31

**Applies to:** the V2 Laravel API and first-party Angular SPA only

This is the canonical product and technical contract for Smart Book V2 authentication. It supersedes shorter authentication summaries elsewhere in `docs/`; those files should link here rather than restate the full rules. Legacy authentication is historical evidence only and is not a V2 contract.

The labels used below are deliberate:

- **LOCKED / VERIFIED:** approved product behavior or verified repository state.
- **TECHNICAL RECOMMENDATION:** implementation direction that does not change product behavior.
- **DEFERRED:** explicitly outside the MVP authentication scope.
- **UNKNOWN:** unresolved business behavior. There are no remaining UNKNOWN authentication decisions at the Phase 1C.1 exit.

---

## 1. Verified implementation baseline

These facts describe the repository at the end of Phase 1C.1; they are not claims that authentication is already implemented.

- **VERIFIED:** Laravel Framework `13.29.0`; `backend/composer.json` requires PHP `^8.3`.
- **VERIFIED:** Laravel Sanctum `v4.3.3` is installed; the application-owned `config/sanctum.php` defines only the stateful-domain and `web`-guard settings needed by this SPA.
- **VERIFIED:** `routes/api.php` is registered under `/api`; it currently exposes only `GET /api/health`. No authentication business endpoint exists yet.
- **VERIFIED:** `config/cors.php` allows credentialed requests only for explicitly configured origins and never uses a wildcard origin.
- **VERIFIED:** the scaffold currently uses Laravel's `web` session guard and one `users` provider.
- **VERIFIED:** `SESSION_DRIVER=database`; the stock `sessions` table exists.
- **VERIFIED:** the stock `password_reset_tokens` table and password broker configuration exist. The current broker defaults are a 60-minute token expiry and 60-second reissue throttle.
- **VERIFIED:** development mail is SMTP to Mailpit at `mailpit:1025`; its host UI is `http://localhost:8025`.
- **VERIFIED:** `App\Models\User` is still close to the Laravel scaffold and does not yet implement `MustVerifyEmail`.
- **VERIFIED:** the canonical `users` migration contains role, account status, `email_verified_at`, approval/status-transition provenance, creator provenance, and `last_login_at` fields.
- **VERIFIED:** Angular 22 centrally provides `HttpClient`, credentials, and its standard `XSRF-TOKEN` → `X-XSRF-TOKEN` behavior. The dev proxy forwards relative `/api` and `/sanctum` requests to the Docker `backend:8080` service.
- **VERIFIED:** Phase 1C.2 foundation tests cover API/JSON routing, CSRF cookies, stateful middleware, session/CORS configuration, an unauthenticated Sanctum boundary, absence of a token endpoint, and Angular credential/XSRF behavior. Login and other auth-feature tests have not started.
- **VERIFIED:** no `personal_access_tokens` migration, `HasApiTokens` trait, or token-issuing endpoint was added; these are unnecessary for the locked first-party session flow.
- **VERIFIED:** Legacy used separate role models/guards and mixed session/bearer-token behavior. V2 must not copy or depend on that architecture.

---

## 2. Identity and role contract

- **LOCKED:** one `users` table serves all authentication.
- **LOCKED:** legal roles are `ADMIN`, `INSTRUCTOR`, and `STUDENT`.
- **LOCKED:** email is the only login identifier. There is no username login.
- **LOCKED:** email is unique and is normalized consistently by trimming and lowercasing before lookup and persistence.
- **LOCKED:** separate role-specific profile tables are introduced only for genuinely role-specific information, not for authentication.
- **LOCKED:** account status and email verification are separate concerns. Enrollment is separate from both.
- **LOCKED:** normal application access requires an authenticated, email-verified, `ACTIVE` account, followed by role and resource authorization.
- **LOCKED:** Angular guards are navigation/UX aids only. Laravel is the security boundary.

### Password policy

- **LOCKED:** at least 8 characters.
- **LOCKED:** at least one letter.
- **LOCKED:** at least one number.
- **LOCKED:** uppercase, lowercase, and symbol requirements are not added unless a later approved requirement changes this contract.

---

## 3. First-party SPA authentication

- **LOCKED:** the first-party Angular SPA uses Laravel Sanctum cookie/session authentication.
- **LOCKED:** the first-party SPA does not use bearer tokens or personal access tokens.
- **LOCKED:** the canonical authenticated-user endpoint is `GET /api/auth/me`.
- **LOCKED:** browser mutations use CSRF protection.
- **LOCKED:** database-backed Laravel sessions remain the session store.

### Development origin contract

The browser opens Angular at `http://localhost:4200`; Laravel is exposed at `http://localhost:8080`.

- **VERIFIED:** the Angular development proxy sends relative browser requests under `/api` and `/sanctum` from `localhost:4200` to `backend:8080` over Compose DNS. This gives the browser a same-origin development surface and keeps the backend target internal.
- **VERIFIED:** Angular `HttpClient`, credentials, API base URL, and XSRF names are configured centrally; feature components do not configure them independently.
- **VERIFIED:** Sanctum stateful domains and credentialed CORS are also explicit. `localhost:4200` is the only default allowed CORS origin; wildcard credentialed origins are forbidden. Direct-backend diagnostics remain possible from that configured origin.
- **TECHNICAL RECOMMENDATION:** keep development cookies HttpOnly and SameSite=Lax. Production must use HTTPS/secure-cookie settings appropriate to its eventual deployment domains.

---

## 4. Canonical account state machine

Account statuses are `PENDING`, `ACTIVE`, `SUSPENDED`, and `REJECTED`. Verification is represented only by `email_verified_at`.

| State | Can establish a session? | `/api/auth/me` | Logout | Resend verification | Normal application APIs | Angular state |
|---|---:|---:|---:|---:|---:|---|
| Guest | No authenticated session | No | No | No | No | Login/register/recovery |
| `PENDING` + unverified + password established | Yes | Yes | Yes | Yes | No | Verify your email |
| `PENDING` + verified | Yes | Yes | Yes | No | No | Waiting for administrator approval |
| `ACTIVE` + verified | Yes | Yes | Yes | No | Yes, subject to role/policy | Role-appropriate application shell |
| `SUSPENDED` | Yes | Yes | Yes | No | No | Suspended restricted experience |
| `REJECTED` | Yes | Yes | Yes | No | No | Generic rejected-account experience |

Additional invariants:

- **LOCKED:** a correct password is not rejected solely because the account is `PENDING`, `SUSPENDED`, or `REJECTED`; these states receive restricted authenticated sessions.
- **LOCKED:** `/api/auth/me` returns enough safe state for Angular to choose the correct experience. Internal rejection reasons are never included.
- **LOCKED:** restricted accounts cannot reach normal course/application APIs.
- **LOCKED:** an `ACTIVE` but unverified account is an integrity anomaly and must not receive normal API access. Approved creation and transition flows must not produce it.
- **LOCKED:** an invited Instructor who has not accepted has no established password and therefore cannot use login or password reset; invitation acceptance is their onboarding path.
- **LOCKED:** users with academic history are not destructively deleted merely to represent account lifecycle changes.

### Permitted transitions

```text
Student registration
  -> PENDING + unverified
  -> signed email verification
  -> PENDING + verified
  -> Admin approval
  -> ACTIVE + verified

Instructor creation by Admin
  -> PENDING + unverified + no established password
  -> invitation acceptance (set password + verify email)
  -> ACTIVE + verified

ACTIVE -> SUSPENDED                  Admin action
SUSPENDED -> ACTIVE                  Admin-only reactivation
PENDING -> REJECTED                  Admin action
REJECTED -> PENDING + unverified     Admin-only reversal
```

- **LOCKED:** `REJECTED -> ACTIVE` is forbidden.
- **LOCKED:** returning a rejected account to `PENDING` restarts the normal verification/approval lifecycle. Verification and prior approval metadata are cleared; historical status-transition metadata is preserved.
- **LOCKED:** `SUSPENDED -> ACTIVE` preserves email verification, records transition metadata, invalidates all existing sessions, and requires a fresh login.

---

## 5. Student registration and approval

- **LOCKED:** only Students may register publicly.
- **LOCKED:** the server assigns `role=STUDENT`, `status=PENDING`, and `email_verified_at=null`; clients cannot select role or status.
- **LOCKED:** successful registration immediately creates a restricted authenticated session and dispatches the verification email.
- **LOCKED:** verification sets `email_verified_at` but leaves the Student `PENDING`.
- **LOCKED:** normal approval requires a `PENDING`, verified Student and changes status to `ACTIVE` with approval/status-transition provenance.
- **LOCKED:** activation never creates course enrollment.
- **LOCKED:** rejection requires a non-empty internal Admin reason and records transition provenance.
- **LOCKED:** the rejected user sees only the generic `REJECTED` state, not the detailed internal reason.
- **LOCKED:** a rejected email remains reserved; re-registration cannot bypass rejection.

---

## 6. Email verification

- **LOCKED:** use Laravel signed email-verification links, not OTP.
- **LOCKED:** a valid authenticated session is required in addition to a valid signed verification link.
- **LOCKED:** when the verification link is opened without a valid session, the user must authenticate and then resume the verification request.
- **LOCKED:** resend is available only to authenticated `PENDING` + unverified accounts and is throttled.
- **LOCKED:** Mailpit is the development email sink. The production email provider remains deferred.
- **TECHNICAL RECOMMENDATION:** preserve the signed verification target through the login redirect without exposing or logging sensitive query data.

---

## 7. Instructor invitation lifecycle

- **LOCKED:** Instructors cannot self-register. An Admin initiates the account and invitation.
- **LOCKED:** the unaccepted Instructor remains `PENDING`, unverified, and without an established password.
- **LOCKED:** invitation acceptance atomically sets the password, marks the Instructor email verified, and activates the account. No second Admin approval is required.
- **LOCKED:** an invitation expires after 7 days.
- **LOCKED:** reissuing an invitation atomically revokes every previous unused invitation for that Instructor and issues one new invitation.
- **LOCKED:** expiry or non-use leaves the Instructor `PENDING`; it never automatically rejects or deletes the account.
- **LOCKED:** Admin recovery before acceptance is invitation reissue only. Admin-assigned temporary passwords are forbidden.
- **LOCKED:** an unaccepted Instructor cannot use forgot-password to bypass invitation onboarding.
- **TECHNICAL RECOMMENDATION:** persist invitation records separately with a hashed random token, `expires_at`, and accepted/revoked timestamps. Store an unguessable unusable password hash on the required non-null `users.password` column until acceptance. The exact migration is Phase 1C implementation work and is not created in Phase 1C.1.
- **TECHNICAL RECOMMENDATION:** after acceptance, require a normal login rather than silently establishing a session from an emailed bearer secret.

---

## 8. Password recovery

- **LOCKED:** forgot/reset password is required for the Phase 1C/MVP authentication scope.
- **LOCKED:** recovery uses an emailed reset link and the existing password-reset infrastructure; no OTP.
- **LOCKED:** recovery is available to any account in any status that has previously established a password.
- **LOCKED:** resetting the password does not change role, status, verification, approval, suspension, or rejection state.
- **LOCKED:** successful reset invalidates existing sessions and does not automatically log the user in.
- **LOCKED:** an unaccepted Instructor is ineligible because they have not established a password.
- **LOCKED:** public forgot-password responses are enumeration-safe.

---

## 9. First production Admin

- **LOCKED:** the first real production Admin is provisioned with `php artisan app:create-admin`.
- **LOCKED:** the command creates the Admin as `ACTIVE` and email-verified.
- **LOCKED:** production Admin credentials are never hardcoded in seeders or environment variables.
- **TECHNICAL RECOMMENDATION:** use interactive email/name input and a hidden confirmed password prompt, apply the canonical normalization/password rules, fail safely on an existing email, and avoid accepting a plaintext password as a command-line option.
- **VERIFIED:** deterministic development seed credentials currently exist for local fixtures. They are development-only and are not the production bootstrap mechanism.

---

## 10. MVP HTTP endpoint contract

Response bodies use a consistent JSON envelope/error format selected during implementation. The shapes below name the required semantic fields without freezing incidental Laravel serialization.

### Public/session endpoints

| Endpoint | Authentication/state | Request | Success | Relevant errors and throttling |
|---|---|---|---|---|
| `GET /sanctum/csrf-cookie` | Guest or authenticated | none | `204`, CSRF cookie issued | Standard origin/CORS rejection |
| `POST /api/auth/login` | Guest; established password required | `email`, `password` | `200`, safe current-user/auth-state payload; session regenerated | Generic `401`; validation `422`; throttle by normalized email + IP |
| `POST /api/auth/logout` | Any authenticated status | none | `204`; current session invalidated and CSRF token regenerated | `401` without a session |
| `GET /api/auth/me` | Any authenticated status | none | `200`, safe identity, role, status, verification and effective-access state | `401` without a session |
| `POST /api/auth/register` | Guest | `name`, `email`, `password`, `password_confirmation` | `201`, `STUDENT/PENDING` user state, restricted session established, verification dispatched | `422` duplicate/reserved email or validation; registration throttle |
| `POST /api/auth/email/verification-notification` | Authenticated `PENDING` + unverified | none | `202`, generic dispatch acknowledgement | `401`, state `403/409`, throttled `429` |
| `GET /api/auth/email/verify/{id}/{hash}` | Authenticated matching user + valid signed URL | signed route parameters/query | Marks verified, remains `PENDING`; redirects to the configured Angular verification-success route | `401` must login/resume; invalid/expired signature `403`; id mismatch `403`; throttle |
| `POST /api/auth/forgot-password` | Public | `email` | Always generic `202` | Validation `422`; broker/IP throttle `429`; ineligible/nonexistent email is not disclosed |
| `POST /api/auth/reset-password` | Public, valid token, established password | `email`, `token`, `password`, `password_confirmation` | `204`; password changed, sessions invalidated, lifecycle unchanged | Generic invalid/expired token response; validation `422`; throttle |

### Admin lifecycle endpoints

| Endpoint | Authentication/state | Request | Success | Relevant errors |
|---|---|---|---|---|
| `POST /api/admin/students/{student}/approve` | `ACTIVE`, verified `ADMIN`; target `STUDENT/PENDING` + verified | no business fields | `200`, target becomes `ACTIVE` with transition metadata | `403`, `404`, invalid transition `409/422` |
| `POST /api/admin/students/{student}/reject` | `ACTIVE`, verified `ADMIN`; target `STUDENT/PENDING` | `reason` | `200`, target becomes `REJECTED`; reason remains internal | `403`, `404`, validation `422`, invalid transition `409` |
| `POST /api/admin/students/{student}/restore-to-pending` | `ACTIVE`, verified `ADMIN`; target `STUDENT/REJECTED` | no business fields | `200`, target becomes unverified `PENDING`; normal lifecycle restarts | `403`, `404`, invalid transition `409` |
| `POST /api/admin/users/{user}/reactivate` | `ACTIVE`, verified `ADMIN`; target `SUSPENDED` | no business fields | `200`, target becomes `ACTIVE`, verification preserved, all target sessions invalidated | `403`, `404`, invalid transition `409` |

The route nouns may be adjusted consistently during implementation, but the transition preconditions and outcomes are locked.

### Instructor invitation endpoints

| Endpoint | Authentication/state | Request | Success | Relevant errors and throttling |
|---|---|---|---|---|
| `POST /api/admin/instructors` | `ACTIVE`, verified `ADMIN` | Instructor identity fields including `name`, `email` | `201`, `INSTRUCTOR/PENDING` created and 7-day invitation dispatched | `403`; validation/duplicate email `422`; transaction failure |
| `POST /api/admin/instructors/{instructor}/invitation` | `ACTIVE`, verified `ADMIN`; target unaccepted `INSTRUCTOR/PENDING` | none | `202`, old unused invitations revoked and new invitation dispatched atomically | `403`, `404`, invalid state `409`, throttle |
| `GET /api/auth/instructor-invitations/{token}` | Public token validation | token in path | Minimal non-sensitive validity/expiry state | Invalid/expired/revoked token response; throttle |
| `POST /api/auth/instructor-invitations/{token}/accept` | Valid unused invitation | `password`, `password_confirmation` | `204`; password established, email verified, account `ACTIVE`, invitation consumed | Invalid/expired/revoked token; validation `422`; throttle |

Invitation validation responses must not expose unrelated account information. Acceptance must be transactional and single-use.

### Non-HTTP bootstrap

`php artisan app:create-admin` is the only production first-Admin bootstrap contract. It is not exposed as an HTTP endpoint.

---

## 11. Application-level invariants and authorization layering

MySQL constrains legal role/status values and relational integrity, but it cannot enforce the complete business transition graph or request authorization. Laravel must centrally enforce:

- canonical email normalization before uniqueness checks, lookup, and persistence;
- the password rule and confirmed-password inputs;
- allowed status transitions and their role/state preconditions;
- approval, rejection, restoration, suspension/reactivation, and invitation metadata;
- account verification/active gates for normal APIs;
- role and resource ownership/enrollment policies after the account gate;
- restricted endpoint exceptions (`me`, logout, and state-appropriate verification actions);
- invitation expiry, revocation, single use, and reset ineligibility before acceptance;
- session invalidation required by reset/reactivation;
- non-disclosure of the internal rejection reason.

**TECHNICAL RECOMMENDATION:** layer authorization conceptually as:

```text
auth:sanctum
  -> verified + ACTIVE application-access middleware
  -> role middleware/policy
  -> resource policy
```

Restricted auth/session routes use `auth:sanctum` but intentionally do not use the normal application-access gate. Put lifecycle transitions in transactional actions/services rather than duplicating them across controllers.

---

## 12. Security contract

- Hash passwords only through Laravel's configured `Hash` service; never store or log plaintext credentials.
- Regenerate the session identifier after successful login or registration session creation.
- On logout, invalidate the current session and regenerate the CSRF token.
- Enforce CSRF for cookie-authenticated state changes.
- Throttle login by normalized email and IP.
- Throttle registration, verification resend, signed verification callbacks, forgot-password, reset, invitation validation/acceptance, and Admin invitation reissue appropriately.
- Keep forgot-password responses enumeration-safe; use a generic login failure response.
- Store reset and invitation tokens hashed, expire them, consume them once, and never log them.
- Invalidate all sessions after password reset and Admin reactivation.
- Treat authorization and account-state checks as server-side requirements; never rely on Angular visibility.
- Keep development fixture credentials out of production bootstrap and production data.

---

## 13. Phase 1C implementation slices

Implement and review in this dependency order:

1. **Phase 1C.2 — Sanctum/API/CSRF/CORS foundation:** install Sanctum, wire API routes/stateful middleware/config, configure SPA/session/CORS/proxy contracts, and add foundation tests.
2. **Phase 1C.3 — Login, logout, and `/api/auth/me`:** email normalization, password rule utility, session regeneration/invalidation, safe auth-state resource, throttling, tests.
3. **Phase 1C.4 — Student registration:** server-owned role/status, restricted session creation, uniqueness/reserved-email behavior, tests.
4. **Phase 1C.5 — Email verification and resend:** authenticated signed callback, login/resume behavior, Mailpit delivery, throttling, tests.
5. **Phase 1C.6 — Account-state authorization:** centralized active/verified application gate plus PENDING/SUSPENDED/REJECTED restricted behavior, tests.
6. **Phase 1C.7 — Admin Student approval/rejection/restoration:** transactional transitions, internal rejection reason persistence, metadata, tests.
7. **Phase 1C.8 — Instructor invitation/password setup:** invitation persistence, seven-day expiry, atomic reissue/revocation, acceptance, tests.
8. **Phase 1C.9 — Forgot/reset password:** eligibility rules, enumeration safety, lifecycle preservation, session invalidation, tests.
9. **Phase 1C.10 — First Admin Artisan command:** safe production bootstrap and tests.
10. **Phase 1C.11 — Angular auth integration:** API client/state, CSRF bootstrap, guards, login/register/recovery/verification/restricted states, error/loading/success behavior, end-to-end smoke proof.

The Angular integration follows proven backend contracts; vertical integration may begin incrementally after the corresponding backend slice is reviewed, but Phase 1C is not complete until the complete browser journey is verified.

---

## 14. Deferred authentication features

The following are intentionally not part of the frozen MVP authentication contract:

- production email-provider selection;
- multi-factor authentication;
- personal access tokens or third-party API authentication;
- social login;
- remember-me UI/extended persistent sessions;
- user-facing session/device management;
- authenticated email-change workflow;
- authenticated change-password UI separate from reset;
- additional Admin bootstrap/provisioning mechanisms.

## 15. Remaining unknowns

**None.** The approved Phase 1C.1 decisions resolve all product/business questions required to implement the authentication contract. Implementation-level details that preserve this behavior are owned by the relevant Phase 1C slice and its tests.
