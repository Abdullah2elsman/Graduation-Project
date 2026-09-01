import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

/**
 * Ensures Laravel Sanctum has issued the `XSRF-TOKEN` cookie before a
 * cookie-authenticated state-changing request.
 *
 * Angular HttpClient's XSRF configuration (from `provideApiHttp`) only *reads*
 * an existing `XSRF-TOKEN` cookie and copies it into `X-XSRF-TOKEN`; it does not
 * obtain that cookie. Sanctum issues it via `GET /sanctum/csrf-cookie`. This
 * service is the canonical bootstrap for that cookie, using the existing
 * shared HttpClient (withCredentials included). No token is parsed or stored,
 * and the configured interceptor remains responsible for sending the header.
 */
@Injectable({ providedIn: 'root' })
export class CsrfBootstrapService {
  private readonly http = inject(HttpClient);

  private inFlight: Promise<void> | null = null;

  /**
   * Requests the Sanctum CSRF cookie. Concurrent callers share a single
   * in-flight bootstrap so simultaneous auth mutations do not duplicate it.
   */
  ensureCookie(): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }
    this.inFlight = lastValueFrom(
      this.http.get('/sanctum/csrf-cookie', { responseType: 'text' }),
    )
      .then(() => undefined)
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }
}
