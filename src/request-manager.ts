import {
  PTVNetworkError,
  PTVRateLimitError,
  PTVServerError,
  PTVTimeoutError,
} from "./errors.js";

interface PendingRequest {
  promise: Promise<Response>;
  controller: AbortController;
}

export interface RequestManagerOptions {
  minInterval?: number;
  maxBackoff?: number;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
}

export class RequestManager {
  private inFlight = new Map<string, PendingRequest>();
  private lastRequestTime = 0;
  private backoffMs = 0;
  private readonly minInterval: number;
  private readonly maxBackoff: number;
  private readonly timeout: number;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(options: RequestManagerOptions = {}) {
    this.minInterval = options.minInterval ?? 200;
    this.maxBackoff = options.maxBackoff ?? 60_000;
    this.timeout = options.timeout ?? 10_000;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async execute(url: string, endpoint: string): Promise<Response> {
    const existing = this.inFlight.get(url);
    if (existing) return existing.promise.then((r) => r.clone());

    const request = this.doRequest(url, endpoint);
    this.inFlight.set(url, request);

    try {
      return await request.promise;
    } finally {
      this.inFlight.delete(url);
    }
  }

  private doRequest(
    url: string,
    endpoint: string,
  ): PendingRequest {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const promise = this.waitForThrottle()
      .then(() =>
        this.fetchFn(url, { signal: controller.signal }),
      )
      .then((response) => {
        clearTimeout(timeoutId);
        this.lastRequestTime = Date.now();

        if (response.status === 429) {
          this.applyBackoff();
          throw new PTVRateLimitError(endpoint);
        }
        if (response.status >= 500) {
          this.applyBackoff();
          throw new PTVServerError(response.status, endpoint);
        }

        this.backoffMs = 0;
        return response;
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        if (error instanceof PTVRateLimitError) throw error;
        if (error instanceof PTVServerError) throw error;

        if (error instanceof DOMException && error.name === "AbortError") {
          throw new PTVTimeoutError(endpoint, this.timeout);
        }

        if (error instanceof TypeError) {
          throw new PTVNetworkError(endpoint, error);
        }

        throw error;
      });

    return { promise, controller };
  }

  private async waitForThrottle(): Promise<void> {
    const totalDelay = this.minInterval + this.backoffMs;
    const elapsed = Date.now() - this.lastRequestTime;
    const remaining = totalDelay - elapsed;

    if (remaining > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, remaining));
    }
  }

  private applyBackoff(): void {
    this.backoffMs = this.backoffMs === 0
      ? 1_000
      : Math.min(this.backoffMs * 2, this.maxBackoff);
  }

  get currentBackoff(): number {
    return this.backoffMs;
  }

  resetBackoff(): void {
    this.backoffMs = 0;
  }
}
