import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { take, tap } from 'rxjs/operators';

import { AuthApiService } from './auth-api.service';
import { SafeUser } from './auth.types';

/**
 * Canonical auth/session state for the SPA.
 *
 * Authentication is owned by the server session. This service only reflects
 * what `/api/auth/me` (or a session-establishing login/register response)
 * reports; it never treats localStorage/sessionStorage as an authority and
 * never stores credentials.
 *
 * The initial state is `loading` (session unresolved). After bootstrap it
 * becomes `guest`, `authenticated`, or `error`. Restricted accounts stay
 * `authenticated`; PENDING/SUSPENDED/REJECTED states are never downgraded to
 * guest client-side.
 */
export type SessionState =
  | { kind: 'loading' }
  | { kind: 'guest' }
  | { kind: 'authenticated'; user: SafeUser }
  | { kind: 'error'; error: unknown };

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly authApi = inject(AuthApiService);

  private readonly session = signal<SessionState>({ kind: 'loading' });

  private inFlight: Promise<void> | null = null;

  readonly state = this.session.asReadonly();

  readonly user = computed<SafeUser | null>(() => {
    const s = this.session();
    return s.kind === 'authenticated' ? s.user : null;
  });

  readonly isLoading = computed(() => this.session().kind === 'loading');

  readonly isGuest = computed(() => this.session().kind === 'guest');

  readonly isAuthenticated = computed(() => this.session().kind === 'authenticated');

  readonly isError = computed(() => this.session().kind === 'error');

  /**
   * True only for an authenticated, email-verified, ACTIVE account. This mirrors
   * the backend `application.access` contract. It is a UX aid only; the backend
   * remains the security boundary.
   */
  readonly canAccessApplication = computed(() => {
    const s = this.session();
    return (
      s.kind === 'authenticated' &&
      s.user.status === 'ACTIVE' &&
      s.user.email_verified_at !== null
    );
  });

  /**
   * Authenticated but not allowed into the normal application shell. Used to
   * route restricted users (PENDING/SUSPENDED/REJECTED or the ACTIVE-unverified
   * integrity anomaly) to state-appropriate experiences.
   */
  readonly isRestricted = computed(
    () => this.session().kind === 'authenticated' && !this.canAccessApplication(),
  );

  /** True for an authenticated ACTIVE+unverified integrity anomaly. */
  readonly isActiveUnverified = computed(() => {
    const s = this.session();
    return (
      s.kind === 'authenticated' &&
      s.user.status === 'ACTIVE' &&
      s.user.email_verified_at === null
    );
  });

  /**
   * Resolves the current session from `GET /api/auth/me`. 401 becomes `guest`;
   * other failures become `error` so an unexpected outage is distinguishable
   * from being logged out. Safe to call once at startup and reused by guards.
   *
   * Concurrent calls share a single `/me` request so guards/components never
   * duplicate the startup bootstrap.
   */
  initialize(): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }
    this.inFlight = this.resolveSession().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async resolveSession(): Promise<void> {
    try {
      const envelope = await lastValueFrom(this.authApi.me().pipe(take(1)));
      this.session.set({ kind: 'authenticated', user: envelope.data.user });
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 401) {
        this.session.set({ kind: 'guest' });
      } else {
        this.session.set({ kind: 'error', error: err });
      }
    }
  }

  /** Applies the safe user returned by login or registration. */
  applyUser(user: SafeUser): void {
    this.session.set({ kind: 'authenticated', user });
  }

  setGuest(): void {
    this.session.set({ kind: 'guest' });
  }

  setLoading(): void {
    this.session.set({ kind: 'loading' });
  }

  /**
   * Invalidates the server session and, on success, clears canonical state to
   * guest so stale user data disappears. Navigation is handled by the caller.
   */
  logout(): Observable<void> {
    return this.authApi.logout().pipe(tap(() => this.setGuest()));
  }
}
