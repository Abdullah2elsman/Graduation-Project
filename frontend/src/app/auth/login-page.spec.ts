import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { provideApiHttp } from '../core/http/api-http.providers';
import { SafeUser } from '../core/auth/auth.types';
import { LoginPage } from './login-page';

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

async function flushMutations(httpTesting: HttpTestingController): Promise<void> {
  httpTesting.expectOne('/sanctum/csrf-cookie').flush(null, { status: 204, statusText: 'No Content' });
  await new Promise((resolve) => setTimeout(resolve));
}

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideApiHttp(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('renders email and password fields', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
    expect(el.querySelector('button[type="submit"]')?.textContent).toContain('Sign in');
  });

  async function submitAndExpectDestination(u: SafeUser, expected: string): Promise<void> {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue({ email: 'a@b.c', password: 'secret1' });
    component.onSubmit();
    await flushMutations(httpTesting);
    httpTesting.expectOne('/api/auth/login').flush({ data: { user: u } });
    await new Promise((resolve) => setTimeout(resolve));
    expect(navigate).toHaveBeenCalledWith([expected]);
  }

  it('routes an ACTIVE+verified login to the application destination', async () => {
    await submitAndExpectDestination(user({ status: 'ACTIVE', email_verified_at: 'x' }), '/app');
  });

  it('routes PENDING+unverified login to the verification experience', async () => {
    await submitAndExpectDestination(user({ status: 'PENDING', email_verified_at: null }), '/account/verify-email');
  });

  it('routes PENDING+verified login to the waiting experience', async () => {
    await submitAndExpectDestination(user({ status: 'PENDING', email_verified_at: 'x' }), '/account/pending');
  });

  it('routes SUSPENDED login to the suspended experience', async () => {
    await submitAndExpectDestination(user({ status: 'SUSPENDED' }), '/account/suspended');
  });

  it('routes REJECTED login to the generic rejected experience', async () => {
    await submitAndExpectDestination(user({ status: 'REJECTED' }), '/account/rejected');
  });

  it('routes ACTIVE+unverified login to the anomaly experience', async () => {
    await submitAndExpectDestination(user({ status: 'ACTIVE', email_verified_at: null }), '/account/anomaly');
  });

  it('shows a generic error and does not navigate for invalid credentials', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    component.form.setValue({ email: 'known@example.com', password: 'wrong' });
    component.onSubmit();
    await flushMutations(httpTesting);
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ message: 'These credentials do not match our records.' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.formError).toBe('Invalid email or password.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not leak whether an unknown email exists', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    component.form.setValue({ email: 'unknown@example.com', password: 'wrong' });
    component.onSubmit();
    await flushMutations(httpTesting);
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ message: 'These credentials do not match our records.' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.formError).toBe('Invalid email or password.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('surfaces 422 field validation errors', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    component.form.setValue({ email: 'a@b.c', password: 'secret1' });
    component.onSubmit();
    await flushMutations(httpTesting);
    httpTesting
      .expectOne('/api/auth/login')
      .flush(
        { message: 'The given data was invalid.', errors: { email: ['The email must be a valid email address.'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

    expect(component.serverErrors['email']).toBe('The email must be a valid email address.');
    expect(component.submitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('handles throttling with a safe message', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    component.form.setValue({ email: 'a@b.c', password: 'secret1' });
    component.onSubmit();
    await flushMutations(httpTesting);
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ message: 'Too many attempts.' }, { status: 429, statusText: 'Too Many Requests' });

    expect(component.formError).toBe('Too many sign-in attempts. Please try again later.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a generic failure message for network errors', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    component.form.setValue({ email: 'a@b.c', password: 'secret1' });
    component.onSubmit();
    await flushMutations(httpTesting);
    httpTesting.expectOne('/api/auth/login').error(new ProgressEvent('network'));

    expect(component.formError).toBe('Something went wrong. Please try again.');
    expect(component.submitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('prevents duplicate submission while pending', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue({ email: 'a@b.c', password: 'secret1' });
    component.onSubmit();
    expect(component.submitting).toBe(true);

    component.onSubmit();
    fixture.detectChanges();

    await flushMutations(httpTesting);
    // A single login mutation is registered despite the second submit call;
    // `expectOne` would fail if the duplicate submit had dispatched a request.
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ data: { user: user({ status: 'ACTIVE', email_verified_at: 'x' }) } });
  });
});
