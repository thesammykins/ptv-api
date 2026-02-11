import { describe, it, expect } from "vitest";
import {
  stopsNearbyPath,
  stopsOnRoutePath,
  stopDetailsPath,
  buildNearbyParams,
  buildStopsRouteParams,
  buildStopDetailsParams,
  StopsLocationResponseValidator,
  StopsRouteResponseValidator,
  StopDetailsResponseValidator,
} from "../../src/endpoints/stops.js";

describe("Stops Endpoints", () => {
  describe("Path builders", () => {
    it("builds stops nearby path", () => {
      expect(stopsNearbyPath(-37.8136, 144.9631)).toBe("/v3/stops/location/-37.8136,144.9631");
      expect(stopsNearbyPath(0, 0)).toBe("/v3/stops/location/0,0");
      expect(stopsNearbyPath(-37.5, 144.5)).toBe("/v3/stops/location/-37.5,144.5");
    });

    it("builds stops on route path", () => {
      expect(stopsOnRoutePath(123, 0)).toBe("/v3/stops/route/123/route_type/0");
      expect(stopsOnRoutePath(456, 2)).toBe("/v3/stops/route/456/route_type/2");
    });

    it("builds stop details path", () => {
      expect(stopDetailsPath(1000, 0)).toBe("/v3/stops/1000/route_type/0");
      expect(stopDetailsPath(2500, 1)).toBe("/v3/stops/2500/route_type/1");
    });
  });

  describe("buildNearbyParams", () => {
    it("returns empty object when no options provided", () => {
      expect(buildNearbyParams()).toEqual({});
      expect(buildNearbyParams({})).toEqual({});
    });

    it("includes route_types when provided", () => {
      const result = buildNearbyParams({ route_types: [0, 1, 2] });
      expect(result).toEqual({ route_types: [0, 1, 2] });
    });

    it("includes max_distance when provided", () => {
      const result = buildNearbyParams({ max_distance: 500 });
      expect(result).toEqual({ max_distance: 500 });
    });

    it("includes max_results when provided", () => {
      const result = buildNearbyParams({ max_results: 10 });
      expect(result).toEqual({ max_results: 10 });
    });

    it("includes all parameters when provided", () => {
      const result = buildNearbyParams({
        route_types: [0, 1],
        max_distance: 1000,
        max_results: 20,
      });
      expect(result).toEqual({
        route_types: [0, 1],
        max_distance: 1000,
        max_results: 20,
      });
    });

    it("omits route_types when empty array", () => {
      const result = buildNearbyParams({ route_types: [] });
      expect(result).toEqual({});
    });

    it("omits max_distance when undefined", () => {
      const result = buildNearbyParams({ route_types: [0], max_distance: undefined });
      expect(result).toEqual({ route_types: [0] });
    });

    it("includes max_distance when zero", () => {
      const result = buildNearbyParams({ max_distance: 0 });
      expect(result).toEqual({ max_distance: 0 });
    });

    it("includes max_results when zero", () => {
      const result = buildNearbyParams({ max_results: 0 });
      expect(result).toEqual({ max_results: 0 });
    });
  });

  describe("buildStopsRouteParams", () => {
    it("returns empty object when no options provided", () => {
      expect(buildStopsRouteParams()).toEqual({});
      expect(buildStopsRouteParams({})).toEqual({});
    });

    it("includes direction_id when provided", () => {
      const result = buildStopsRouteParams({ direction_id: 1 });
      expect(result).toEqual({ direction_id: 1 });
    });

    it("includes direction_id when zero", () => {
      const result = buildStopsRouteParams({ direction_id: 0 });
      expect(result).toEqual({ direction_id: 0 });
    });

    it("omits direction_id when undefined", () => {
      const result = buildStopsRouteParams({ direction_id: undefined });
      expect(result).toEqual({});
    });
  });

  describe("buildStopDetailsParams", () => {
    it("returns empty object when no options provided", () => {
      expect(buildStopDetailsParams()).toEqual({});
      expect(buildStopDetailsParams({})).toEqual({});
    });

    it("includes stop_location when true", () => {
      const result = buildStopDetailsParams({ stop_location: true });
      expect(result).toEqual({ stop_location: true });
    });

    it("includes stop_location when false", () => {
      const result = buildStopDetailsParams({ stop_location: false });
      expect(result).toEqual({ stop_location: false });
    });

    it("includes stop_amenities when provided", () => {
      const result = buildStopDetailsParams({ stop_amenities: true });
      expect(result).toEqual({ stop_amenities: true });
    });

    it("includes stop_accessibility when provided", () => {
      const result = buildStopDetailsParams({ stop_accessibility: true });
      expect(result).toEqual({ stop_accessibility: true });
    });

    it("includes stop_contact when provided", () => {
      const result = buildStopDetailsParams({ stop_contact: true });
      expect(result).toEqual({ stop_contact: true });
    });

    it("includes stop_ticket when provided", () => {
      const result = buildStopDetailsParams({ stop_ticket: true });
      expect(result).toEqual({ stop_ticket: true });
    });

    it("includes gtfs when provided", () => {
      const result = buildStopDetailsParams({ gtfs: true });
      expect(result).toEqual({ gtfs: true });
    });

    it("includes stop_staffing when provided", () => {
      const result = buildStopDetailsParams({ stop_staffing: true });
      expect(result).toEqual({ stop_staffing: true });
    });

    it("includes stop_disruptions when provided", () => {
      const result = buildStopDetailsParams({ stop_disruptions: true });
      expect(result).toEqual({ stop_disruptions: true });
    });

    it("includes all parameters when provided", () => {
      const result = buildStopDetailsParams({
        stop_location: true,
        stop_amenities: true,
        stop_accessibility: true,
        stop_contact: true,
        stop_ticket: false,
        gtfs: false,
        stop_staffing: true,
        stop_disruptions: true,
      });
      expect(result).toEqual({
        stop_location: true,
        stop_amenities: true,
        stop_accessibility: true,
        stop_contact: true,
        stop_ticket: false,
        gtfs: false,
        stop_staffing: true,
        stop_disruptions: true,
      });
    });

    it("omits parameters when undefined", () => {
      const result = buildStopDetailsParams({
        stop_location: true,
        stop_amenities: undefined,
        stop_accessibility: true,
        stop_contact: undefined,
      });
      expect(result).toEqual({
        stop_location: true,
        stop_accessibility: true,
      });
    });
  });

  describe("StopsLocationResponseValidator", () => {
    it("validates valid response with stops array", () => {
      const valid = {
        stops: [
          {
            stop_id: 1000,
            stop_name: "Flinders Street Station",
            stop_latitude: -37.8183,
            stop_longitude: 144.9671,
            route_type: 0,
          },
          {
            stop_id: 1001,
            stop_name: "Southern Cross Station",
          },
        ],
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = StopsLocationResponseValidator.parse(valid);
      expect(result.stops).toHaveLength(2);
      expect(result.stops[0].stop_id).toBe(1000);
      expect(result.stops[0].stop_name).toBe("Flinders Street Station");
    });

    it("validates empty stops array", () => {
      const valid = {
        stops: [],
        status: { version: "3.0", health: 1 },
      };
      const result = StopsLocationResponseValidator.parse(valid);
      expect(result.stops).toEqual([]);
    });

    it("validates response with disruptions", () => {
      const valid = {
        stops: [{ stop_id: 1000, stop_name: "Station" }],
        disruptions: {
          "100": {
            disruption_id: 100,
            title: "Service change",
          },
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopsLocationResponseValidator.parse(valid);
      expect(result.disruptions?.["100"].disruption_id).toBe(100);
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        stops: [{ stop_id: 1, stop_name: "Test", custom: "field" }],
        status: { version: "3.0", health: 1 },
        extra_field: "preserved",
      };
      const result = StopsLocationResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("extra_field", "preserved");
      expect(result.stops[0]).toHaveProperty("custom", "field");
    });

    it("rejects response missing stops field", () => {
      const invalid = {
        status: { version: "3.0", health: 1 },
      };
      expect(() => StopsLocationResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects response missing status field", () => {
      const invalid = {
        stops: [{ stop_id: 1, stop_name: "Test" }],
      };
      expect(() => StopsLocationResponseValidator.parse(invalid)).toThrow();
    });
  });

  describe("StopsRouteResponseValidator", () => {
    it("validates valid response with stops array", () => {
      const valid = {
        stops: [
          {
            stop_id: 2000,
            stop_name: "Parliament",
            stop_sequence: 1,
            route_type: 0,
          },
          {
            stop_id: 2001,
            stop_name: "Melbourne Central",
            stop_sequence: 2,
          },
        ],
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = StopsRouteResponseValidator.parse(valid);
      expect(result.stops).toHaveLength(2);
      expect(result.stops[0].stop_sequence).toBe(1);
      expect(result.stops[1].stop_sequence).toBe(2);
    });

    it("validates response with disruptions", () => {
      const valid = {
        stops: [{ stop_id: 2000, stop_name: "Stop" }],
        disruptions: {
          "200": {
            disruption_id: 200,
            title: "Planned work",
            disruption_status: "planned",
          },
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopsRouteResponseValidator.parse(valid);
      expect(result.disruptions?.["200"].title).toBe("Planned work");
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        stops: [{ stop_id: 1, stop_name: "Test" }],
        status: { version: "3.0", health: 1 },
        metadata: "preserved",
      };
      const result = StopsRouteResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("metadata", "preserved");
    });

    it("rejects response missing stops field", () => {
      const invalid = {
        status: { version: "3.0", health: 1 },
      };
      expect(() => StopsRouteResponseValidator.parse(invalid)).toThrow();
    });
  });

  describe("StopDetailsResponseValidator", () => {
    it("validates valid stop details response", () => {
      const valid = {
        stop: {
          stop_id: 3000,
          stop_name: "Flinders Street Station",
          route_type: 0,
          station_type: "railway_station",
          station_description: "Major metro station",
        },
        status: {
          version: "3.0",
          health: 1,
        },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.stop.stop_id).toBe(3000);
      expect(result.stop.stop_name).toBe("Flinders Street Station");
      expect(result.stop.station_type).toBe("railway_station");
    });

    it("validates stop with location data", () => {
      const valid = {
        stop: {
          stop_id: 3001,
          stop_name: "Southern Cross",
          stop_location: {
            gps: {
              latitude: -37.8183,
              longitude: 144.9527,
            },
          },
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.stop.stop_location?.gps?.latitude).toBe(-37.8183);
      expect(result.stop.stop_location?.gps?.longitude).toBe(144.9527);
    });

    it("validates stop with amenities", () => {
      const valid = {
        stop: {
          stop_id: 3002,
          stop_name: "Richmond Station",
          stop_amenities: {
            toilet: true,
            taxi_rank: true,
            car_parking: "Available",
            cctv: true,
          },
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.stop.stop_amenities?.toilet).toBe(true);
      expect(result.stop.stop_amenities?.taxi_rank).toBe(true);
      expect(result.stop.stop_amenities?.car_parking).toBe("Available");
      expect(result.stop.stop_amenities?.cctv).toBe(true);
    });

    it("validates stop with accessibility details", () => {
      const valid = {
        stop: {
          stop_id: 3003,
          stop_name: "Accessible Station",
          stop_accessibility: {
            lighting: true,
            platform_number: 1,
            audio_customer_information: true,
            escalator: true,
            hearing_loop: true,
            lift: true,
            stairs: true,
            stop_accessible: true,
            tactile_ground_surface_indicator: true,
            waiting_room: true,
            wheelchair: {
              accessible_ramp: true,
              parking: true,
              telephone: true,
              toilet: true,
              low_ticket_counter: true,
              manouvering: true,
              raised_platform: true,
              ramp: true,
              secondary_path: false,
              raised_platform_shelther: true,
              steep_ramp: false,
            },
          },
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.stop.stop_accessibility?.lighting).toBe(true);
      expect(result.stop.stop_accessibility?.platform_number).toBe(1);
      expect(result.stop.stop_accessibility?.wheelchair?.accessible_ramp).toBe(true);
      expect(result.stop.stop_accessibility?.wheelchair?.parking).toBe(true);
      expect(result.stop.stop_accessibility?.wheelchair?.steep_ramp).toBe(false);
    });

    it("validates stop with null nullable fields", () => {
      const valid = {
        stop: {
          stop_id: 3004,
          stop_name: "Basic Stop",
          station_type: null,
          station_description: null,
          stop_location: null,
          stop_amenities: null,
          stop_accessibility: null,
          stop_landmark: null,
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.stop.station_type).toBeNull();
      expect(result.stop.station_description).toBeNull();
      expect(result.stop.stop_location).toBeNull();
      expect(result.stop.stop_amenities).toBeNull();
      expect(result.stop.stop_accessibility).toBeNull();
      expect(result.stop.stop_landmark).toBeNull();
    });

    it("validates stop with disruption_ids", () => {
      const valid = {
        stop: {
          stop_id: 3005,
          stop_name: "Stop with Disruptions",
          disruption_ids: [100, 101, 102],
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.stop.disruption_ids).toEqual([100, 101, 102]);
    });

    it("validates stop with routes array", () => {
      const valid = {
        stop: {
          stop_id: 3006,
          stop_name: "Stop with Routes",
          routes: [
            { route_id: 1, route_name: "Route 1" },
            { route_id: 2, route_name: "Route 2" },
          ],
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.stop.routes).toHaveLength(2);
    });

    it("validates response with disruptions dictionary", () => {
      const valid = {
        stop: {
          stop_id: 3007,
          stop_name: "Station",
        },
        disruptions: {
          "100": {
            disruption_id: 100,
            title: "Service change",
          },
          "101": {
            disruption_id: 101,
            title: "Planned maintenance",
          },
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(valid);
      expect(result.disruptions?.["100"].title).toBe("Service change");
      expect(result.disruptions?.["101"].title).toBe("Planned maintenance");
    });

    it("validates minimal stop details response", () => {
      const minimal = {
        stop: {
          stop_id: 1,
          stop_name: "Minimal",
        },
        status: { version: "3.0", health: 1 },
      };
      const result = StopDetailsResponseValidator.parse(minimal);
      expect(result.stop.stop_id).toBe(1);
      expect(result.stop.stop_name).toBe("Minimal");
    });

    it("preserves unknown fields with passthrough", () => {
      const withExtra = {
        stop: {
          stop_id: 1,
          stop_name: "Test",
          custom_stop_field: "data",
        },
        status: { version: "3.0", health: 1 },
        extra_response_field: "preserved",
      };
      const result = StopDetailsResponseValidator.parse(withExtra);
      expect(result).toHaveProperty("extra_response_field", "preserved");
      expect(result.stop).toHaveProperty("custom_stop_field", "data");
    });

    it("rejects response missing stop field", () => {
      const invalid = {
        status: { version: "3.0", health: 1 },
      };
      expect(() => StopDetailsResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects response missing status field", () => {
      const invalid = {
        stop: { stop_id: 1, stop_name: "Test" },
      };
      expect(() => StopDetailsResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects stop with invalid stop_id type", () => {
      const invalid = {
        stop: {
          stop_id: "not-a-number",
          stop_name: "Test",
        },
        status: { version: "3.0", health: 1 },
      };
      expect(() => StopDetailsResponseValidator.parse(invalid)).toThrow();
    });

    it("rejects stop missing stop_name", () => {
      const invalid = {
        stop: {
          stop_id: 1,
        },
        status: { version: "3.0", health: 1 },
      };
      expect(() => StopDetailsResponseValidator.parse(invalid)).toThrow();
    });
  });
});
