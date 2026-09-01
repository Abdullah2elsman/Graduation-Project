import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject, InjectionToken } from '@angular/core';

import { AuthStateService } from './auth-state.service';

/**
 * Destination overrides for guard redirects. The Phase 1C.11A router has not yet
 * frozen dashboard/guest destination URLs, so guards default to the root and
 * route owners can override these tokens once the destination routes exist.
 */
export const AUTHENTICATED_REDIRECT_URL = new InjectionToken<string>(
  'AUTHENTICATED_REDIRECT_URL',
  { factory: () => '/' },
);

export const UNAUTHENTICATED_REDIRECT_URL = new InjectionToken<string>(
  'UNAUTHENTICATED_REDIRECT_URL',
  { factory: () => '/' },
);

export const RESTRICTED_REDIRECT_URL = new InjectionToken<string>(
  'RESTRICTED_REDIRECT_URL',
  { factory: () => '/' },
);

export type GuardResult = boolean | UrlTree;

function redirect(router: Router, url: string): UrlTree {
  return router.parseUrl(url);
}

/**
 * Guest-only routes (login, register, public recovery). Authenticated users are
 * redirected regardless of their restricted status; restricted users remain
 * authenticated rather than being forced to guest.
 */
export function guestOnlyGuard(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): GuardResult {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return redirect(router, inject(AUTHENTICATED_REDIRECT_URL));
  }
  return true;
}

/**
 * Protected routes that require any authenticated session, including restricted
 * states. Guests are redirected to the login destination.
 */
export function authenticatedGuard(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): GuardResult {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return redirect(router, inject(UNAUTHENTICATED_REDIRECT_URL));
}

/**
 * Normal application-access routes. Requires an authenticated, email-verified,
 * ACTIVE account (mirrors the backend `application.access` contract). Restricted
 * or guest users are redirected to their appropriate destination.
 */
export function applicationAccessGuard(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): GuardResult {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (auth.canAccessApplication()) {
    return true;
  }
  if (auth.isAuthenticated()) {
    return redirect(router, inject(RESTRICTED_REDIRECT_URL));
  }
  return redirect(router, inject(UNAUTHENTICATED_REDIRECT_URL));
}
