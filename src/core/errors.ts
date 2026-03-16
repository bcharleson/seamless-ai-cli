export class SeamlessError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'SeamlessError';
  }
}

export class AuthError extends SeamlessError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends SeamlessError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends SeamlessError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends SeamlessError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends SeamlessError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'ServerError';
  }
}

export class CreditsError extends SeamlessError {
  constructor(message: string) {
    super(message, 'INSUFFICIENT_CREDITS', 402);
    this.name = 'CreditsError';
  }
}

export function formatError(error: unknown): { message: string; code: string } {
  if (error instanceof SeamlessError) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError' || String(error.message).includes('aborted')) {
      return { message: 'Request timed out — the API did not respond in time', code: 'TIMEOUT' };
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return { message: `Network error: ${error.message}`, code: 'NETWORK_ERROR' };
    }
    return { message: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: String(error), code: 'UNKNOWN_ERROR' };
}
