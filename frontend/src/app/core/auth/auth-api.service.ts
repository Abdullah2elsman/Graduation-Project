import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';

import { CsrfBootstrapService } from '../http/csrf-bootstrap.service';
import {
  AuthUserEnvelope,
  LoginRequest,
  RegisterEnvelope,
  RegisterRequest,
} from './auth.types';

/**
 * Typed, thin client for the canonical auth endpoints used by Phase 1C.11.
 *
 * It reuses the centrally configured `HttpClient` from `provideApiHttp`, which
 * already applies `withCredentials` and the Sanctum `XSRF-TOKEN` →
 * `X-XSRF-TOKEN` behavior for relative `/api` requests. State-changing methods
 * first ensure Sanctum's CSRF cookie via `/sanctum/csrf-cookie` (through
 * `CsrfBootstrapService`) so the actual mutation is sent only after a
 * successful bootstrap. No tokens or secrets are stored here; the server
 * session is the authentication authority.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(CsrfBootstrapService);

  me(): Observable<AuthUserEnvelope> {
    return this.http.get<AuthUserEnvelope>('/api/auth/me');
  }

  login(body: LoginRequest): Observable<AuthUserEnvelope> {
    return from(this.csrf.ensureCookie()).pipe(
      switchMap(() => this.http.post<AuthUserEnvelope>('/api/auth/login', body)),
    );
  }

  register(body: RegisterRequest): Observable<RegisterEnvelope> {
    return from(this.csrf.ensureCookie()).pipe(
      switchMap(() => this.http.post<RegisterEnvelope>('/api/auth/register', body)),
    );
  }

  logout(): Observable<void> {
    return from(this.csrf.ensureCookie()).pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', {})),
    );
  }
}
