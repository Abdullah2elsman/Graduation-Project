import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideApiHttp } from './core/http/api-http.providers';
import { provideAuthSession } from './core/auth/auth.providers';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideApiHttp(),
    provideAuthSession(),
  ],
};
