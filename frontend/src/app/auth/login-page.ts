import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthApiService } from '../core/auth/auth-api.service';
import { AuthStateService } from '../core/auth/auth-state.service';
import { AuthDestinationService } from '../core/auth/auth-destination.service';
import {
  extractValidationErrors,
  genericFailureMessage,
  isThrottled,
} from '../core/auth/auth-errors';

@Component({
  selector: 'app-login-page',
  template: `
    <main class="auth-shell">
      <div class="auth-card">
        <h1>Sign in</h1>
        <p class="lead">Welcome back. Enter your email and password to continue.</p>

        @if (formError) {
          <p class="notice notice-error form-error" role="alert">{{ formError }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              formControlName="email"
              autocomplete="email"
              [attr.aria-invalid]="fieldInvalid('email')"
            />
            @if (fieldInvalid('email')) {
              <p class="error-text">{{ form.get('email')?.errors?.['required'] ? 'Email is required.' : 'Enter a valid email address.' }}</p>
            }
            @if (serverErrors['email']) {
              <p class="error-text">{{ serverErrors['email'] }}</p>
            }
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              formControlName="password"
              autocomplete="current-password"
              [attr.aria-invalid]="fieldInvalid('password')"
            />
            @if (fieldInvalid('password')) {
              <p class="error-text">Password is required.</p>
            }
            @if (serverErrors['password']) {
              <p class="error-text">{{ serverErrors['password'] }}</p>
            }
          </div>

          <button type="submit" class="btn" [disabled]="submitting">
            {{ submitting ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="form-footer">
          Don&rsquo;t have an account? <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </main>
  `,
  imports: [ReactiveFormsModule, RouterLink],
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly destination = inject(AuthDestinationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submitting = false;
  formError: string | null = null;
  serverErrors: Record<string, string> = {};

  ngOnInit(): void {
    // An authenticated user on the login page is redirected by guestOnlyGuard.
  }

  fieldInvalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  onSubmit(): void {
    if (this.submitting) {
      return;
    }
    this.serverErrors = {};
    this.formError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { email, password } = this.form.getRawValue();
    this.authApi
      .login({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (envelope) => {
          this.authState.applyUser(envelope.data.user);
          this.destination.navigateToAuthenticatedDestination();
        },
        error: (err) => {
          this.submitting = false;
          const validation = extractValidationErrors(err);
          if (validation) {
            this.serverErrors = validation;
          } else if (isThrottled(err)) {
            this.formError = 'Too many sign-in attempts. Please try again later.';
          } else if (err?.status === 401) {
            // Generic; never reveal whether the email exists.
            this.formError = 'Invalid email or password.';
          } else {
            this.formError = genericFailureMessage();
          }
        },
      });
  }
}
