import { describe, it, expect } from "vitest";
import {
  runsPath,
  runByRefPath,
  runByRefAndTypePath,
  runsForRoutePath,
  buildRunParams,
  RunsResponseValidator,
  RunResponseValidator,
} from "../../src/endpoints/runs.js";

describe("Runs Endpoints", () => {
  describe("Path builders", () => {
    it("builds runs path for route and route type", () => {
      expect(runsPath(123, 0)).toBe("/v3/runs/route/123/route_type/0");
      expect(runsPath(456, 2)).toBe("/v3/runs/route/456/route_type/2");
    });

    it("builds run by ref path", () => {
      expect(runByRefPath("ABC123")).toBe("/v3/runs/ABC123");
      expect(runByRefPath("run-ref-001")).toBe("/v3/runs/run-ref-001");
    });

    it("builds run by ref and type path", () => {
      expect(runByRefAndTypePath("XYZ789", 1)).toBe("/v3/runs/XYZ789/route_type/1");
      expect(runByRefAndTypePath("ref-123", 3)).toBe("/v3/runs/ref-123/route_type/3");
    });

    it("builds runs for route path", () => {
      expect(runsForRoutePath(999)).toBe("/v3/runs/route/999");
      expect(runsForRoutePath(1)).toBe("/v3/runs/route/1");
    });
  });

  describe("buildRunParams", () => {
    it("returns empty object when no options provided", () => {
      expect(buildRunParams()).toEqual({});
      expect(buildRunParams({})).toEqual({});
    });

    it("includes expand when provided", () => {
      const result = buildRunParams({ expand: ["All", "VehiclePosition"] });
      expect(result).toEqual({ expand: ["All", "VehiclePosition"] });
    });

    it("includes date_utc when provided", () => {
      const result = buildRunParams({ date_utc: "2026-02-11T10:00:00Z" });
      expect(result).toEqual({ date_utc: "2026-02-11T10:00:00Z" });
    });

    it("includes include_geopath when true", () => {
      const result = buildRunParams({ include_geopath: true });
      expect(result).toEqual({ include_geopath: true });
    });

    it("includes include_geopath when false", () => {
      const result = buildRunParams({ include_geopath: false });
      expect(result).toEqual({ include_geopath: false });
    });

    it("includes all parameters when provided", () => {
      const result = buildRunParams({
        expand: ["Stop"],
        date_utc: "2026-02-11T12:00:00Z",
        include_geopath: true,
      });
      expect(result).toEqual({
        expand: ["Stop"],
        date_utc: "2026-02-11T12:00:00Z",
        include_geopath: true,
      });
    });

    it("omits expand when empty array", () => {
      const result = buildRunParams({ expand: [] });
      expect(result).toEqual({});
    });

    it("omits date_utc when undefined", () => {
      const result = buildRunParams({ expand: ["All"], date_utc: undefined });
      expect(result).toEqual({ expand: ["All"] });
    });

    it("omits include_geopath when undefined", () => {
      const result = buildRunParams({ expand: ["All"], include_geopath: undefined });
      expect(result).toEqual({ expand: ["All"] });
    });
  });

  describe("RunsResponseValidator", () => {
    it("validates valid response with runs array", () => {
      const valid = {
        runs: [
          {
            run_id: 1,
            run_ref: "ABC123",
            route_id: 5,
            route_type: 0,
            direction_id: 1,
            destination_name: "Flinders Street",
            status: "scheduled",
          },
          {
            run_id: 2,
            run_ref: "XYZ789",
          },
        ],
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = RunsResponseValidator.parse(valid);
      expect(result.runs).toHaveLength(2);
      expect(result.runs[0].run_id).toBe(1);
      expect(result.runs[0].run_ref).toBe("ABC123");
      expect(result.runs[1].run_id).toBe(2);
    });

    it("validates empty runs array", () => {
      const valid = {
        runs: [],
        status: { version: "3.0", health: 1 },
      };
      const result = RunsResponseValidator.parse(valid);
      expect(result.runs).toEqual([]);
    });

    it("validates runs with vehicle position", () => {
      const valid = {
        runs: [
          {
            run_id: 10,
            run_ref: "RUN001",
            vehicle_position: {
              latitude: -37.8136,
              longitude: 144.9631,
              bearing: 90,
              datetime_utc: "2026-02-11T10:00:00Z",
            },
          },
        ],
        status: { version: "3.0", health: 1 },
      };
      const result = RunsResponseValidator.parse(valid);
      expect(result.runs[0].vehicle_position?.latitude).toBe(-37.8136);
      expect(result.runs[0].vehicle_position?.longitude).toBe(144.9631);
    });

    it("validates runs with vehicle descriptor", () => {
      const valid = {
        runs: [
          {
            run_id: 20,
            run_ref: "RUN002",
            vehicle_descriptor: {
              operator: "Metro Trains",
              description: "6-car train",
              low_floor: true,
              air_conditioned: true,
            },
          },
        ],
        status: { version: "3.0", health: 1 },
      };
      const result = RunsResponseValidator.parse(valid);
      expect(result.runs[0].vehicle_descriptor?.operator).toBe("Metro Trains");
      expect(result.runs[0].vehicle_descriptor?.low_floor).toBe(true);
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        runs: [{ run_id: 1, run_ref: "TEST", custom_field: "data" }],
        status: { version: "3.0", health: 1 },
        extra_response_field: "preserved",
      };
      const result = RunsResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("extra_response_field", "preserved");
      expect(result.runs[0]).toHaveProperty("custom_field", "data");
    });

    it("rejects response missing runs field", () => {
      const invalid = {
        status: { version: "3.0", health: 1 },
      };
      expect(() => RunsResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects response missing status field", () => {
      const invalid = {
        runs: [{ run_id: 1, run_ref: "TEST" }],
      };
      expect(() => RunsResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects run with invalid run_id type", () => {
      const invalid = {
        runs: [{ run_id: "not-a-number", run_ref: "TEST" }],
        status: { version: "3.0", health: 1 },
      };
      expect(() => RunsResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects run missing run_ref", () => {
      const invalid = {
        runs: [{ run_id: 1 }],
        status: { version: "3.0", health: 1 },
      };
      expect(() => RunsResponseValidator.parse(invalid)).toThrow();
    });
  });

  describe("RunResponseValidator", () => {
    it("validates valid single run response", () => {
      const valid = {
        run: {
          run_id: 100,
          run_ref: "SINGLE-RUN",
          route_id: 5,
          route_type: 1,
          direction_id: 2,
          destination_name: "City",
          status: "running",
          express_stop_count: 3,
        },
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = RunResponseValidator.parse(valid);
      expect(result.run.run_id).toBe(100);
      expect(result.run.run_ref).toBe("SINGLE-RUN");
      expect(result.run.destination_name).toBe("City");
      expect(result.run.express_stop_count).toBe(3);
    });

    it("validates minimal run response", () => {
      const minimal = {
        run: {
          run_id: 1,
          run_ref: "MIN",
        },
        status: { version: "3.0", health: 1 },
      };
      const result = RunResponseValidator.parse(minimal);
      expect(result.run.run_id).toBe(1);
      expect(result.run.run_ref).toBe("MIN");
    });

    it("validates run with null vehicle position", () => {
      const valid = {
        run: {
          run_id: 50,
          run_ref: "NULL-POS",
          vehicle_position: null,
        },
        status: { version: "3.0", health: 1 },
      };
      const result = RunResponseValidator.parse(valid);
      expect(result.run.vehicle_position).toBeNull();
    });

    it("validates run with null vehicle descriptor", () => {
      const valid = {
        run: {
          run_id: 60,
          run_ref: "NULL-DESC",
          vehicle_descriptor: null,
        },
        status: { version: "3.0", health: 1 },
      };
      const result = RunResponseValidator.parse(valid);
      expect(result.run.vehicle_descriptor).toBeNull();
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        run: {
          run_id: 1,
          run_ref: "EXTRA",
          custom_run_field: "value",
        },
        status: { version: "3.0", health: 1 },
        extra_response_data: "also-preserved",
      };
      const result = RunResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("extra_response_data", "also-preserved");
      expect(result.run).toHaveProperty("custom_run_field", "value");
    });

    it("rejects response missing run field", () => {
      const invalid = {
        status: { version: "3.0", health: 1 },
      };
      expect(() => RunResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects response missing status field", () => {
      const invalid = {
        run: { run_id: 1, run_ref: "TEST" },
      };
      expect(() => RunResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects run with invalid run_id type", () => {
      const invalid = {
        run: {
          run_id: "string-id",
          run_ref: "TEST",
        },
        status: { version: "3.0", health: 1 },
      };
      expect(() => RunResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects run missing run_ref field", () => {
      const invalid = {
        run: {
          run_id: 1,
        },
        status: { version: "3.0", health: 1 },
      };
      expect(() => RunResponseValidator.parse(invalid)).toThrow();
    });
  });
});
