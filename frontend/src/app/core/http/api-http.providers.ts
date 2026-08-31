import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import {
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

const includeCredentials: HttpInterceptorFn = (request, next) =>
  next(request.clone({ withCredentials: true }));

export function provideApiHttp(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_BASE_URL, useValue: '' },
    provideHttpClient(
      withInterceptors([includeCredentials]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
  ]);
}
