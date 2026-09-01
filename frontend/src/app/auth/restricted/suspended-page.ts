import { Component, inject } from '@angular/core';

import { AuthDestinationService } from '../../core/auth/auth-destination.service';

@Component({
  selector: 'app-suspended-page',
  template: `
    <main class="restricted-shell">
      <div class="restricted-card">
        <span class="badge" style="background: var(--color-danger-bg); color: var(--color-danger)">Account suspended</span>
        <h1>Your account is suspended</h1>
        <p>
          Your account has been suspended and is currently unable to access the
          application. If you believe this is a mistake, please contact support.
        </p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="onLogout()">Sign out</button>
        </div>
      </div>
    </main>
  `,
})
export class SuspendedPage {
  private readonly destination = inject(AuthDestinationService);

  onLogout(): void {
    this.destination.logout();
  }
}
