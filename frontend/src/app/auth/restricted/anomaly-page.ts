import { Component, inject } from '@angular/core';

import { AuthDestinationService } from '../../core/auth/auth-destination.service';

@Component({
  selector: 'app-anomaly-page',
  template: `
    <main class="restricted-shell">
      <div class="restricted-card">
        <span class="badge" style="background: var(--color-danger-bg); color: var(--color-danger)">Account unavailable</span>
        <h1>Your account is temporarily unavailable</h1>
        <p>
          There is an issue with your account that must be resolved before you can
          access the application.
        </p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="onLogout()">Sign out</button>
        </div>
      </div>
    </main>
  `,
})
export class AnomalyPage {
  private readonly destination = inject(AuthDestinationService);

  onLogout(): void {
    this.destination.logout();
  }
}
