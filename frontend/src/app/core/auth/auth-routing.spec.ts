import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { routes } from '../../app.routes';
import { provideApiHttp } from '../http/api-http.providers';
import { AuthStateService } from './auth-state.service';
import { SafeUser } from './auth.types';
import { LoginPage } from '../../auth/login-page';
import { RegisterPage } from '../../auth/register-page';
import { AppShell } from '../../app-shell';
import { VerifyEmailPage } from '../../auth/restricted/verify-email-page';
import { PendingPage } from '../../auth/restricted/pending-page';
import { SuspendedPage } from '../../auth/restricted/suspended-page';
import { RejectedPage } from '../../auth/restricted/rejected-page';
import { AnomalyPage } from '../../auth/restricted/anomaly-page';

type Case = [SafeUser, string, Type<unknown>];

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

describe('Auth routing', () => {
  let auth: AuthStateService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();
    auth = TestBed.inject(AuthStateService);
    harness = await RouterTestingHarness.create('/auth/login');
  });

  afterEach(() => {
    harness.fixture.destroy();
    TestBed.inject(Router).resetConfig([]);
  });

  it('allows guests onto login and register', async () => {
    auth.setGuest();
    await harness.navigateByUrl('/auth/register', RegisterPage);
  });

  it('guest-only guard redirects an authenticated user off login', async () => {
    auth.applyUser(user({ status: 'ACTIVE', email_verified_at: 'x' }));
    await harness.navigateByUrl('/app', AppShell);
    await harness.navigateByUrl('/auth/login', AppShell);
  });

  it('guest-only guard redirects a restricted user off login to their state', async () => {
    auth.applyUser(user({ status: 'PENDING', email_verified_at: null }));
    await harness.navigateByUrl('/account/verify-email', VerifyEmailPage);
    await harness.navigateByUrl('/auth/login', VerifyEmailPage);
  });

  it('routes an ACTIVE+verified user to the application shell', async () => {
    auth.applyUser(user({ status: 'ACTIVE', email_verified_at: 'x' }));
    await harness.navigateByUrl('/app', AppShell);
  });

  it('denies every restricted state from the application shell', async () => {
    const cases: Array<[SafeUser, Type<unknown>]> = [
      [user({ status: 'PENDING', email_verified_at: null }), VerifyEmailPage],
      [user({ status: 'PENDING', email_verified_at: 'x' }), PendingPage],
      [user({ status: 'SUSPENDED' }), SuspendedPage],
      [user({ status: 'REJECTED' }), RejectedPage],
      [user({ status: 'ACTIVE', email_verified_at: null }), AnomalyPage],
    ];
    for (const [u, expected] of cases) {
      auth.applyUser(u);
      await harness.navigateByUrl('/app', expected);
    }
  });

  it('selects the correct page for every canonical restricted state', async () => {
    const cases: Case[] = [
      [user({ status: 'PENDING', email_verified_at: null }), '/account/verify-email', VerifyEmailPage],
      [user({ status: 'PENDING', email_verified_at: 'x' }), '/account/pending', PendingPage],
      [user({ status: 'SUSPENDED' }), '/account/suspended', SuspendedPage],
      [user({ status: 'REJECTED' }), '/account/rejected', RejectedPage],
      [user({ status: 'ACTIVE', email_verified_at: null }), '/account/anomaly', AnomalyPage],
    ];
    for (const [u, url, expected] of cases) {
      auth.applyUser(u);
      await harness.navigateByUrl(url, expected);
    }
  });

  it('redirects a user from a wrong restricted page to their own destination', async () => {
    auth.applyUser(user({ status: 'PENDING', email_verified_at: null }));
    await harness.navigateByUrl('/account/pending', VerifyEmailPage);
  });

  it('sends an unauthenticated user to login when no session exists', async () => {
    auth.setGuest();
    await harness.navigateByUrl('/app', LoginPage);
  });
});
