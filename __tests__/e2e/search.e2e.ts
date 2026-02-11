import { describe, it, expect } from "vitest";
import { hasCredentials, createClient } from "./setup.js";

describe.skipIf(!hasCredentials)("search e2e", () => {
  const client = createClient();

  it("returns results for 'Flinders'", async () => {
    const result = await client.search("Flinders");
    expect(result.stops).toBeInstanceOf(Array);
    expect(result.routes).toBeInstanceOf(Array);
    // At minimum, Flinders Street Station should appear
    expect(result.stops.length).toBeGreaterThan(0);
  });

  it("accepts max_results option without error", async () => {
    const result = await client.search("Station", { max_results: 3 });
    expect(result.stops).toBeInstanceOf(Array);
    // PTV may not strictly enforce max_results, just verify it doesn't error
  });

  it("returns outlets when include_outlets is true", async () => {
    const result = await client.search("Melbourne", { include_outlets: true });
    expect(result.outlets).toBeInstanceOf(Array);
  });
});
