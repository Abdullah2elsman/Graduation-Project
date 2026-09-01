import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { provideApiHttp } from '../http/api-http.providers';
import { AuthStateService } from './auth-state.service';
import { AuthDestinationService, routeForAuthenticated } from './auth-destination.service';
import { SafeUser } from './auth.types';

function user(partial: Partial<SafeUser>): SafeUser {
  return {
    id: 1,
    name: 'Ada',
    email: 'ada@example.com',
    role: 'STUDENT',
    status: 'ACTIVE',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
    ...partial,
  };
}

describe('routeForAuthenticated', () => {
  it('maps every canonical account state to its destination', () => {
    expect(routeForAuthenticated(user({ status: 'ACTIVE', email_verified_at: 'x' }))).toBe('/app');
    expect(
      routeForAuthenticated(user({ status: 'PENDING', email_verified_at: null })),
    ).toBe('/account/verify-email');
    expect(
      routeForAuthenticated(user({ status: 'PENDING', email_verified_at: 'x' })),
    ).toBe('/account/pending');
    expect(routeForAuthenticated(user({ status: 'SUSPENDED' }))).toBe('/account/suspended');
    expect(routeForAuthenticated(user({ status: 'REJECTED' }))).toBe('/account/rejected');
    // ACTIVE + unverified is an integrity anomaly, never the application shell.
    expect(routeForAuthenticated(user({ status: 'ACTIVE', email_verified_at: null }))).toBe(
      '/account/anomaly',
    );
  });
});

describe('AuthDestinationService', () => {
  let service: AuthDestinationService;
  let authState: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideRouter([]), provideLocationMocks()],
    });
    service = TestBed.inject(AuthDestinationService);
    authState = TestBed.inject(AuthStateService);
  });

  it('exposes a guest destination of the login page', () => {
    expect(service.guestDestination).toBe('/auth/login');
  });

  it('derives destination from the current authenticated session', () => {
    authState.applyUser(user({ status: 'PENDING', email_verified_at: null }));
    expect(service.authenticatedDestination()).toBe('/account/verify-email');

    authState.applyUser(user({ status: 'ACTIVE', email_verified_at: 'x' }));
    expect(service.authenticatedDestination()).toBe('/app');
  });
});
