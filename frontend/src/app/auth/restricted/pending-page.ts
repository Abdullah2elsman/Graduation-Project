import { Component, inject } from '@angular/core';

import { AuthDestinationService } from '../../core/auth/auth-destination.service';

@Component({
  selector: 'app-pending-page',
  template: `
    <main class="restricted-shell">
      <div class="restricted-card">
        <span class="badge" style="background: var(--color-warning-bg); color: var(--color-warning-text)">Pending approval</span>
        <h1>Waiting for approval</h1>
        <p>
          Your email address has been verified successfully. An administrator
          still needs to approve your account before you can access the
          application.
        </p>
        <p>Please check back shortly. Refreshing this page will update your status.</p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="onLogout()">Sign out</button>
        </div>
      </div>
    </main>
  `,
})
export class PendingPage {
  private readonly destination = inject(AuthDestinationService);

  onLogout(): void {
    this.destination.logout();
  }
}
