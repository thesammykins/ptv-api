import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RequestManager } from "../../src/request-manager.js";
import {
  PTVRateLimitError,
  PTVServerError,
  PTVTimeoutError,
  PTVNetworkError,
} from "../../src/errors.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("RequestManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("deduplication", () => {
    it("returns same promise for same URL while in-flight", async () => {
      let resolveRequest!: (r: Response) => void;
      const fetchFn = vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          }),
      );

      const rm = new RequestManager({ minInterval: 0, fetch: fetchFn });

      const p1 = rm.execute("http://test.com/a", "/v3/a");
      // Let the throttle (0ms) resolve so fetch fires
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      const p2 = rm.execute("http://test.com/a", "/v3/a");
      // p2 should reuse the same in-flight promise, no new fetch
      expect(fetchFn).toHaveBeenCalledTimes(1);

      resolveRequest(jsonResponse({ ok: true }));
      const [r1, r2] = await Promise.all([p1, p2]);
      // Dedup returns a clone so both callers can consume the body independently
      expect(r1).not.toBe(r2);
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      const [b1, b2] = await Promise.all([r1.json(), r2.json()]);
      expect(b1).toStrictEqual(b2);
    });

    it("makes separate requests for different URLs", async () => {
      const fetchFn = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
      const rm = new RequestManager({ minInterval: 0, fetch: fetchFn });

      await rm.execute("http://test.com/a", "/v3/a");
      await rm.execute("http://test.com/b", "/v3/b");

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it("allows new request after previous completes", async () => {
      const fetchFn = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
      const rm = new RequestManager({ minInterval: 0, fetch: fetchFn });

      await rm.execute("http://test.com/a", "/v3/a");
      await rm.execute("http://test.com/a", "/v3/a");

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("throttle", () => {
    it("delays request if called within minInterval", async () => {
      const fetchFn = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
      const rm = new RequestManager({ minInterval: 200, fetch: fetchFn });

      // First request — no delay
      const p1 = rm.execute("http://test.com/1", "/v3/1");
      await vi.advanceTimersByTimeAsync(0);
      await p1;

      // Second request immediately after — should wait ~200ms
      const p2 = rm.execute("http://test.com/2", "/v3/2");

      // fetch shouldn't be called yet for second request
      expect(fetchFn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      await p2;

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("backoff", () => {
    it("applies exponential backoff on 429", async () => {
      const fetchFn = vi.fn(() =>
        Promise.resolve(jsonResponse({ error: "rate limited" }, 429)),
      );
      const rm = new RequestManager({
        minInterval: 0,
        maxBackoff: 60_000,
        fetch: fetchFn,
      });

      await expect(
        rm.execute("http://test.com/1", "/v3/1"),
      ).rejects.toBeInstanceOf(PTVRateLimitError);

      expect(rm.currentBackoff).toBe(1_000);
    });

    it("applies exponential backoff on 500+", async () => {
      const fetchFn = vi.fn(() =>
        Promise.resolve(jsonResponse({ error: "server error" }, 502)),
      );
      const rm = new RequestManager({
        minInterval: 0,
        maxBackoff: 60_000,
        fetch: fetchFn,
      });

      await expect(
        rm.execute("http://test.com/1", "/v3/1"),
      ).rejects.toBeInstanceOf(PTVServerError);

      expect(rm.currentBackoff).toBe(1_000);
    });

    it("doubles backoff on consecutive errors", async () => {
      const fetchFn = vi.fn(() => Promise.resolve(jsonResponse({}, 429)));

      const rm = new RequestManager({
        minInterval: 0,
        maxBackoff: 60_000,
        fetch: fetchFn,
      });

      // First failure: backoff = 1000
      await expect(
        rm.execute("http://test.com/1", "/v3/1"),
      ).rejects.toBeInstanceOf(PTVRateLimitError);
      expect(rm.currentBackoff).toBe(1_000);

      // Second failure: attach catch immediately, then advance timer
      const p2 = rm.execute("http://test.com/2", "/v3/2").catch((e) => e);
      await vi.advanceTimersByTimeAsync(1_200);
      const err = await p2;
      expect(err).toBeInstanceOf(PTVRateLimitError);
      expect(rm.currentBackoff).toBe(2_000);
    });

    it("caps backoff at maxBackoff", () => {
      const rm = new RequestManager({ maxBackoff: 4_000 });
      // Manually trigger repeated backoff via reflection
      for (let i = 0; i < 20; i++) {
        (rm as unknown as { applyBackoff: () => void }).applyBackoff();
      }
      expect(rm.currentBackoff).toBeLessThanOrEqual(4_000);
    });

    it("resets backoff on success", async () => {
      let call = 0;
      const fetchFn = vi.fn(() => {
        call++;
        if (call === 1) return Promise.resolve(jsonResponse({}, 429));
        return Promise.resolve(jsonResponse({ ok: true }));
      });

      const rm = new RequestManager({ minInterval: 0, fetch: fetchFn });

      // First: 429
      await expect(
        rm.execute("http://test.com/1", "/v3/1"),
      ).rejects.toBeInstanceOf(PTVRateLimitError);
      expect(rm.currentBackoff).toBe(1_000);

      // Second: 200 — should reset backoff after delay
      const p = rm.execute("http://test.com/2", "/v3/2");
      await vi.advanceTimersByTimeAsync(1_200);
      await p;
      expect(rm.currentBackoff).toBe(0);
    });
  });

  describe("timeout", () => {
    it("throws PTVTimeoutError when request exceeds timeout", async () => {
      const fetchFn = vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          }),
      );

      const rm = new RequestManager({
        minInterval: 0,
        timeout: 5_000,
        fetch: fetchFn,
      });

      // Attach catch immediately to prevent unhandled rejection
      const promise = rm.execute("http://test.com/slow", "/v3/slow").catch((e) => e);
      await vi.advanceTimersByTimeAsync(5_100);
      const err = await promise;
      expect(err).toBeInstanceOf(PTVTimeoutError);
    });
  });

  describe("network errors", () => {
    it("throws PTVNetworkError on TypeError (fetch failure)", async () => {
      const fetchFn = vi.fn(() =>
        Promise.reject(new TypeError("Failed to fetch")),
      );
      const rm = new RequestManager({ minInterval: 0, fetch: fetchFn });

      await expect(
        rm.execute("http://test.com/1", "/v3/1"),
      ).rejects.toBeInstanceOf(PTVNetworkError);
    });

    it("re-throws unknown errors", async () => {
      const fetchFn = vi.fn(() =>
        Promise.reject(new RangeError("unexpected")),
      );
      const rm = new RequestManager({ minInterval: 0, fetch: fetchFn });

      await expect(
        rm.execute("http://test.com/1", "/v3/1"),
      ).rejects.toBeInstanceOf(RangeError);
    });
  });

  describe("resetBackoff", () => {
    it("manually resets backoff to 0", async () => {
      const fetchFn = vi.fn(() =>
        Promise.resolve(jsonResponse({}, 429)),
      );
      const rm = new RequestManager({ minInterval: 0, fetch: fetchFn });

      await expect(
        rm.execute("http://test.com/1", "/v3/1"),
      ).rejects.toBeInstanceOf(PTVRateLimitError);
      expect(rm.currentBackoff).toBe(1_000);

      rm.resetBackoff();
      expect(rm.currentBackoff).toBe(0);
    });
  });
});
