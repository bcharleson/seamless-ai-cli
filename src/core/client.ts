import type { SeamlessClient as ISeamlessClient } from './types.js';
import {
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  CreditsError,
  SeamlessError,
} from './errors.js';

// Seamless.ai rate limit: ~100 req / 60s per endpoint
const BASE_URL = 'https://api.seamless.ai/api/client/v1';
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30_000;
const WRITE_TIMEOUT = 20_000;
const VERSION = '0.1.3';

interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

export class SeamlessClient implements ISeamlessClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? BASE_URL;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.timeout = options.timeout ?? REQUEST_TIMEOUT;
  }

  async request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    query?: Record<string, string | number | boolean | string[] | undefined>;
    body?: unknown;
  }): Promise<T> {
    const url = new URL(this.baseUrl + options.path);

    // Append scalar query params; skip arrays (handled separately)
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
          // Seamless uses bracket notation: requestIds[]=a&requestIds[]=b
          for (const item of value) {
            url.searchParams.append(`${key}[]`, String(item));
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      // Seamless.ai uses Token header (not Bearer)
      Token: this.apiKey,
      'User-Agent': `seamless-ai-cli/${VERSION}`,
      Accept: 'application/json',
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError: Error | undefined;
    const isWrite = options.method !== 'GET';
    const effectiveTimeout = isWrite ? Math.min(this.timeout, WRITE_TIMEOUT) : this.timeout;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

        const response = await fetch(url.toString(), {
          method: options.method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          if (!text) return undefined as T;
          return JSON.parse(text) as T;
        }

        const errorBody = await response.text().catch(() => '');
        let errorMessage: string;
        try {
          const parsed = JSON.parse(errorBody);
          errorMessage =
            parsed.message ||
            parsed.error ||
            parsed.errors?.join(', ') ||
            errorBody;
        } catch {
          errorMessage = errorBody || response.statusText;
        }

        switch (response.status) {
          case 401:
          case 403:
            throw new AuthError(
              errorMessage || 'Invalid or missing API key. Run: seamless login',
            );
          case 402:
            throw new CreditsError(
              errorMessage || 'Insufficient Seamless.ai credits to complete this request.',
            );
          case 404:
            throw new NotFoundError(errorMessage);
          case 400:
          case 422:
            throw new ValidationError(errorMessage);
          case 429: {
            // Rate limit: X-RateLimit-Reset is an epoch timestamp
            const resetEpoch = parseInt(
              response.headers.get('X-RateLimit-Reset') ?? '',
              10,
            );
            const retryAfterHeader = parseInt(
              response.headers.get('Retry-After') ?? '',
              10,
            );
            const delayMs = !isNaN(retryAfterHeader)
              ? retryAfterHeader * 1000
              : !isNaN(resetEpoch)
                ? Math.max(0, resetEpoch * 1000 - Date.now())
                : Math.min(1000 * Math.pow(2, attempt), 60_000);
            const err = new RateLimitError(
              errorMessage || 'Rate limit exceeded (100 req/60s)',
              Math.ceil(delayMs / 1000),
            );
            if (attempt < this.maxRetries) {
              await sleep(delayMs);
              lastError = err;
              continue;
            }
            throw err;
          }
          default:
            if (response.status >= 500) {
              const err = new ServerError(errorMessage, response.status);
              if (attempt < this.maxRetries) {
                await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
                lastError = err;
                continue;
              }
              throw err;
            }
            throw new SeamlessError(errorMessage, 'API_ERROR', response.status);
        }
      } catch (error) {
        if (error instanceof SeamlessError) throw error;

        const isAbort =
          error instanceof Error &&
          (error.name === 'AbortError' || String(error.message).includes('aborted'));

        if (isAbort) {
          lastError = new SeamlessError(
            `Request timed out after ${effectiveTimeout / 1000}s: ${options.method} ${options.path}`,
            'TIMEOUT',
          );
          if (!isWrite && attempt < this.maxRetries) {
            await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
            continue;
          }
          throw lastError;
        }

        if (error instanceof TypeError && String(error.message).includes('fetch')) {
          throw new SeamlessError(`Network error: ${error.message}`, 'NETWORK_ERROR');
        }

        throw error;
      }
    }

    throw lastError ?? new SeamlessError('Request failed after retries', 'MAX_RETRIES');
  }

  async get<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'POST', path, query, body });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
