import { describe, it, expect } from "vitest";
import {
  hasCredentials,
  createClient,
  TRAIN_ROUTE_TYPE,
} from "./setup.js";

describe.skipIf(!hasCredentials)("directions e2e", () => {
  const client = createClient();

  it("returns directions for a train route", async () => {
    // First get a train route ID
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;

    const result = await client.directions(routeId);
    expect(result.directions).toBeInstanceOf(Array);
    expect(result.directions.length).toBeGreaterThan(0);
    for (const dir of result.directions) {
      expect(typeof dir.direction_id).toBe("number");
      expect(typeof dir.direction_name).toBe("string");
      expect(typeof dir.route_id).toBe("number");
    }
  });

  it("returns directions by direction_id", async () => {
    // First get a direction_id from an existing route
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;
    const directionsResult = await client.directions(routeId);
    const directionId = directionsResult.directions[0].direction_id;

    const result = await client.directionsById(directionId);
    expect(result.directions).toBeInstanceOf(Array);
    expect(result.directions.length).toBeGreaterThan(0);
    expect(result.directions[0].direction_id).toBe(directionId);
  });

  it("returns directions by direction_id filtered by route type", async () => {
    // First get a direction_id from a train route
    const routes = await client.routes({ route_types: [TRAIN_ROUTE_TYPE] });
    const routeId = routes.routes[0].route_id;
    const directionsResult = await client.directions(routeId);
    const directionId = directionsResult.directions[0].direction_id;

    const result = await client.directionsByIdAndType(directionId, TRAIN_ROUTE_TYPE);
    expect(result.directions).toBeInstanceOf(Array);
    expect(result.directions.length).toBeGreaterThan(0);
    expect(result.directions[0].direction_id).toBe(directionId);
    expect(result.directions[0].route_type).toBe(TRAIN_ROUTE_TYPE);
  });
});
