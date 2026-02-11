import { describe, it, expect, vi, beforeEach } from "vitest";
import { PTVClient } from "../../src/client.js";
import {
  PTVError,
  PTVAuthError,
  PTVNotFoundError,
  PTVServerError,
  PTVNetworkError,
  PTVValidationError,
} from "../../src/errors.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(text: string, status: number): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

const STATUS_OK = { version: "3.0", health: 1 };

describe("PTVClient", () => {
  let fetchFn: ReturnType<typeof vi.fn>;
  let client: PTVClient;

  beforeEach(() => {
    fetchFn = vi.fn();
    client = new PTVClient("test-dev-id", "test-api-key", {
      baseUrl: "https://mock.api",
      fetch: fetchFn,
      timeout: 5000,
    });
  });

  describe("URL construction", () => {
    it("signs requests with devid and signature", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          route_types: [{ route_type_name: "Train", route_type: 0 }],
          status: STATUS_OK,
        }),
      );

      await client.healthcheck();

      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("https://mock.api/v3/route_types?");
      expect(url).toContain("devid=test-dev-id");
      expect(url).toMatch(/signature=[0-9A-F]{40}/);
    });

    it("uses default base URL when none provided", async () => {
      const defaultFetch = vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            route_types: [{ route_type_name: "Train", route_type: 0 }],
            status: STATUS_OK,
          }),
        ),
      );
      const defaultClient = new PTVClient("id", "key", {
        fetch: defaultFetch,
      });

      await defaultClient.healthcheck();
      const url = (defaultFetch.mock.calls[0] as unknown[])[0] as string;
      expect(url).toContain("https://timetableapi.ptv.vic.gov.au/v3/route_types");
    });
  });

  describe("healthcheck", () => {
    it("parses valid healthcheck response (via route_types)", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          route_types: [{ route_type_name: "Train", route_type: 0 }],
          status: STATUS_OK,
        }),
      );

      const result = await client.healthcheck();
      expect(result.status.health).toBe(1);
      expect(result.route_types.length).toBeGreaterThan(0);
    });
  });

  describe("routeTypes", () => {
    it("parses valid route types response", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          route_types: [
            { route_type_name: "Train", route_type: 0 },
            { route_type_name: "Tram", route_type: 1 },
          ],
          status: STATUS_OK,
        }),
      );

      const result = await client.routeTypes();
      expect(result.route_types).toHaveLength(2);
      expect(result.route_types[0].route_type_name).toBe("Train");
    });
  });

  describe("routes", () => {
    it("calls /v3/routes with route_types param", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ routes: [], status: STATUS_OK }),
      );

      await client.routes({ route_types: [0, 1] });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("route_types=0");
      expect(url).toContain("route_types=1");
    });

    it("calls /v3/routes with route_name param", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ routes: [], status: STATUS_OK }),
      );

      await client.routes({ route_name: "Frankston" });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("route_name=Frankston");
    });

    it("calls /v3/routes/{id} for single route", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          route: {
            route_id: 42,
            route_type: 0,
            route_name: "Frankston",
          },
          status: STATUS_OK,
        }),
      );

      const result = await client.route(42);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/routes/42");
      expect(result.route.route_name).toBe("Frankston");
    });
  });

  describe("search", () => {
    it("encodes search term in path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          stops: [],
          routes: [],
          outlets: [],
          status: STATUS_OK,
        }),
      );

      await client.search("Flinders Street");
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/search/Flinders%20Street");
    });

    it("passes search options as query params", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          stops: [],
          routes: [],
          outlets: [],
          status: STATUS_OK,
        }),
      );

      await client.search("test", {
        route_types: [0],
        max_results: 5,
        include_outlets: false,
        latitude: -37.818,
        longitude: 144.967,
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("max_results=5");
      expect(url).toContain("route_types=0");
      expect(url).toContain("include_outlets=false");
      expect(url).toContain("latitude=-37.818");
      expect(url).toContain("longitude=144.967");
    });
  });

  describe("departures", () => {
    it("constructs correct departures path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          departures: [],
          stops: {},
          routes: {},
          runs: {},
          directions: {},
          disruptions: {},
          status: STATUS_OK,
        }),
      );

      await client.departures(0, 1071);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/departures/route_type/0/stop/1071");
    });

    it("constructs correct departuresForRoute path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          departures: [],
          stops: {},
          routes: {},
          runs: {},
          directions: {},
          disruptions: {},
          status: STATUS_OK,
        }),
      );

      await client.departuresForRoute(0, 1071, 42);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain(
        "/v3/departures/route_type/0/stop/1071/route/42",
      );
    });

    it("passes expand and max_results as params", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          departures: [],
          stops: {},
          routes: {},
          runs: {},
          directions: {},
          disruptions: {},
          status: STATUS_OK,
        }),
      );

      await client.departures(0, 1071, {
        expand: ["stop", "route"],
        max_results: 10,
        direction_id: 5,
        date_utc: "2024-01-01T00:00:00Z",
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("expand=route");
      expect(url).toContain("expand=stop");
      expect(url).toContain("max_results=10");
      expect(url).toContain("direction_id=5");
      expect(url).toContain("date_utc=2024-01-01T00%3A00%3A00Z");
    });

    it("defaults map fields to empty objects when absent", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          departures: [],
          status: STATUS_OK,
        }),
      );

      const result = await client.departures(0, 1071);
      expect(result.stops).toEqual({});
      expect(result.routes).toEqual({});
      expect(result.runs).toEqual({});
      expect(result.directions).toEqual({});
      expect(result.disruptions).toEqual({});
    });
  });

  describe("stopsNearby", () => {
    it("constructs correct path with lat/lon", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ stops: [], status: STATUS_OK }),
      );

      await client.stopsNearby(-37.8183, 144.9671);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/stops/location/-37.8183,144.9671");
    });

    it("passes nearby options as params", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ stops: [], status: STATUS_OK }),
      );

      await client.stopsNearby(-37.8183, 144.9671, {
        max_distance: 500,
        max_results: 3,
        route_types: [0],
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("max_distance=500");
      expect(url).toContain("max_results=3");
      expect(url).toContain("route_types=0");
    });
  });

  describe("stopsOnRoute", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ stops: [], status: STATUS_OK }),
      );

      await client.stopsOnRoute(42, 0);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/stops/route/42/route_type/0");
    });

    it("passes direction_id param", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ stops: [], status: STATUS_OK }),
      );

      await client.stopsOnRoute(42, 0, { direction_id: 1 });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("direction_id=1");
    });
  });

  describe("directions", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ directions: [], status: STATUS_OK }),
      );

      await client.directions(42);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/directions/route/42");
    });
  });

  describe("disruptions", () => {
    it("constructs correct path for all disruptions", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ disruptions: {}, status: STATUS_OK }),
      );

      await client.disruptions();
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/disruptions");
    });

    it("constructs correct path for route disruptions", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ disruptions: {}, status: STATUS_OK }),
      );

      await client.disruptionsForRoute(42);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/disruptions/route/42");
    });

    it("constructs correct path for stop disruptions", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ disruptions: {}, status: STATUS_OK }),
      );

      await client.disruptionsForStop(1071);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/disruptions/stop/1071");
    });

    it("passes disruption options", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ disruptions: {}, status: STATUS_OK }),
      );

      await client.disruptions({
        route_types: [0, 1],
        disruption_status: "current",
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("disruption_status=current");
      expect(url).toContain("route_types=0");
      expect(url).toContain("route_types=1");
    });

    it("defaults disruptions map to empty when absent", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ status: STATUS_OK }),
      );

      const result = await client.disruptions();
      expect(result.disruptions).toEqual({});
    });
  });

  describe("runs", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ runs: [], status: STATUS_OK }),
      );

      await client.runs(42, 0);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/runs/route/42/route_type/0");
    });

    it("passes expand params", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ runs: [], status: STATUS_OK }),
      );

      await client.runs(42, 0, { expand: ["VehiclePosition"] });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("expand=VehiclePosition");
    });

    it("passes extended run options", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ runs: [], status: STATUS_OK }),
      );

      await client.runs(42, 0, {
        expand: ["VehiclePosition"],
        date_utc: "2024-01-01T00:00:00Z",
        include_geopath: true,
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("expand=VehiclePosition");
      expect(url).toContain("date_utc=2024-01-01T00%3A00%3A00Z");
      expect(url).toContain("include_geopath=true");
    });
  });

  describe("directionsById", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ directions: [], status: STATUS_OK }),
      );

      await client.directionsById(1);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/directions/1");
    });
  });

  describe("directionsByIdAndType", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ directions: [], status: STATUS_OK }),
      );

      await client.directionsByIdAndType(1, 0);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/directions/1/route_type/0");
    });
  });

  describe("disruptionById", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          disruption: { disruption_id: 123, title: "Test" },
          status: STATUS_OK,
        }),
      );

      const result = await client.disruptionById(123);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/disruptions/123");
      expect(result.disruption.disruption_id).toBe(123);
    });
  });

  describe("disruptionModes", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          disruption_modes: [
            { disruption_mode_name: "Train", disruption_mode: 0 },
          ],
          status: STATUS_OK,
        }),
      );

      const result = await client.disruptionModes();
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/disruptions/modes");
      expect(result.disruption_modes).toHaveLength(1);
    });
  });

  describe("fareEstimate", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(jsonResponse({}));

      await client.fareEstimate(1, 3);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/fare_estimate/min_zone/1/max_zone/3");
    });

    it("passes fare estimate options", async () => {
      fetchFn.mockResolvedValue(jsonResponse({}));

      await client.fareEstimate(1, 3, {
        journey_touch_on_utc: "2024-01-01T08:00:00Z",
        journey_touch_off_utc: "2024-01-01T09:00:00Z",
        is_journey_in_free_tram_zone: false,
        travelled_route_types: [0, 1],
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("journey_touch_on_utc=2024-01-01T08%3A00%3A00Z");
      expect(url).toContain("journey_touch_off_utc=2024-01-01T09%3A00%3A00Z");
      expect(url).toContain("is_journey_in_free_tram_zone=false");
      expect(url).toContain("travelled_route_types=0");
      expect(url).toContain("travelled_route_types=1");
    });
  });

  describe("outlets", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ outlets: [], status: STATUS_OK }),
      );

      await client.outlets();
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/outlets");
    });

    it("passes max_results option", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ outlets: [], status: STATUS_OK }),
      );

      await client.outlets({ max_results: 10 });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("max_results=10");
    });
  });

  describe("outletsNearby", () => {
    it("constructs correct path with lat, lon, maxDistance", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ outlets: [], status: STATUS_OK }),
      );

      await client.outletsNearby(-37.818, 144.967, 500);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/outlets/location/-37.818,144.967,500");
    });

    it("passes max_results option", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ outlets: [], status: STATUS_OK }),
      );

      await client.outletsNearby(-37.818, 144.967, 500, { max_results: 5 });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("max_results=5");
    });
  });

  describe("stoppingPattern", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          departures: [],
          stops: {},
          routes: {},
          runs: {},
          directions: {},
          disruptions: [],
          status: STATUS_OK,
        }),
      );

      await client.stoppingPattern("12345", 0);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/pattern/run/12345/route_type/0");
    });

    it("passes stopping pattern options", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          departures: [],
          stops: {},
          routes: {},
          runs: {},
          directions: {},
          disruptions: [],
          status: STATUS_OK,
        }),
      );

      await client.stoppingPattern("12345", 0, {
        expand: ["stop"],
        stop_id: 1071,
        date_utc: "2024-01-01T00:00:00Z",
        include_skipped_stops: true,
        include_geopath: false,
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("expand=stop");
      expect(url).toContain("stop_id=1071");
      expect(url).toContain("date_utc=2024-01-01T00%3A00%3A00Z");
      expect(url).toContain("include_skipped_stops=true");
      expect(url).toContain("include_geopath=false");
    });
  });

  describe("runByRef", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ runs: [], status: STATUS_OK }),
      );

      await client.runByRef("12345");
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/runs/12345");
    });

    it("passes extended run options", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ runs: [], status: STATUS_OK }),
      );

      await client.runByRef("12345", { expand: ["VehiclePosition"] });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("expand=VehiclePosition");
    });
  });

  describe("runByRefAndType", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          run: {
            run_id: 1,
            run_ref: "12345",
            route_id: 42,
            route_type: 0,
          },
          status: STATUS_OK,
        }),
      );

      const result = await client.runByRefAndType("12345", 0);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/runs/12345/route_type/0");
      expect(result.run.run_ref).toBe("12345");
    });
  });

  describe("runsForRoute", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ runs: [], status: STATUS_OK }),
      );

      await client.runsForRoute(42);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/runs/route/42");
    });

    it("passes extended run options", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ runs: [], status: STATUS_OK }),
      );

      await client.runsForRoute(42, {
        date_utc: "2024-01-01T00:00:00Z",
        include_geopath: true,
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("date_utc=2024-01-01T00%3A00%3A00Z");
      expect(url).toContain("include_geopath=true");
    });
  });

  describe("stopDetails", () => {
    it("constructs correct path", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          stop: { stop_id: 1071, stop_name: "Flinders Street" },
          status: STATUS_OK,
        }),
      );

      const result = await client.stopDetails(1071, 0);
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("/v3/stops/1071/route_type/0");
      expect(result.stop.stop_name).toBe("Flinders Street");
    });

    it("passes stop details options", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          stop: { stop_id: 1071, stop_name: "Flinders Street" },
          status: STATUS_OK,
        }),
      );

      await client.stopDetails(1071, 0, {
        stop_location: true,
        stop_amenities: true,
        stop_accessibility: true,
        gtfs: false,
      });
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("stop_location=true");
      expect(url).toContain("stop_amenities=true");
      expect(url).toContain("stop_accessibility=true");
      expect(url).toContain("gtfs=false");
    });
  });

  describe("error handling", () => {
    it("throws PTVAuthError on 403 JSON response", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ message: "Forbidden" }, 403),
      );

      await expect(client.healthcheck()).rejects.toBeInstanceOf(PTVAuthError);
    });

    it("throws PTVNotFoundError on 404", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ message: "Not found" }, 404),
      );

      await expect(client.route(99999)).rejects.toBeInstanceOf(
        PTVNotFoundError,
      );
    });

    it("throws PTVServerError on 500+", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ error: "Internal" }, 500),
      );

      await expect(client.routeTypes()).rejects.toBeInstanceOf(
        PTVServerError,
      );
    });

    it("falls back to text body when JSON parse fails on error response", async () => {
      fetchFn.mockResolvedValue(textResponse("Bad request text", 400));

      try {
        await client.routeTypes();
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PTVError);
        expect((err as PTVError).responseBody).toBe("Bad request text");
      }
    });

    it("handles empty text body on error response", async () => {
      fetchFn.mockResolvedValue(new Response("", { status: 400 }));

      try {
        await client.routeTypes();
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PTVError);
        expect((err as PTVError).responseBody).toBeUndefined();
      }
    });

    it("handles unreadable body on error response", async () => {
      // Create a response whose .text() always rejects, even after cloning
      function brokenTextResponse(): Response {
        const r = new Response(null, { status: 400 });
        Object.defineProperty(r, "text", {
          value: () => Promise.reject(new Error("body locked")),
        });
        Object.defineProperty(r, "ok", { value: false });
        Object.defineProperty(r, "clone", { value: () => brokenTextResponse() });
        return r;
      }
      fetchFn.mockResolvedValue(brokenTextResponse());

      try {
        await client.routeTypes();
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PTVError);
        expect((err as PTVError).responseBody).toBeUndefined();
      }
    });

    it("throws PTVNetworkError on invalid JSON success response", async () => {
      fetchFn.mockResolvedValue(
        new Response("not json", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
      );

      await expect(client.healthcheck()).rejects.toBeInstanceOf(
        PTVNetworkError,
      );
    });

    it("includes 'none' in error when content-type header is absent", async () => {
      const response = new Response("not json", { status: 200 });
      response.headers.delete("content-type");
      fetchFn.mockResolvedValue(response);

      try {
        await client.healthcheck();
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PTVNetworkError);
        expect((err as PTVNetworkError).message).toContain("content-type: none");
      }
    });

    it("throws PTVValidationError when response doesn't match schema", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ unexpected: "shape" }),
      );

      await expect(client.routeTypes()).rejects.toBeInstanceOf(
        PTVValidationError,
      );
    });

    it("includes zodErrors in PTVValidationError", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ unexpected: "shape" }),
      );

      try {
        await client.routeTypes();
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PTVValidationError);
        const validationErr = err as PTVValidationError;
        expect(validationErr.zodErrors).toBeDefined();
        expect(Array.isArray(validationErr.zodErrors)).toBe(true);
      }
    });
  });

  describe("passthrough tolerance", () => {
    it("preserves unknown fields in response", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({
          route_types: [{ route_type_name: "Train", route_type: 0 }],
          status: STATUS_OK,
          unknownField: "preserved",
        }),
      );

      const result = await client.healthcheck();
      expect((result as Record<string, unknown>).unknownField).toBe(
        "preserved",
      );
    });
  });
});
