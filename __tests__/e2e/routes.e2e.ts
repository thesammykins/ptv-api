import { describe, it, expect } from "vitest";
import { hasCredentials, createClient, TRAIN_ROUTE_TYPE } from "./setup.js";

describe.skipIf(!hasCredentials)("routes e2e", () => {
  const client = createClient();

  it("returns routes filtered by route type", async () => {
    const result = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    expect(result.routes).toBeInstanceOf(Array);
    expect(result.routes.length).toBeGreaterThan(0);
    for (const route of result.routes) {
      expect(typeof route.route_id).toBe("number");
      expect(typeof route.route_name).toBe("string");
      expect(route.route_type).toBe(TRAIN_ROUTE_TYPE);
    }
  });

  it("fetches a single route by ID", async () => {
    const list = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = list.routes[0].route_id;

    const result = await client.route(routeId);
    expect(result.route).toBeDefined();
    expect(typeof result.route.route_id).toBe("number");
    expect(typeof result.route.route_name).toBe("string");
  });
});
