import { describe, it, expect } from "vitest";
import {
  hasCredentials,
  createClient,
  TRAIN_ROUTE_TYPE,
} from "./setup.js";

describe.skipIf(!hasCredentials)("stops e2e", () => {
  const client = createClient();

  it("returns stops nearby a location (Melbourne CBD)", async () => {
    // Flinders St coordinates
    const result = await client.stopsNearby(-37.8183, 144.9671, {
      route_types: [TRAIN_ROUTE_TYPE],
      max_results: 5,
    });
    expect(result.stops).toBeInstanceOf(Array);
    expect(result.stops.length).toBeGreaterThan(0);
    for (const stop of result.stops) {
      expect(typeof stop.stop_id).toBe("number");
      expect(typeof stop.stop_name).toBe("string");
    }
  });

  it("returns stops on a route", async () => {
    // First get a train route ID
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const result = await client.stopsOnRoute(routeId, TRAIN_ROUTE_TYPE);
    expect(result.stops).toBeInstanceOf(Array);
    expect(result.stops.length).toBeGreaterThan(0);
    for (const stop of result.stops) {
      expect(typeof stop.stop_id).toBe("number");
      expect(typeof stop.stop_name).toBe("string");
    }
  });
});
