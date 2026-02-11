import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  buildQueryString,
  signRequest,
  buildSignedUrl,
} from "../../src/request.js";

describe("buildQueryString", () => {
  it("sorts keys alphabetically", () => {
    const qs = buildQueryString({ z_param: "1", a_param: "2" });
    expect(qs).toBe("a_param=2&z_param=1");
  });

  it("sorts array values and expands as repeated keys", () => {
    const qs = buildQueryString({ route_types: [2, 0, 1] });
    expect(qs).toBe("route_types=0&route_types=1&route_types=2");
  });

  it("encodes keys and values with encodeURIComponent", () => {
    const qs = buildQueryString({ "my key": "hello world" });
    expect(qs).toBe("my%20key=hello%20world");
  });

  it("converts numbers and booleans to strings", () => {
    const qs = buildQueryString({ count: 5, flag: true });
    expect(qs).toBe("count=5&flag=true");
  });

  it("skips null and undefined values", () => {
    const params = { a: "keep", b: null, c: undefined } as Record<
      string,
      string | null | undefined
    >;
    const qs = buildQueryString(params as never);
    expect(qs).toBe("a=keep");
  });

  it("returns empty string for empty params", () => {
    expect(buildQueryString({})).toBe("");
  });

  it("handles mixed scalar and array params sorted together", () => {
    const qs = buildQueryString({
      devid: "123",
      route_types: [1, 0],
      max_results: 5,
    });
    expect(qs).toBe("devid=123&max_results=5&route_types=0&route_types=1");
  });

  it("handles single-element arrays", () => {
    const qs = buildQueryString({ route_types: [2] });
    expect(qs).toBe("route_types=2");
  });
});

describe("signRequest", () => {
  it("produces uppercase hex HMAC-SHA1", () => {
    const path = "/v3/healthcheck";
    const qs = "timestamp=2024-01-01T00%3A00%3A00.000Z&devid=1234";
    const apiKey = "test-key-abc";

    const expected = createHmac("sha1", apiKey)
      .update(`${path}?${qs}`)
      .digest("hex")
      .toUpperCase();

    expect(signRequest(path, qs, apiKey)).toBe(expected);
  });

  it("signs path only when queryString is empty", () => {
    const path = "/v3/route_types";
    const apiKey = "my-key";

    const expected = createHmac("sha1", apiKey)
      .update(path)
      .digest("hex")
      .toUpperCase();

    expect(signRequest(path, "", apiKey)).toBe(expected);
  });

  it("returns exactly 40 hex characters", () => {
    const sig = signRequest("/v3/test", "a=1", "key");
    expect(sig).toMatch(/^[0-9A-F]{40}$/);
  });
});

describe("buildSignedUrl", () => {
  it("assembles base + path + queryString + signature", () => {
    const url = buildSignedUrl(
      "https://api.example.com",
      "/v3/healthcheck",
      { timestamp: "2024-01-01" },
      { devId: "1234", apiKey: "secret" },
    );

    expect(url).toContain("https://api.example.com/v3/healthcheck?");
    expect(url).toContain("devid=1234");
    expect(url).toContain("timestamp=2024-01-01");
    expect(url).toMatch(/&signature=[0-9A-F]{40}$/);
  });

  it("includes devid in query params before signing", () => {
    const url = buildSignedUrl(
      "https://api.example.com",
      "/v3/routes",
      { route_name: "test" },
      { devId: "999", apiKey: "key" },
    );

    // devid should be in the signed portion
    expect(url).toContain("devid=999");
    expect(url).toContain("route_name=test");
  });

  it("produces deterministic URLs for same inputs", () => {
    const params = { route_types: [1, 0], route_name: "Frankston" };
    const creds = { devId: "42", apiKey: "abc" };

    const url1 = buildSignedUrl("https://api.example.com", "/v3/routes", params, creds);
    const url2 = buildSignedUrl("https://api.example.com", "/v3/routes", params, creds);
    expect(url1).toBe(url2);
  });
});
