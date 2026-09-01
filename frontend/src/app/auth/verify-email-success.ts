import { Component } from '@angular/core';

@Component({
  selector: 'app-verify-email-success',
  template: `
    <main class="verify-success">
      <h1>Email verified</h1>
      <p>Your email address has been verified successfully.</p>
      <p class="pending-note">
        Your account is still waiting for administrator approval before you can
        access the application.
      </p>
    </main>
  `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
        'Segoe UI Symbol';
    }

    .verify-success {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      text-align: center;
    }

    h1 {
      margin: 0;
      color: #1f2937;
    }

    p {
      margin: 0;
      color: #4b5563;
    }

    .pending-note {
      margin-top: 0.5rem;
      color: #6b7280;
    }
  `,
})
export class VerifyEmailSuccess {}
