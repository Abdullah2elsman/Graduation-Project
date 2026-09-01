import { HttpErrorResponse } from '@angular/common/http';

export type FieldErrors = Record<string, string>;

/**
 * Extracts per-field validation messages from a Laravel 422 response of the
 * form `{ message, errors: { field: string[] } }`. Returns null when the error
 * is not a validation response.
 */
export function extractValidationErrors(error: unknown): FieldErrors | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 422) {
    return null;
  }
  const body = error.error as { errors?: Record<string, unknown> } | null;
  if (!body || typeof body.errors !== 'object' || body.errors === null) {
    return null;
  }
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(body.errors)) {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (typeof first === 'string') {
      result[field] = first;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** True when the response is a throttling 429. */
export function isThrottled(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 429;
}

/** A safe, generic message for unexpected/network/server failures. */
export function genericFailureMessage(): string {
  return 'Something went wrong. Please try again.';
}
