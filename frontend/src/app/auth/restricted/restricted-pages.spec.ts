import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { provideApiHttp } from '../../core/http/api-http.providers';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { VerifyEmailPage } from './verify-email-page';
import { SuspendedPage } from './suspended-page';
import { RejectedPage } from './rejected-page';

async function flushCsrf(httpTesting: HttpTestingController): Promise<void> {
  httpTesting.expectOne('/sanctum/csrf-cookie').flush(null, { status: 204, statusText: 'No Content' });
  await new Promise((resolve) => setTimeout(resolve));
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
}

describe('Restricted experiences', () => {
  let httpTesting: HttpTestingController;
  let authState: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideHttpClientTesting(), provideRouter([])],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  describe('logout', () => {
    function mountLogout<T>(componentType: new () => T): ComponentFixture<T> {
      const fixture = TestBed.createComponent(componentType);
      fixture.detectChanges();
      return fixture;
    }

    it('clears state to guest and returns to the login destination', async () => {
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const fixture = mountLogout(SuspendedPage);
      (fixture.componentInstance as { onLogout(): void }).onLogout();

      await flushCsrf(httpTesting);
      httpTesting.expectOne('/api/auth/logout').flush(null);
      await settle();

      expect(authState.isGuest()).toBe(true);
      expect(authState.user()).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('a restricted page exposes no application shell navigation', () => {
      const fixture = mountLogout(SuspendedPage);
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('suspended');
      expect(text).not.toContain('/app');
    });
  });

  describe('verification resend', () => {
    let fixture: ComponentFixture<VerifyEmailPage>;
    let component: VerifyEmailPage;

    beforeEach(() => {
      fixture = TestBed.createComponent(VerifyEmailPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('uses the canonical CSRF-safe mutation path and shows an acknowledgement', async () => {
      component.onResend();
      await flushCsrf(httpTesting);
      httpTesting
        .expectOne('/api/auth/email/verification-notification')
        .flush({ message: 'Verification email sent.' }, { status: 202, statusText: 'Accepted' });

      expect(component.resendMessage).toContain('verification email');
      expect(component.resendError).toBeNull();
    });

    it('handles throttling without leaking internal state', async () => {
      component.onResend();
      await flushCsrf(httpTesting);
      httpTesting
        .expectOne('/api/auth/email/verification-notification')
        .flush({ message: 'Too many verification notification attempts.' }, { status: 429, statusText: 'Too Many Requests' });

      expect(component.resendError).toBe('Too many requests. Please try again later.');
      expect(component.resendMessage).toBeNull();
    });

    it('does not implement the signed verification resume flow yet', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Resend verification email');
      expect(text).toContain('Sign out');
      expect(text).not.toContain('resume');
    });
  });

  describe('rejected experience', () => {
    it('renders only a generic message and never an internal rejection reason', () => {
      const fixture = TestBed.createComponent(RejectedPage);
      fixture.detectChanges();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('registration could not be completed');
      expect(text).not.toContain('reason');
      expect(text).not.toContain('rejection');
      expect(text).not.toContain('Please re-register');
    });
  });
});
