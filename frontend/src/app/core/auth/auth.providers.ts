import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { AuthStateService } from './auth-state.service';

/**
 * Registers the canonical session bootstrap. On application startup the auth
 * state is resolved from `GET /api/auth/me` before rendering begins, so the UI
 * does not flash an authenticated shell before the session is known. Guards and
 * components read the same canonical `AuthStateService`.
 */
export function provideAuthSession(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (authState: AuthStateService) => (): Promise<void> => authState.initialize(),
      deps: [AuthStateService],
      multi: true,
    },
  ]);
}
