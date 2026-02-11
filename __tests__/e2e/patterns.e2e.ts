import { describe, it, expect } from "vitest";
import {
  hasCredentials,
  createClient,
  TRAIN_ROUTE_TYPE,
} from "./setup.js";

describe.skipIf(!hasCredentials)("patterns e2e", () => {
  const client = createClient();

  it("returns stopping pattern for a run", async () => {
    // Get a train route first
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    // Get runs for that route
    const runsResult = await client.runs(routeId, TRAIN_ROUTE_TYPE);
    expect(runsResult.runs.length).toBeGreaterThan(0);

    const runRef = runsResult.runs[0].run_ref;

    // Fetch stopping pattern
    const result = await client.stoppingPattern(runRef, TRAIN_ROUTE_TYPE);
    expect(result.departures).toBeInstanceOf(Array);
    expect(result.stops).toBeDefined();
    expect(result.routes).toBeDefined();
  });

  it("supports expand options for stop and route details", async () => {
    // Get a train route first
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    // Get runs for that route
    const runsResult = await client.runs(routeId, TRAIN_ROUTE_TYPE);
    const runRef = runsResult.runs[0].run_ref;

    // Fetch with expand options
    const result = await client.stoppingPattern(runRef, TRAIN_ROUTE_TYPE, {
      expand: ["stop", "route"],
    });
    expect(result.departures).toBeInstanceOf(Array);
    expect(result.stops).toBeDefined();
    expect(result.routes).toBeDefined();
  });
});
