import { describe, it, expect } from "vitest";
import {
  DISRUPTIONS_PATH,
  DISRUPTION_MODES_PATH,
  disruptionsForRoutePath,
  disruptionsForStopPath,
  disruptionByIdPath,
  buildDisruptionParams,
  DisruptionsResponseValidator,
  DisruptionResponseValidator,
  DisruptionModesResponseValidator,
} from "../../src/endpoints/disruptions.js";

describe("Disruptions Endpoints", () => {
  describe("Path builders", () => {
    it("exports DISRUPTIONS_PATH constant", () => {
      expect(DISRUPTIONS_PATH).toBe("/v3/disruptions");
    });

    it("exports DISRUPTION_MODES_PATH constant", () => {
      expect(DISRUPTION_MODES_PATH).toBe("/v3/disruptions/modes");
    });

    it("builds disruptions for route path", () => {
      expect(disruptionsForRoutePath(123)).toBe("/v3/disruptions/route/123");
      expect(disruptionsForRoutePath(0)).toBe("/v3/disruptions/route/0");
    });

    it("builds disruptions for stop path", () => {
      expect(disruptionsForStopPath(456)).toBe("/v3/disruptions/stop/456");
      expect(disruptionsForStopPath(0)).toBe("/v3/disruptions/stop/0");
    });

    it("builds disruption by ID path", () => {
      expect(disruptionByIdPath(789)).toBe("/v3/disruptions/789");
      expect(disruptionByIdPath(1)).toBe("/v3/disruptions/1");
    });
  });

  describe("buildDisruptionParams", () => {
    it("returns empty object when no options provided", () => {
      expect(buildDisruptionParams()).toEqual({});
      expect(buildDisruptionParams({})).toEqual({});
    });

    it("includes route_types when provided", () => {
      const result = buildDisruptionParams({ route_types: [0, 1, 2] });
      expect(result).toEqual({ route_types: [0, 1, 2] });
    });

    it("includes disruption_status when provided", () => {
      const result = buildDisruptionParams({ disruption_status: "current" });
      expect(result).toEqual({ disruption_status: "current" });
    });

    it("includes both parameters when provided", () => {
      const result = buildDisruptionParams({
        route_types: [3],
        disruption_status: "planned",
      });
      expect(result).toEqual({
        route_types: [3],
        disruption_status: "planned",
      });
    });

    it("omits route_types when empty array", () => {
      const result = buildDisruptionParams({ route_types: [] });
      expect(result).toEqual({});
    });

    it("omits disruption_status when undefined", () => {
      const result = buildDisruptionParams({
        route_types: [1],
        disruption_status: undefined,
      });
      expect(result).toEqual({ route_types: [1] });
    });
  });

  describe("DisruptionsResponseValidator", () => {
    it("validates valid response with disruptions", () => {
      const valid = {
        disruptions: {
          general: [
            {
              disruption_id: 1,
              title: "Major disruption",
              description: "Service affected",
              disruption_status: "current",
            },
          ],
          metro_train: [],
        },
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = DisruptionsResponseValidator.parse(valid);
      expect(result.disruptions.general).toHaveLength(1);
      expect(result.disruptions.metro_train).toHaveLength(0);
    });

    it("applies default empty object for disruptions field", () => {
      const minimal = {
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = DisruptionsResponseValidator.parse(minimal);
      expect(result.disruptions).toEqual({});
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        disruptions: {},
        status: { version: "3.0", health: 1 },
        extra_field: "preserved",
      };
      const result = DisruptionsResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("extra_field", "preserved");
    });

    it("validates nested disruption arrays", () => {
      const valid = {
        disruptions: {
          metro_bus: [
            {
              disruption_id: 100,
              title: "Route 200 delayed",
              from_date: "2026-02-11T10:00:00Z",
              to_date: null,
              routes: [
                {
                  route_id: 200,
                  route_name: "City - Airport",
                  route_type: 2,
                },
              ],
            },
          ],
        },
        status: { version: "3.0", health: 1 },
      };
      const result = DisruptionsResponseValidator.parse(valid);
      expect(result.disruptions.metro_bus[0].disruption_id).toBe(100);
      expect(result.disruptions.metro_bus[0].routes?.[0].route_id).toBe(200);
    });

    it("rejects response missing status", () => {
      const invalid = {
        disruptions: {},
      };
      expect(() => DisruptionsResponseValidator.parse(invalid)).toThrow();
    });
  });

  describe("DisruptionResponseValidator", () => {
    it("validates valid single disruption response", () => {
      const valid = {
        disruption: {
          disruption_id: 42,
          title: "Service interruption",
          description: "Planned maintenance",
          url: "https://example.com/info",
          disruption_status: "planned",
          disruption_type: "maintenance",
          from_date: "2026-02-15T00:00:00Z",
          to_date: "2026-02-16T00:00:00Z",
          colour: "#FF0000",
          display_on_board: true,
          display_status: true,
        },
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = DisruptionResponseValidator.parse(valid);
      expect(result.disruption.disruption_id).toBe(42);
      expect(result.disruption.title).toBe("Service interruption");
    });

    it("validates minimal disruption response", () => {
      const minimal = {
        disruption: {
          disruption_id: 1,
          title: "Test",
        },
        status: { version: "3.0", health: 1 },
      };
      const result = DisruptionResponseValidator.parse(minimal);
      expect(result.disruption.disruption_id).toBe(1);
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        disruption: { disruption_id: 1, title: "Test", custom: "data" },
        status: { version: "3.0", health: 1 },
        response_metadata: "extra",
      };
      const result = DisruptionResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("response_metadata", "extra");
      expect(result.disruption).toHaveProperty("custom", "data");
    });

    it("validates disruption with routes and stops", () => {
      const valid = {
        disruption: {
          disruption_id: 10,
          title: "Multi-route disruption",
          routes: [
            {
              route_id: 5,
              route_name: "Flinders St - Richmond",
              route_type: 0,
              route_number: "5",
              direction: {
                direction_id: 1,
                direction_name: "City",
              },
            },
          ],
          stops: [
            {
              stop_id: 1000,
              stop_name: "Flinders Street Station",
            },
          ],
        },
        status: { version: "3.0", health: 1 },
      };
      const result = DisruptionResponseValidator.parse(valid);
      expect(result.disruption.routes?.[0].route_id).toBe(5);
      expect(result.disruption.stops?.[0].stop_id).toBe(1000);
    });

    it("rejects response missing disruption field", () => {
      const invalid = {
        status: { version: "3.0", health: 1 },
      };
      expect(() => DisruptionResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects response with invalid disruption_id type", () => {
      const invalid = {
        disruption: {
          disruption_id: "not-a-number",
          title: "Test",
        },
        status: { version: "3.0", health: 1 },
      };
      expect(() => DisruptionResponseValidator.parse(invalid)).toThrow();
    });
  });

  describe("DisruptionModesResponseValidator", () => {
    it("validates valid disruption modes response", () => {
      const valid = {
        disruption_modes: [
          {
            disruption_mode_name: "general",
            disruption_mode: 0,
          },
          {
            disruption_mode_name: "metro_train",
            disruption_mode: 1,
          },
          {
            disruption_mode_name: "metro_tram",
            disruption_mode: 2,
          },
        ],
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = DisruptionModesResponseValidator.parse(valid);
      expect(result.disruption_modes).toHaveLength(3);
      expect(result.disruption_modes[0].disruption_mode_name).toBe("general");
      expect(result.disruption_modes[0].disruption_mode).toBe(0);
    });

    it("validates empty disruption modes array", () => {
      const valid = {
        disruption_modes: [],
        status: { version: "3.0", health: 1 },
      };
      const result = DisruptionModesResponseValidator.parse(valid);
      expect(result.disruption_modes).toEqual([]);
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        disruption_modes: [
          {
            disruption_mode_name: "metro_bus",
            disruption_mode: 3,
            extra_mode_field: "preserved",
          },
        ],
        status: { version: "3.0", health: 1 },
        extra_response_field: "also_preserved",
      };
      const result = DisruptionModesResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("extra_response_field", "also_preserved");
      expect(result.disruption_modes[0]).toHaveProperty(
        "extra_mode_field",
        "preserved",
      );
    });

    it("rejects response missing disruption_modes field", () => {
      const invalid = {
        status: { version: "3.0", health: 1 },
      };
      expect(() => DisruptionModesResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects mode with missing disruption_mode_name", () => {
      const invalid = {
        disruption_modes: [
          {
            disruption_mode: 1,
          },
        ],
        status: { version: "3.0", health: 1 },
      };
      expect(() => DisruptionModesResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects mode with invalid disruption_mode type", () => {
      const invalid = {
        disruption_modes: [
          {
            disruption_mode_name: "test",
            disruption_mode: "not-a-number",
          },
        ],
        status: { version: "3.0", health: 1 },
      };
      expect(() => DisruptionModesResponseValidator.parse(invalid)).toThrow();
    });
  });
});
