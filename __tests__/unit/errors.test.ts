import { describe, it, expect } from "vitest";
import {
  PTVError,
  PTVAuthError,
  PTVNotFoundError,
  PTVRateLimitError,
  PTVServerError,
  PTVValidationError,
  PTVNetworkError,
  PTVTimeoutError,
  errorFromStatus,
} from "../../src/errors.js";

describe("PTVError", () => {
  it("sets name, statusCode, message", () => {
    const err = new PTVError("fail", 400, "/v3/test");
    expect(err.name).toBe("PTVError");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("fail");
    expect(err).toBeInstanceOf(Error);
  });

  it("strips query params from endpoint", () => {
    const err = new PTVError("fail", 400, "/v3/test?devid=123&signature=ABC");
    expect(err.endpoint).toBe("/v3/test");
  });

  it("redacts devid from message", () => {
    const err = new PTVError(
      "Error at /v3/test?devid=12345&other=1",
      400,
      "/v3/test",
    );
    expect(err.message).toContain("devid=[REDACTED]");
    expect(err.message).not.toContain("12345");
  });

  it("redacts signature from message", () => {
    const err = new PTVError(
      "Error at /v3/test?signature=ABCDEF1234",
      400,
      "/v3/test",
    );
    expect(err.message).toContain("signature=[REDACTED]");
    expect(err.message).not.toContain("ABCDEF1234");
  });

  it("redacts credentials from string responseBody", () => {
    const err = new PTVError("fail", 400, "/v3/test", "devid=secret&signature=secret2");
    expect(err.responseBody).toContain("devid=[REDACTED]");
    expect(err.responseBody).toContain("signature=[REDACTED]");
    expect(err.responseBody).not.toContain("secret");
  });

  it("redacts credentials from object responseBody", () => {
    const err = new PTVError("fail", 400, "/v3/test", {
      url: "/v3/test?devid=123&signature=ABC&other=1",
    });
    const body = err.responseBody as { url: string };
    expect(body.url).toContain("devid=[REDACTED]");
    expect(body.url).toContain("signature=[REDACTED]");
    expect(body.url).not.toContain("123");
    expect(body.url).not.toContain("ABC");
  });

  it("passes through non-object non-string responseBody", () => {
    const err = new PTVError("fail", 400, "/v3/test", 42);
    expect(err.responseBody).toBe(42);
  });

  it("passes through null responseBody", () => {
    const err = new PTVError("fail", 400, "/v3/test", null);
    expect(err.responseBody).toBe(null);
  });

  it("handles object responseBody that fails JSON round-trip", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const err = new PTVError("fail", 400, "/v3/test", circular);
    expect(err.responseBody).toBe(circular);
  });
});

describe("PTVAuthError", () => {
  it("has correct name and status 403", () => {
    const err = new PTVAuthError("/v3/test");
    expect(err.name).toBe("PTVAuthError");
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Authentication failed");
    expect(err).toBeInstanceOf(PTVError);
  });
});

describe("PTVNotFoundError", () => {
  it("has correct name and status 404", () => {
    const err = new PTVNotFoundError("/v3/test");
    expect(err.name).toBe("PTVNotFoundError");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Resource not found");
    expect(err).toBeInstanceOf(PTVError);
  });
});

describe("PTVRateLimitError", () => {
  it("has correct name and status 429", () => {
    const err = new PTVRateLimitError("/v3/test");
    expect(err.name).toBe("PTVRateLimitError");
    expect(err.statusCode).toBe(429);
    expect(err).toBeInstanceOf(PTVError);
  });
});

describe("PTVServerError", () => {
  it("includes status code in message", () => {
    const err = new PTVServerError(503, "/v3/test");
    expect(err.name).toBe("PTVServerError");
    expect(err.statusCode).toBe(503);
    expect(err.message).toBe("Server error (503)");
    expect(err).toBeInstanceOf(PTVError);
  });
});

describe("PTVValidationError", () => {
  it("stores zodErrors and has status 0", () => {
    const issues = [{ path: ["foo"], message: "invalid" }];
    const err = new PTVValidationError("/v3/test", issues, { foo: "bar" });
    expect(err.name).toBe("PTVValidationError");
    expect(err.statusCode).toBe(0);
    expect(err.zodErrors).toEqual(issues);
    expect(err.responseBody).toEqual({ foo: "bar" });
    expect(err).toBeInstanceOf(PTVError);
  });
});

describe("PTVNetworkError", () => {
  it("includes cause message and sets cause", () => {
    const cause = new TypeError("fetch failed");
    const err = new PTVNetworkError("/v3/test", cause);
    expect(err.name).toBe("PTVNetworkError");
    expect(err.statusCode).toBe(0);
    expect(err.message).toBe("Network error: fetch failed");
    expect(err.cause).toBe(cause);
    expect(err).toBeInstanceOf(PTVError);
  });

  it("handles missing cause", () => {
    const err = new PTVNetworkError("/v3/test");
    expect(err.message).toBe("Network error: unknown");
    expect(err.cause).toBeUndefined();
  });
});

describe("PTVTimeoutError", () => {
  it("includes timeout duration in message", () => {
    const err = new PTVTimeoutError("/v3/test", 10000);
    expect(err.name).toBe("PTVTimeoutError");
    expect(err.statusCode).toBe(0);
    expect(err.message).toBe("Request timed out after 10000ms");
    expect(err).toBeInstanceOf(PTVError);
  });
});

describe("errorFromStatus", () => {
  it("returns PTVAuthError for 401", () => {
    const err = errorFromStatus(401, "/v3/test");
    expect(err).toBeInstanceOf(PTVAuthError);
  });

  it("returns PTVAuthError for 403", () => {
    const err = errorFromStatus(403, "/v3/test");
    expect(err).toBeInstanceOf(PTVAuthError);
  });

  it("returns PTVNotFoundError for 404", () => {
    const err = errorFromStatus(404, "/v3/test");
    expect(err).toBeInstanceOf(PTVNotFoundError);
  });

  it("returns PTVRateLimitError for 429", () => {
    const err = errorFromStatus(429, "/v3/test");
    expect(err).toBeInstanceOf(PTVRateLimitError);
  });

  it("returns PTVServerError for 500", () => {
    const err = errorFromStatus(500, "/v3/test");
    expect(err).toBeInstanceOf(PTVServerError);
    expect(err.statusCode).toBe(500);
  });

  it("returns PTVServerError for 503", () => {
    const err = errorFromStatus(503, "/v3/test");
    expect(err).toBeInstanceOf(PTVServerError);
    expect(err.statusCode).toBe(503);
  });

  it("returns generic PTVError for unmatched status", () => {
    const err = errorFromStatus(418, "/v3/test", "I'm a teapot");
    expect(err).toBeInstanceOf(PTVError);
    expect(err.constructor).toBe(PTVError);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("HTTP 418");
    expect(err.responseBody).toBe("I'm a teapot");
  });

  it("passes responseBody to subclasses", () => {
    const body = { message: "bad request" };
    const err = errorFromStatus(404, "/v3/test", body);
    expect(err.responseBody).toEqual(body);
  });
});
