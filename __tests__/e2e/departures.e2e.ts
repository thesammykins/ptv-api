import { describe, it, expect } from "vitest";
import {
  hasCredentials,
  createClient,
  FLINDERS_STOP_ID,
  TRAIN_ROUTE_TYPE,
  INVALID_STOP_ID,
} from "./setup.js";

describe.skipIf(!hasCredentials)("departures e2e", () => {
  const client = createClient();

  it("returns departures for Flinders Street Station", async () => {
    const result = await client.departures(TRAIN_ROUTE_TYPE, FLINDERS_STOP_ID);
    expect(result.departures).toBeInstanceOf(Array);
    for (const dep of result.departures.slice(0, 5)) {
      expect(typeof dep.stop_id).toBe("number");
      expect(typeof dep.route_id).toBe("number");
      expect(typeof dep.run_id).toBe("number");
      expect(typeof dep.direction_id).toBe("number");
      expect(typeof dep.scheduled_departure_utc).toBe("string");
    }
  });

  it("returns departures with max_results param set", async () => {
    const result = await client.departures(TRAIN_ROUTE_TYPE, FLINDERS_STOP_ID, {
      max_results: 3,
    });
    expect(result.departures).toBeInstanceOf(Array);
    // PTV may not strictly enforce max_results, just verify it doesn't error
  });

  it("supports expand parameter", async () => {
    const result = await client.departures(TRAIN_ROUTE_TYPE, FLINDERS_STOP_ID, {
      max_results: 1,
      expand: ["stop", "route"],
    });
    // Expand maps exist and are objects (may be empty)
    expect(typeof result.stops).toBe("object");
    expect(typeof result.routes).toBe("object");
  });

  it("handles invalid stop_id without crashing", async () => {
    try {
      const result = await client.departures(TRAIN_ROUTE_TYPE, INVALID_STOP_ID);
      // Some invalid IDs return empty departures rather than 404
      expect(result.departures).toBeInstanceOf(Array);
    } catch (error: unknown) {
      // A 4xx error is also acceptable
      expect(error).toBeDefined();
    }
  });
});
