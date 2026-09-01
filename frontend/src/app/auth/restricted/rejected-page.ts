import { Component, inject } from '@angular/core';

import { AuthDestinationService } from '../../core/auth/auth-destination.service';

@Component({
  selector: 'app-rejected-page',
  template: `
    <main class="restricted-shell">
      <div class="restricted-card">
        <span class="badge" style="background: var(--color-danger-bg); color: var(--color-danger)">Account rejected</span>
        <h1>Your account cannot be used</h1>
        <p>
          Your registration could not be completed, and this account is no longer
          able to access the application.
        </p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="onLogout()">Sign out</button>
        </div>
      </div>
    </main>
  `,
})
export class RejectedPage {
  private readonly destination = inject(AuthDestinationService);

  onLogout(): void {
    this.destination.logout();
  }
}
