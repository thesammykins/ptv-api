import { describe, it, expect } from "vitest";
import { hasCredentials, createClient } from "./setup.js";

describe.skipIf(!hasCredentials)("route-types e2e", () => {
  const client = createClient();

  it("returns a non-empty route_types array", async () => {
    const result = await client.routeTypes();
    expect(result.route_types).toBeInstanceOf(Array);
    expect(result.route_types.length).toBeGreaterThan(0);
  });

  it("each route type has required fields", async () => {
    const result = await client.routeTypes();
    for (const rt of result.route_types) {
      expect(typeof rt.route_type_name).toBe("string");
      expect(typeof rt.route_type).toBe("number");
    }
  });
});
