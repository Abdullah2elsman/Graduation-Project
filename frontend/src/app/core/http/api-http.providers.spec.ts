import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, provideApiHttp } from './api-http.providers';

describe('provideApiHttp', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApiHttp(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  });

  it('uses relative browser-facing API URLs', () => {
    expect(TestBed.inject(API_BASE_URL)).toBe('');
  });

  it('adds credentials centrally to HTTP requests', () => {
    http.get('/api/health').subscribe();

    const request = httpTesting.expectOne('/api/health');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ service: 'smart-book-api', status: 'ok' });
  });

  it('copies the XSRF cookie into the header for relative mutation requests', () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/';

    http.post('/api/foundation-proof', {}).subscribe();

    const request = httpTesting.expectOne('/api/foundation-proof');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    request.flush(null);
  });
});
