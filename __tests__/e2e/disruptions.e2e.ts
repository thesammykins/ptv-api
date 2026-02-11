import { describe, it, expect } from "vitest";
import {
  hasCredentials,
  createClient,
  FLINDERS_STOP_ID,
  TRAIN_ROUTE_TYPE,
} from "./setup.js";

describe.skipIf(!hasCredentials)("disruptions e2e", () => {
  const client = createClient();

  it("returns disruptions (may be empty)", async () => {
    const result = await client.disruptions();
    expect(result.disruptions).toBeDefined();
    expect(typeof result.disruptions).toBe("object");
  });

  it("filters disruptions by route type", async () => {
    const result = await client.disruptions({
      route_types: [TRAIN_ROUTE_TYPE],
    });
    expect(result.disruptions).toBeDefined();
    expect(typeof result.disruptions).toBe("object");
  });

  it("returns disruptions for a route", async () => {
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const result = await client.disruptionsForRoute(routeId);
    expect(result.disruptions).toBeDefined();
    expect(typeof result.disruptions).toBe("object");
  });

  it("returns disruptions for a stop", async () => {
    const result = await client.disruptionsForStop(FLINDERS_STOP_ID);
    expect(result.disruptions).toBeDefined();
    expect(typeof result.disruptions).toBe("object");
  });
});
