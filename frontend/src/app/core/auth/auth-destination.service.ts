import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

import { AuthStateService } from './auth-state.service';
import { SafeUser } from './auth.types';

export const LOGIN_PATH = '/auth/login';
export const REGISTER_PATH = '/auth/register';
export const APP_SHELL_PATH = '/app';

export const VERIFY_EMAIL_PATH = '/account/verify-email';
export const PENDING_APPROVAL_PATH = '/account/pending';
export const SUSPENDED_PATH = '/account/suspended';
export const REJECTED_PATH = '/account/rejected';
export const ANOMALY_PATH = '/account/anomaly';

/**
 * Single, reusable account-state → destination classifier. Pages, guards, and
 * post-login/register flows all read from this so the canonical
 * `SafeUser`/`AuthStateService` is the only source of truth and the
 * state→route rules are not duplicated across components.
 */
export function routeForAuthenticated(user: SafeUser): string {
  if (user.status === 'ACTIVE' && user.email_verified_at !== null) {
    return APP_SHELL_PATH;
  }
  if (user.status === 'PENDING' && user.email_verified_at === null) {
    return VERIFY_EMAIL_PATH;
  }
  if (user.status === 'PENDING') {
    return PENDING_APPROVAL_PATH;
  }
  if (user.status === 'SUSPENDED') {
    return SUSPENDED_PATH;
  }
  if (user.status === 'REJECTED') {
    return REJECTED_PATH;
  }
  // ACTIVE but unverified is an integrity anomaly: never the application shell.
  return ANOMALY_PATH;
}

@Injectable({ providedIn: 'root' })
export class AuthDestinationService {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);

  readonly guestDestination = LOGIN_PATH;

  /** Canonical destination for the current authenticated session. */
  readonly authenticatedDestination = computed(() => {
    const user = this.authState.user();
    return user ? routeForAuthenticated(user) : ANOMALY_PATH;
  });

  navigateToAuthenticatedDestination(): void {
    const target = this.authenticatedDestination();
    void this.router.navigate([target]);
  }

  navigateToGuestDestination(): void {
    void this.router.navigate([this.guestDestination]);
  }

  /**
   * Canonical logout: invalidate the server session, clear canonical guest
   * state, then return to the login destination. Stale user data is removed.
   */
  logout(): void {
    this.authState
      .logout()
      .pipe(tap(() => this.navigateToGuestDestination()))
      .subscribe();
  }
}
