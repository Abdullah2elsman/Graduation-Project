import { Component, inject } from '@angular/core';

import { AuthDestinationService } from './core/auth/auth-destination.service';
import { AuthStateService } from './core/auth/auth-state.service';

@Component({
  selector: 'app-shell',
  template: `
    <main class="restricted-shell">
      <div class="restricted-card">
        <span class="badge" style="background: var(--color-success-bg); color: var(--color-success-text)">Signed in</span>
        <h1>Welcome{{ name ? ', ' + name : '' }}</h1>
        <p>
          You&rsquo;re signed in and your account is active. The application
          workspace will be available here.
        </p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="onLogout()">Sign out</button>
        </div>
      </div>
    </main>
  `,
})
export class AppShell {
  private readonly destination = inject(AuthDestinationService);
  private readonly authState = inject(AuthStateService);

  get name(): string {
    return this.authState.user()?.name ?? '';
  }

  onLogout(): void {
    this.destination.logout();
  }
}
