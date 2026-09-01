import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
  selector: 'app-register-page',
  template: `
    <main class="auth-shell">
      <div class="auth-card">
        <h1>Create your account</h1>
        <p class="lead">Student registration. Your account must be approved before use.</p>

        @if (formError) {
          <p class="notice notice-error form-error" role="alert">{{ formError }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="field">
            <label for="name">Full name</label>
            <input id="name" type="text" name="name" formControlName="name" autocomplete="name" [attr.aria-invalid]="fieldInvalid('name')" />
            @if (fieldInvalid('name')) {
              <p class="error-text">Please enter your name.</p>
            }
            @if (serverErrors['name']) {
              <p class="error-text">{{ serverErrors['name'] }}</p>
            }
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" name="email" formControlName="email" autocomplete="email" [attr.aria-invalid]="fieldInvalid('email')" />
            @if (fieldInvalid('email')) {
              <p class="error-text">{{ form.get('email')?.errors?.['required'] ? 'Email is required.' : 'Enter a valid email address.' }}</p>
            }
            @if (serverErrors['email']) {
              <p class="error-text">{{ serverErrors['email'] }}</p>
            }
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" name="password" formControlName="password" autocomplete="new-password" [attr.aria-invalid]="fieldInvalid('password')" />
            <p class="hint">At least 8 characters, including a letter and a number.</p>
            @if (fieldInvalid('password')) {
              <p class="error-text">{{ passwordError }}</p>
            }
            @if (serverErrors['password']) {
              <p class="error-text">{{ serverErrors['password'] }}</p>
            }
          </div>

          <div class="field">
            <label for="passwordConfirm">Confirm password</label>
            <input id="passwordConfirm" type="password" name="password_confirmation" formControlName="password_confirmation" autocomplete="new-password" [attr.aria-invalid]="fieldInvalid('password_confirmation')" />
            @if (fieldInvalid('password_confirmation')) {
              <p class="error-text">Passwords do not match.</p>
            }
            @if (serverErrors['password']) {
              <p class="error-text">{{ serverErrors['password'] }}</p>
            }
          </div>

          <button type="submit" class="btn" [disabled]="submitting">
            {{ submitting ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="form-footer">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </main>
  `,
  imports: [ReactiveFormsModule, RouterLink],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly destination = inject(AuthDestinationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), passwordPolicy]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: matchPasswords('password', 'password_confirmation') },
  );

  submitting = false;
  formError: string | null = null;
  serverErrors: Record<string, string> = {};

  get passwordError(): string {
    const control = this.form.get('password')!;
    if (control.errors?.['required']) {
      return 'Password is required.';
    }
    if (control.errors?.['minlength']) {
      return 'Password must be at least 8 characters.';
    }
    if (control.errors?.['passwordPolicy']) {
      return 'Password must include at least one letter and one number.';
    }
    return '';
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
    const raw = this.form.getRawValue();
    this.authApi
      .register({
        name: raw.name,
        email: raw.email,
        password: raw.password,
        password_confirmation: raw.password_confirmation,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (envelope) => {
          this.authState.applyUser(envelope.data.user);
          // New Student is authenticated as PENDING/unverified → verify-email.
          this.destination.navigateToAuthenticatedDestination();
        },
        error: (err) => {
          this.submitting = false;
          const validation = extractValidationErrors(err);
          if (validation) {
            this.serverErrors = validation;
          } else if (isThrottled(err)) {
            this.formError = 'Too many attempts. Please try again later.';
          } else {
            this.formError = genericFailureMessage();
          }
        },
      });
  }
}

function matchPasswords(primary: string, match: string): ValidatorFn {
  return (group: AbstractControl) => {
    const a = group.get(primary)?.value as string | undefined;
    const b = group.get(match)?.value as string | undefined;
    if (a && b && a !== b) {
      return { passwordsMismatch: true };
    }
    return null;
  };
}

function passwordPolicy(control: AbstractControl): { passwordPolicy: true } | null {
  const value: string = typeof control.value === 'string' ? control.value : '';
  if (value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return { passwordPolicy: true };
  }
  return null;
}
