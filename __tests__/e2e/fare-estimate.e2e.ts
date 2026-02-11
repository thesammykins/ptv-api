import { describe, it, expect } from "vitest";
import { hasCredentials, createClient } from "./setup.js";

describe.skipIf(!hasCredentials)("fare-estimate e2e", () => {
  const client = createClient();

  it("returns basic zone 1-2 fare estimate", async () => {
    const result = await client.fareEstimate(1, 2);
    expect(result).toBeDefined();
    // Response may have FareEstimateResult or FareEstimateResultStatus
    expect(result.FareEstimateResult !== undefined || result.FareEstimateResultStatus !== undefined).toBe(true);
  });

  it("supports optional journey_touch_on_utc parameter", async () => {
    const touchOn = new Date().toISOString();
    const result = await client.fareEstimate(1, 2, {
      journey_touch_on_utc: touchOn,
    });
    expect(result).toBeDefined();
    expect(result.FareEstimateResult !== undefined || result.FareEstimateResultStatus !== undefined).toBe(true);
  });
});
