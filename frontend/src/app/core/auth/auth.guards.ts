import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject } from '@angular/core';

import { AuthStateService } from './auth-state.service';
import {
  AuthDestinationService,
  routeForAuthenticated,
} from './auth-destination.service';

export type GuardResult = boolean | UrlTree;

/**
 * Guest-only routes (login, register, public recovery). Authenticated users are
 * redirected to their canonical state destination; restricted users remain
 * authenticated rather than being forced to guest.
 */
export function guestOnlyGuard(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): GuardResult {
  const auth = inject(AuthStateService);
  const gateway = inject(AuthDestinationService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return router.parseUrl(gateway.authenticatedDestination());
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
  const gateway = inject(AuthDestinationService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.parseUrl(gateway.guestDestination);
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
  const gateway = inject(AuthDestinationService);
  const router = inject(Router);
  if (auth.canAccessApplication()) {
    return true;
  }
  if (auth.isAuthenticated()) {
    return router.parseUrl(gateway.authenticatedDestination());
  }
  return router.parseUrl(gateway.guestDestination);
}

/**
 * Factory guard for a specific restricted account-state page. The user is only
 * admitted when their canonical state maps to the requested destination;
 * otherwise they are redirected to their correct destination. This keeps a
 * restricted user off the wrong restricted page and avoids redirect loops.
 */
export function restrictedStateGuard(expectedPath: string) {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): GuardResult => {
    const auth = inject(AuthStateService);
    const gateway = inject(AuthDestinationService);
    const router = inject(Router);
    const user = auth.user();
    if (!user) {
      return router.parseUrl(gateway.guestDestination);
    }
    if (routeForAuthenticated(user) === expectedPath) {
      return true;
    }
    return router.parseUrl(gateway.authenticatedDestination());
  };
}
