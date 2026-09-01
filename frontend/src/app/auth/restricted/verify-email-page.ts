import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthDestinationService } from '../../core/auth/auth-destination.service';
import { genericFailureMessage } from '../../core/auth/auth-errors';

@Component({
  selector: 'app-verify-email-page',
  template: `
    <main class="restricted-shell">
      <div class="restricted-card">
        <span class="badge" style="background: var(--color-info-bg); color: var(--color-info-text)">Action required</span>
        <h1>Verify your email</h1>
        <p>
          Before your account can be activated, please confirm your email address.
          We&rsquo;ve sent a verification link to your inbox.
        </p>

        @if (resendMessage) {
          <p class="notice notice-success" role="status">{{ resendMessage }}</p>
        }
        @if (resendError) {
          <p class="notice notice-error" role="alert">{{ resendError }}</p>
        }

        <div class="actions">
          <button
            type="button"
            class="btn"
            (click)="onResend()"
            [disabled]="resending"
          >
            {{ resending ? 'Sending…' : 'Resend verification email' }}
          </button>
          <button type="button" class="btn btn-ghost" (click)="onLogout()">Sign out</button>
        </div>
      </div>
    </main>
  `,
})
export class VerifyEmailPage {
  private readonly authApi = inject(AuthApiService);
  private readonly destination = inject(AuthDestinationService);
  private readonly destroyRef = inject(DestroyRef);

  resending = false;
  resendMessage: string | null = null;
  resendError: string | null = null;

  onResend(): void {
    if (this.resending) {
      return;
    }
    this.resending = true;
    this.resendMessage = null;
    this.resendError = null;

    this.authApi
      .resendVerificationNotification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resending = false;
          this.resendMessage = 'A verification email has been sent. Please check your inbox.';
        },
        error: (err: { status?: number }) => {
          this.resending = false;
          if (err?.status === 429) {
            this.resendError = 'Too many requests. Please try again later.';
          } else {
            this.resendError = genericFailureMessage();
          }
        },
      });
  }

  onLogout(): void {
    this.destination.logout();
  }
}
