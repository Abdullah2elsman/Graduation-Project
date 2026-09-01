import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { provideApiHttp } from '../core/http/api-http.providers';
import { AuthStateService } from '../core/auth/auth-state.service';
import { SafeUser } from '../core/auth/auth.types';
import { RegisterPage } from './register-page';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideApiHttp(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  const validValues = {
    name: 'New Student',
    email: 'new@example.com',
    password: 'secret123',
    password_confirmation: 'secret123',
  };

  const newStudent: SafeUser = {
    id: 9,
    name: 'New Student',
    email: 'new@example.com',
    role: 'STUDENT',
    status: 'PENDING',
    email_verified_at: null,
  };

  async function flushMutation(status = 201, body: Record<string, unknown>): Promise<void> {
    httpTesting.expectOne('/sanctum/csrf-cookie').flush(null, { status: 204, statusText: 'No Content' });
    await new Promise((resolve) => setTimeout(resolve));
    httpTesting.expectOne('/api/auth/register').flush(body, {
      status,
      statusText: status === 422 ? 'Unprocessable Entity' : 'Created',
    });
  }

  it('renders only Student registration fields and no role/status selectors', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[autocomplete="name"]')).toBeTruthy();
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[autocomplete="new-password"]')).toBeTruthy();
    expect(el.querySelectorAll('select').length).toBe(0);
    expect(el.textContent).not.toContain('Role');
    expect(el.textContent).not.toContain('Status');
    expect(el.textContent).not.toContain('Instructor');
    expect(el.textContent).not.toContain('Admin');
  });

  it('routes a successful registration to the verify-email experience', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.setValue(validValues);
    component.onSubmit();
    await flushMutation(201, { data: { user: newStudent } });
    await new Promise((resolve) => setTimeout(resolve));

    expect(TestBed.inject(AuthStateService).isAuthenticated()).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/account/verify-email']);
  });

  it('surfaces backend validation errors safely', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    component.form.setValue(validValues);
    component.onSubmit();
    await flushMutation(422, {
      message: 'The email has already been taken.',
      errors: { email: ['The email has already been taken.'] },
    });

    expect(component.serverErrors['email']).toBe('The email has already been taken.');
    expect(component.submitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('prevents duplicate submission while pending', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue(validValues);
    component.onSubmit();
    expect(component.submitting).toBe(true);

    component.onSubmit();
    fixture.detectChanges();

    // A single register mutation is dispatched despite the second submit call;
    // `expectOne` would fail if the duplicate submit had fired a second request.
    await flushMutation(201, { data: { user: newStudent } });
  });
});
