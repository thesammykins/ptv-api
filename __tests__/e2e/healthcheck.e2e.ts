import { describe, it, expect } from "vitest";
import { hasCredentials, createClient } from "./setup.js";

describe.skipIf(!hasCredentials)("healthcheck e2e", () => {
  const client = createClient();

  it("returns status with health=1 (via route_types)", async () => {
    const result = await client.healthcheck();
    expect(result.status.health).toBe(1);
    expect(result.route_types.length).toBeGreaterThan(0);
  });
});
