import { Routes } from '@angular/router';

import { AppShell } from './app-shell';
import { LoginPage } from './auth/login-page';
import { RegisterPage } from './auth/register-page';
import { VerifyEmailSuccess } from './auth/verify-email-success';
import { VerifyEmailPage } from './auth/restricted/verify-email-page';
import { PendingPage } from './auth/restricted/pending-page';
import { SuspendedPage } from './auth/restricted/suspended-page';
import { RejectedPage } from './auth/restricted/rejected-page';
import { AnomalyPage } from './auth/restricted/anomaly-page';
import {
  ANOMALY_PATH,
  PENDING_APPROVAL_PATH,
  REJECTED_PATH,
  SUSPENDED_PATH,
  VERIFY_EMAIL_PATH,
} from './core/auth/auth-destination.service';
import {
  applicationAccessGuard,
  guestOnlyGuard,
  restrictedStateGuard,
} from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  { path: 'auth/login', component: LoginPage, canActivate: [guestOnlyGuard] },
  { path: 'auth/register', component: RegisterPage, canActivate: [guestOnlyGuard] },

  // Preserved public landing after the signed verification callback.
  { path: 'auth/verify-email/success', component: VerifyEmailSuccess },

  {
    path: 'account/verify-email',
    component: VerifyEmailPage,
    canActivate: [restrictedStateGuard(VERIFY_EMAIL_PATH)],
  },
  {
    path: 'account/pending',
    component: PendingPage,
    canActivate: [restrictedStateGuard(PENDING_APPROVAL_PATH)],
  },
  {
    path: 'account/suspended',
    component: SuspendedPage,
    canActivate: [restrictedStateGuard(SUSPENDED_PATH)],
  },
  {
    path: 'account/rejected',
    component: RejectedPage,
    canActivate: [restrictedStateGuard(REJECTED_PATH)],
  },
  {
    path: 'account/anomaly',
    component: AnomalyPage,
    canActivate: [restrictedStateGuard(ANOMALY_PATH)],
  },

  {
    path: 'app',
    component: AppShell,
    canActivate: [applicationAccessGuard],
  },

  { path: '**', redirectTo: 'auth/login' },
];
