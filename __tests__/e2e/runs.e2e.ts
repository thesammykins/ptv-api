import { describe, it, expect } from "vitest";
import {
  hasCredentials,
  createClient,
  TRAIN_ROUTE_TYPE,
} from "./setup.js";

describe.skipIf(!hasCredentials)("runs e2e", () => {
  const client = createClient();

  it("returns runs for a train route", async () => {
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const result = await client.runs(routeId, TRAIN_ROUTE_TYPE);
    expect(result.runs).toBeInstanceOf(Array);
    // During service hours there should be runs
    for (const run of result.runs.slice(0, 5)) {
      expect(typeof run.run_id).toBe("number");
      expect(typeof run.route_id).toBe("number");
      expect(typeof run.run_ref).toBe("string");
    }
  });

  it("supports expand parameter for vehicle position", async () => {
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const result = await client.runs(routeId, TRAIN_ROUTE_TYPE, {
      expand: ["VehiclePosition"],
    });
    expect(result.runs).toBeInstanceOf(Array);
  });

  it("returns run by reference", async () => {
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const runsResult = await client.runs(routeId, TRAIN_ROUTE_TYPE);
    const runRef = runsResult.runs[0].run_ref;

    const result = await client.runByRef(runRef);
    expect(result.runs).toBeInstanceOf(Array);
    expect(result.runs.length).toBeGreaterThan(0);
    expect(result.runs[0].run_ref).toBe(runRef);
  });

  it("returns run by reference and route type", async () => {
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const runsResult = await client.runs(routeId, TRAIN_ROUTE_TYPE);
    const runRef = runsResult.runs[0].run_ref;

    const result = await client.runByRefAndType(runRef, TRAIN_ROUTE_TYPE);
    expect(result.run).toBeDefined();
    expect(result.run.run_ref).toBe(runRef);
    expect(result.run.route_type).toBe(TRAIN_ROUTE_TYPE);
  });

  it("returns runs for route without specifying route type", async () => {
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const result = await client.runsForRoute(routeId);
    expect(result.runs).toBeInstanceOf(Array);
    expect(result.runs.length).toBeGreaterThan(0);
    for (const run of result.runs.slice(0, 5)) {
      expect(typeof run.run_id).toBe("number");
      expect(typeof run.route_id).toBe("number");
      expect(run.route_id).toBe(routeId);
    }
  });
});
