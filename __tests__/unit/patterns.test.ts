import { describe, it, expect } from "vitest";
import {
  stoppingPatternPath,
  buildStoppingPatternParams,
  StoppingPatternResponseValidator,
} from "../../src/endpoints/patterns.js";

describe("stoppingPatternPath", () => {
  it("returns correct path with run ref and route type", () => {
    expect(stoppingPatternPath("1234", 0)).toBe("/v3/pattern/run/1234/route_type/0");
  });

  it("handles different route types", () => {
    expect(stoppingPatternPath("5678", 3)).toBe("/v3/pattern/run/5678/route_type/3");
  });

  it("handles string run references", () => {
    expect(stoppingPatternPath("ABC-123", 1)).toBe("/v3/pattern/run/ABC-123/route_type/1");
  });
});

describe("buildStoppingPatternParams", () => {
  it("returns empty object when no options provided", () => {
    expect(buildStoppingPatternParams()).toEqual({});
  });

  it("returns empty object when undefined options provided", () => {
    expect(buildStoppingPatternParams(undefined)).toEqual({});
  });

  it("includes expand array when provided", () => {
    const result = buildStoppingPatternParams({
      expand: ["Stop", "Route"],
    });
    expect(result).toEqual({ expand: ["Stop", "Route"] });
  });

  it("includes stop_id when provided", () => {
    const result = buildStoppingPatternParams({
      stop_id: 1071,
    });
    expect(result).toEqual({ stop_id: 1071 });
  });

  it("includes date_utc when provided", () => {
    const result = buildStoppingPatternParams({
      date_utc: "2024-01-01T00:00:00Z",
    });
    expect(result).toEqual({ date_utc: "2024-01-01T00:00:00Z" });
  });

  it("includes include_skipped_stops when true", () => {
    const result = buildStoppingPatternParams({
      include_skipped_stops: true,
    });
    expect(result).toEqual({ include_skipped_stops: true });
  });

  it("includes include_skipped_stops when false", () => {
    const result = buildStoppingPatternParams({
      include_skipped_stops: false,
    });
    expect(result).toEqual({ include_skipped_stops: false });
  });

  it("includes include_geopath when true", () => {
    const result = buildStoppingPatternParams({
      include_geopath: true,
    });
    expect(result).toEqual({ include_geopath: true });
  });

  it("includes include_geopath when false", () => {
    const result = buildStoppingPatternParams({
      include_geopath: false,
    });
    expect(result).toEqual({ include_geopath: false });
  });

  it("includes multiple parameters when provided", () => {
    const result = buildStoppingPatternParams({
      expand: ["Stop", "Route"],
      stop_id: 1071,
      date_utc: "2024-01-01T00:00:00Z",
      include_skipped_stops: true,
      include_geopath: false,
    });
    expect(result).toEqual({
      expand: ["Stop", "Route"],
      stop_id: 1071,
      date_utc: "2024-01-01T00:00:00Z",
      include_skipped_stops: true,
      include_geopath: false,
    });
  });

  it("omits expand when empty array provided", () => {
    const result = buildStoppingPatternParams({
      expand: [],
    });
    expect(result).toEqual({});
  });

  it("omits parameters when undefined", () => {
    const result = buildStoppingPatternParams({
      expand: undefined,
      stop_id: undefined,
      date_utc: undefined,
      include_skipped_stops: undefined,
      include_geopath: undefined,
    });
    expect(result).toEqual({});
  });
});

describe("StoppingPatternResponseValidator", () => {
  it("accepts valid full response", () => {
    const validData = {
      departures: [
        {
          stop_id: 1071,
          route_id: 6,
          run_id: 1,
          run_ref: "1",
          direction_id: 1,
          disruption_ids: [],
          scheduled_departure_utc: "2024-01-01T00:00:00Z",
          estimated_departure_utc: null,
          at_platform: false,
          platform_number: null,
          flags: "",
          departure_sequence: 0,
        },
      ],
      stops: {
        "1071": {
          stop_id: 1071,
          stop_name: "Flinders Street",
        },
      },
      routes: {
        "6": {
          route_id: 6,
          route_type: 0,
          route_name: "Alamein",
        },
      },
      runs: {
        "1": {
          run_id: 1,
          run_ref: "1",
        },
      },
      directions: {
        "1": {
          direction_id: 1,
          direction_name: "City",
        },
      },
      disruptions: [
        {
          disruption_id: 123,
          title: "Planned Works",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.departures).toHaveLength(1);
      expect(result.data.departures[0].stop_id).toBe(1071);
      expect(result.data.stops["1071"].stop_name).toBe("Flinders Street");
      expect(result.data.disruptions).toHaveLength(1);
    }
  });

  it("defaults stops to empty object when absent", () => {
    const minimalData = {
      departures: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stops).toEqual({});
    }
  });

  it("defaults routes to empty object when absent", () => {
    const minimalData = {
      departures: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.routes).toEqual({});
    }
  });

  it("defaults runs to empty object when absent", () => {
    const minimalData = {
      departures: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.runs).toEqual({});
    }
  });

  it("defaults directions to empty object when absent", () => {
    const minimalData = {
      departures: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.directions).toEqual({});
    }
  });

  it("defaults disruptions to empty array when absent", () => {
    const minimalData = {
      departures: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.disruptions).toEqual([]);
    }
  });

  it("preserves unknown fields via passthrough", () => {
    const dataWithExtras = {
      departures: [],
      status: {
        version: "3.0",
        health: 1,
      },
      unknown_field: "preserved",
      extra_data: 123,
    };

    const result = StoppingPatternResponseValidator.safeParse(dataWithExtras);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("unknown_field", "preserved");
      expect(result.data).toHaveProperty("extra_data", 123);
    }
  });

  it("accepts empty departures array", () => {
    const validData = {
      departures: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.departures).toHaveLength(0);
    }
  });

  it("accepts multiple departures", () => {
    const validData = {
      departures: [
        {
          stop_id: 1071,
          route_id: 6,
          run_id: 1,
          run_ref: "1",
          direction_id: 1,
          disruption_ids: [],
          scheduled_departure_utc: "2024-01-01T00:00:00Z",
          estimated_departure_utc: null,
          at_platform: false,
          platform_number: null,
          flags: "",
          departure_sequence: 0,
        },
        {
          stop_id: 1072,
          route_id: 6,
          run_id: 1,
          run_ref: "1",
          direction_id: 1,
          disruption_ids: [],
          scheduled_departure_utc: "2024-01-01T00:05:00Z",
          estimated_departure_utc: null,
          at_platform: false,
          platform_number: null,
          flags: "",
          departure_sequence: 1,
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.departures).toHaveLength(2);
      expect(result.data.departures[1].stop_id).toBe(1072);
    }
  });

  it("rejects response missing departures field", () => {
    const invalidData = {
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response missing status field", () => {
    const invalidData = {
      departures: [],
    };

    const result = StoppingPatternResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response with invalid departures type", () => {
    const invalidData = {
      departures: "not an array",
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response with invalid disruptions type", () => {
    const invalidData = {
      departures: [],
      disruptions: "not an array",
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("accepts disruptions as array (not record)", () => {
    const validData = {
      departures: [],
      disruptions: [
        {
          disruption_id: 123,
          title: "Planned Works",
        },
        {
          disruption_id: 456,
          title: "Service Alert",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = StoppingPatternResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data.disruptions)).toBe(true);
      expect(result.data.disruptions).toHaveLength(2);
      expect(result.data.disruptions[0].disruption_id).toBe(123);
    }
  });
});
