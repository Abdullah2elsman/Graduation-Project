import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  RouterModule,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { provideApiHttp } from '../http/api-http.providers';
import { AuthApiService } from './auth-api.service';
import { AuthStateService } from './auth-state.service';
import { SafeUser } from './auth.types';
import {
  applicationAccessGuard,
  authenticatedGuard,
  guestOnlyGuard,
} from './auth.guards';

function activeUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    id: 1,
    name: 'Ada',
    email: 'ada@example.com',
    role: 'STUDENT',
    status: 'ACTIVE',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
    ...overrides,
  };
}

/**
 * Resolves the pending `/sanctum/csrf-cookie` request and lets the promise chain
 * (`CsrfBootstrapService` -> `switchMap` in `AuthApiService`) flush so the
 * downstream mutation request is registered by the testing backend.
 */
async function flushCsrf(http: HttpTestingController): Promise<void> {
  http
    .expectOne('/sanctum/csrf-cookie')
    .flush(null, { status: 204, statusText: 'No Content' });
  await new Promise((resolve) => setTimeout(resolve));
}

describe('AuthApiService', () => {
  let service: AuthApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the canonical auth endpoint paths with the shared HttpClient', async () => {
    service.me().subscribe();
    http.expectOne('/api/auth/me');

    service.login({ email: 'a@b.c', password: 'secret1' }).subscribe();
    await flushCsrf(http);
    const login = http.expectOne('/api/auth/login');
    expect(login.request.body).toEqual({ email: 'a@b.c', password: 'secret1' });

    service
      .register({
        name: 'N',
        email: 'a@b.c',
        password: 'secret1',
        password_confirmation: 'secret1',
      })
      .subscribe();
    await flushCsrf(http);
    const register = http.expectOne('/api/auth/register');
    expect(register.request.body).toHaveProperty('password_confirmation');

    service.logout().subscribe();
    await flushCsrf(http);
    http.expectOne('/api/auth/logout');
  });

  it('does not introduce bearer or local-storage auth for mutations', async () => {
    service.login({ email: 'a@b.c', password: 'secret1' }).subscribe();
    const csrf = http.expectOne('/sanctum/csrf-cookie');
    expect(csrf.request.headers.has('Authorization')).toBe(false);
    csrf.flush(null, { status: 204, statusText: 'No Content' });
    await new Promise((resolve) => setTimeout(resolve));

    const login = http.expectOne('/api/auth/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    expect(login.request.withCredentials).toBe(true);
    login.flush({ data: { user: activeUser() } });
  });
});

describe('Auth CSRF bootstrap ordering', () => {
  let service: AuthApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login obtains the CSRF cookie before POST /api/auth/login', async () => {
    service.login({ email: 'a@b.c', password: 'secret1' }).subscribe();

    await flushCsrf(http);
    const login = http.expectOne('/api/auth/login');
    login.flush({ data: { user: activeUser() } });
  });

  it('register obtains the CSRF cookie before POST /api/auth/register', async () => {
    service
      .register({
        name: 'N',
        email: 'a@b.c',
        password: 'secret1',
        password_confirmation: 'secret1',
      })
      .subscribe();

    await flushCsrf(http);
    const register = http.expectOne('/api/auth/register');
    register.flush({ data: { user: activeUser({ role: 'STUDENT' }) } }, {
      status: 201,
      statusText: 'Created',
    });
  });

  it('logout follows the canonical CSRF-safe mutation path', async () => {
    service.logout().subscribe();

    await flushCsrf(http);
    http.expectOne('/api/auth/logout').flush(null);
  });

  it('does not send the mutation until the CSRF bootstrap succeeds', async () => {
    service.login({ email: 'a@b.c', password: 'secret1' }).subscribe();

    expect(() => http.expectOne('/api/auth/login')).toThrow();

    await flushCsrf(http);
    http.expectOne('/api/auth/login');
  });

  it('does not send the mutation when the CSRF bootstrap fails', async () => {
    let emitted = false;
    let errored = false;
    service.login({ email: 'a@b.c', password: 'secret1' }).subscribe({
      next: () => (emitted = true),
      error: () => (errored = true),
    });

    http
      .expectOne('/sanctum/csrf-cookie')
      .flush({}, { status: 500, statusText: 'Server Error' });
    await new Promise((resolve) => setTimeout(resolve));

    expect(errored).toBe(true);
    expect(emitted).toBe(false);
    expect(() => http.expectOne('/api/auth/login')).toThrow();
  });

  it('shares a single in-flight CSRF bootstrap across simultaneous mutations', async () => {
    service.login({ email: 'a@b.c', password: 'secret1' }).subscribe();
    service.register({
      name: 'N',
      email: 'a@b.c',
      password: 'secret1',
      password_confirmation: 'secret1',
    }).subscribe();

    await flushCsrf(http);

    http.expectOne('/api/auth/login').flush({ data: { user: activeUser() } });
    const register = http.expectOne('/api/auth/register');
    register.flush({ data: { user: activeUser({ role: 'STUDENT' }) } }, {
      status: 201,
      statusText: 'Created',
    });
  });
});

describe('AuthStateService bootstrap', () => {
  let service: AuthStateService;
  let http: HttpTestingController;

  const bootstrap = () =>
    TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideHttpClientTesting(), AuthStateService],
    });

  beforeEach(() => {
    bootstrap();
    service = TestBed.inject(AuthStateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts in an unresolved/loading state', () => {
    expect(service.state()).toEqual({ kind: 'loading' });
    expect(service.isLoading()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isGuest()).toBe(false);
  });

  it('establishes an authenticated user from a 200 /me response', async () => {
    const promise = service.initialize();
    const request = http.expectOne('/api/auth/me');
    request.flush({ data: { user: activeUser() } });
    await promise;

    const state = service.state();
    expect(state.kind).toBe('authenticated');
    if (state.kind === 'authenticated') {
      expect(state.user.email).toBe('ada@example.com');
    }
    expect(service.user()).toEqual(activeUser());
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isLoading()).toBe(false);
  });

  it('becomes guest on a 401 /me response', async () => {
    const promise = service.initialize();
    http.expectOne('/api/auth/me').flush({ message: 'Unauthenticated' }, { status: 401, statusText: 'Unauthorized' });
    await promise;

    expect(service.state().kind).toBe('guest');
    expect(service.isGuest()).toBe(true);
    expect(service.user()).toBeNull();
  });

  it('distinguishes an unexpected /me failure from guest', async () => {
    const promise = service.initialize();
    http.expectOne('/api/auth/me').flush({}, { status: 500, statusText: 'Server Error' });
    await promise;

    const state = service.state();
    expect(state.kind).toBe('error');
    expect(service.isError()).toBe(true);
    expect(service.isGuest()).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('calls /me exactly once (no duplicate bootstrap calls)', async () => {
    const promiseA = service.initialize();
    const promiseB = service.initialize();
    const request = http.expectOne('/api/auth/me');
    request.flush({ data: { user: activeUser() } });
    await Promise.all([promiseA, promiseB]);

    http.verify();
    expect(service.isAuthenticated()).toBe(true);
  });
});

describe('AuthStateService classification', () => {
  const configure = () =>
    TestBed.configureTestingModule({ providers: [AuthStateService] });

  it('recognizes ACTIVE + verified as normal application access', () => {
    configure();
    const service = TestBed.inject(AuthStateService);
    service.applyUser(activeUser());
    expect(service.canAccessApplication()).toBe(true);
    expect(service.isRestricted()).toBe(false);
  });

  it('denies application access to ACTIVE + unverified (integrity anomaly)', () => {
    configure();
    const service = TestBed.inject(AuthStateService);
    service.applyUser(activeUser({ email_verified_at: null }));
    expect(service.canAccessApplication()).toBe(false);
    expect(service.isActiveUnverified()).toBe(true);
    expect(service.isRestricted()).toBe(true);
  });

  it.each([
    ['PENDING', null],
    ['PENDING', '2026-01-01T00:00:00.000000Z'],
    ['SUSPENDED', null],
    ['REJECTED', null],
  ])('denies application access for status %s / verified=%s', (status, email_verified_at) => {
    configure();
    const service = TestBed.inject(AuthStateService);
    service.applyUser(activeUser({ status: status as SafeUser['status'], email_verified_at }));
    expect(service.canAccessApplication()).toBe(false);
    expect(service.isRestricted()).toBe(true);
  });
});

describe('AuthStateService login/register/logout operations', () => {
  const configure = () =>
    TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideHttpClientTesting(), AuthStateService],
    });

  it('keeps a restricted session authenticated after login', async () => {
    configure();
    const service = TestBed.inject(AuthStateService);
    const http = TestBed.inject(HttpTestingController);

    const pendingUser = activeUser({ status: 'PENDING', email_verified_at: null });
    const api = TestBed.inject(AuthApiService);

    const payload = new Promise<void>((resolve) => {
      api.login({ email: 'a@b.c', password: 'secret1' }).subscribe((env) => {
        service.applyUser(env.data.user);
        resolve();
      });
    });
    await flushCsrf(http);
    http.expectOne('/api/auth/login').flush({ data: { user: pendingUser } });
    await payload;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.canAccessApplication()).toBe(false);
    expect(service.isRestricted()).toBe(true);
  });

  it('registration produces an authenticated PENDING/unverified Student', async () => {
    configure();
    const service = TestBed.inject(AuthStateService);
    const http = TestBed.inject(HttpTestingController);
    const api = TestBed.inject(AuthApiService);

    const newStudent = activeUser({ status: 'PENDING', email_verified_at: null });
    const payload = new Promise<void>((resolve) => {
      api
        .register({
          name: 'New',
          email: 'new@example.com',
          password: 'secret1',
          password_confirmation: 'secret1',
        })
        .subscribe((env) => {
          service.applyUser(env.data.user);
          resolve();
        });
    });
    await flushCsrf(http);
    http.expectOne('/api/auth/register').flush({ data: { user: newStudent } }, { status: 201, statusText: 'Created' });
    await payload;

    const state = service.state();
    expect(state.kind).toBe('authenticated');
    if (state.kind === 'authenticated') {
      expect(state.user.role).toBe('STUDENT');
      expect(state.user.status).toBe('PENDING');
      expect(state.user.email_verified_at).toBeNull();
    }
    expect(service.isAuthenticated()).toBe(true);
    expect(service.canAccessApplication()).toBe(false);
  });

  it('logout clears the current user to guest', async () => {
    configure();
    const service = TestBed.inject(AuthStateService);
    const http = TestBed.inject(HttpTestingController);
    const api = TestBed.inject(AuthApiService);

    service.applyUser(activeUser());
    expect(service.isAuthenticated()).toBe(true);

    api.logout().subscribe(() => service.setGuest());
    await flushCsrf(http);
    http.expectOne('/api/auth/logout').flush(null);

    expect(service.state().kind).toBe('guest');
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});

describe('Auth guards', () => {
  const dummy = { params: {}, queryParams: {} } as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [RouterModule],
      providers: [provideApiHttp(), provideHttpClientTesting(), AuthStateService],
    }),
  );

  it('guest-only guard allows guests and blocks authenticated users', () => {
    const auth = TestBed.inject(AuthStateService);

    auth.setGuest();
    const guestResult = TestBed.runInInjectionContext(() => guestOnlyGuard(dummy, state));
    expect(guestResult).toBe(true);

    auth.applyUser(activeUser());
    const result = TestBed.runInInjectionContext(() => guestOnlyGuard(dummy, state));
    expect(result).not.toBe(true);
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('authenticated guard allows any authenticated session and blocks guests', () => {
    const auth = TestBed.inject(AuthStateService);

    auth.setGuest();
    const guestResult = TestBed.runInInjectionContext(() => authenticatedGuard(dummy, state));
    expect(guestResult).not.toBe(true);

    auth.applyUser(activeUser({ status: 'PENDING', email_verified_at: null }));
    const authResult = TestBed.runInInjectionContext(() => authenticatedGuard(dummy, state));
    expect(authResult).toBe(true);
  });

  it('application-access guard allows ACTIVE+verified and blocks guests/restricted', () => {
    const auth = TestBed.inject(AuthStateService);

    auth.setGuest();
    const guestResult = TestBed.runInInjectionContext(() => applicationAccessGuard(dummy, state));
    expect(guestResult).not.toBe(true);

    auth.applyUser(activeUser({ status: 'PENDING', email_verified_at: null }));
    const restrictedResult = TestBed.runInInjectionContext(() => applicationAccessGuard(dummy, state));
    expect(restrictedResult).not.toBe(true);

    auth.applyUser(activeUser());
    const accessResult = TestBed.runInInjectionContext(() => applicationAccessGuard(dummy, state));
    expect(accessResult).toBe(true);
  });
});
