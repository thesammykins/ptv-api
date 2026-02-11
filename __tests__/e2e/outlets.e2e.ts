import { describe, it, expect } from "vitest";
import { hasCredentials, createClient } from "./setup.js";

describe.skipIf(!hasCredentials)("outlets e2e", () => {
  const client = createClient();

  it("returns all myki outlets", async () => {
    const result = await client.outlets();
    expect(result.outlets).toBeInstanceOf(Array);
    // Only assert structure if outlets exist
    if (result.outlets.length > 0) {
      expect(typeof result.outlets[0].outlet_name).toBe("string");
    }
  });

  it("supports max_results pagination", async () => {
    const result = await client.outlets({ max_results: 5 });
    expect(result.outlets).toBeInstanceOf(Array);
    expect(result.outlets.length).toBeLessThanOrEqual(5);
  });

  it("returns outlets nearby Flinders St", async () => {
    const result = await client.outletsNearby(-37.8183, 144.9671, 500);
    expect(result.outlets).toBeInstanceOf(Array);
    // Outlets near Flinders St should have location data
    if (result.outlets.length > 0) {
      const outlet = result.outlets[0];
      expect(outlet.outlet_slid_spid).toBeDefined();
      expect(outlet.outlet_latitude).toBeDefined();
      expect(outlet.outlet_longitude).toBeDefined();
    }
  });
});
