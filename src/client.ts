import { z } from "zod";
import { buildSignedUrl, type SigningCredentials } from "./request.js";
import { RequestManager, type RequestManagerOptions } from "./request-manager.js";
import { errorFromStatus, PTVNetworkError, PTVValidationError } from "./errors.js";
import {
  HEALTHCHECK_PATH,
  buildHealthcheckParams,
  HealthcheckResponseValidator,
} from "./endpoints/healthcheck.js";
import {
  ROUTE_TYPES_PATH,
  buildRouteTypesParams,
  RouteTypesResponseValidator,
} from "./endpoints/route-types.js";
import {
  ROUTES_PATH,
  routePath,
  buildRoutesParams,
  RoutesResponseValidator,
  RouteResponseValidator,
} from "./endpoints/routes.js";
import {
  searchPath,
  buildSearchParams,
  SearchResponseValidator,
} from "./endpoints/search.js";
import {
  departuresPath,
  departuresForRoutePath,
  buildDepartureParams,
  DepartureResponseValidator,
} from "./endpoints/departures.js";
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
} from "./endpoints/stops.js";
import {
  directionsPath,
  directionsByIdPath,
  directionsByIdAndTypePath,
  DirectionsResponseValidator,
} from "./endpoints/directions.js";
import {
  DISRUPTIONS_PATH,
  DISRUPTION_MODES_PATH,
  disruptionByIdPath,
  disruptionsForRoutePath,
  disruptionsForStopPath,
  buildDisruptionParams,
  DisruptionsResponseValidator,
  DisruptionResponseValidator,
  DisruptionModesResponseValidator,
} from "./endpoints/disruptions.js";
import {
  runsPath,
  runByRefPath,
  runByRefAndTypePath,
  runsForRoutePath,
  buildRunParams,
  RunsResponseValidator,
  RunResponseValidator,
} from "./endpoints/runs.js";
import {
  fareEstimatePath,
  buildFareEstimateParams,
  FareEstimateResponseValidator,
} from "./endpoints/fare-estimate.js";
import {
  OUTLETS_PATH,
  outletsNearbyPath,
  buildOutletsParams,
  OutletsResponseValidator,
  OutletsNearbyResponseValidator,
} from "./endpoints/outlets.js";
import {
  stoppingPatternPath,
  buildStoppingPatternParams,
  StoppingPatternResponseValidator,
} from "./endpoints/patterns.js";
import type {
  HealthcheckResponse,
  RouteTypesResponse,
  RoutesResponse,
  RouteResponse,
  RoutesOptions,
  SearchResponse,
  SearchOptions,
  DepartureResponse,
  DepartureOptions,
  StopsLocationResponse,
  NearbyOptions,
  StopsRouteResponse,
  StopsRouteOptions,
  DirectionsResponse,
  DisruptionsResponse,
  DisruptionResponse,
  DisruptionModesResponse,
  DisruptionOptions,
  RunsResponse,
  RunResponse,
  RunOptions,
  FareEstimateResponse,
  FareEstimateOptions,
  OutletsResponse,
  OutletsNearbyResponse,
  OutletsOptions,
  StoppingPatternResponse,
  StoppingPatternOptions,
  StopDetailsResponse,
  StopDetailsOptions,
  ExtendedRunOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "https://timetableapi.ptv.vic.gov.au";

export interface PTVClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  timeout?: number;
}

/**
 * Client for the PTV Timetable API v3.
 * @description Provides type-safe access to all Public Transport Victoria endpoints with automatic HMAC-SHA1 request signing.
 */
export class PTVClient {
  private readonly credentials: SigningCredentials;
  private readonly baseUrl: string;
  private readonly requestManager: RequestManager;

  /**
   * Creates a new PTV API client.
   * @param devId - Your PTV API developer ID
   * @param apiKey - Your PTV API key (used for HMAC-SHA1 signing)
   * @param options - Optional configuration for base URL, fetch implementation, and request timeout
   */
  constructor(devId: string, apiKey: string, options?: PTVClientOptions) {
    this.credentials = { devId, apiKey };
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;

    const rmOptions: RequestManagerOptions = {};
    if (options?.fetch) rmOptions.fetch = options.fetch;
    if (options?.timeout) rmOptions.timeout = options.timeout;
    this.requestManager = new RequestManager(rmOptions);
  }

  private async request<T extends z.ZodTypeAny>(
    path: string,
    params: Record<string, string | number | boolean | (string | number)[]>,
    validator: T,
  ): Promise<z.output<T>> {
    const url = buildSignedUrl(this.baseUrl, path, params, this.credentials);
    const response = await this.requestManager.execute(url, path);

    if (!response.ok) {
      let body: unknown;
      try {
        const text = await response.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = text || undefined;
        }
      } catch {
        // ignore — body stays undefined
      }
      throw errorFromStatus(response.status, path, body);
    }

    let body: unknown;
    try {
      const text = await response.text();
      body = JSON.parse(text);
    } catch (err) {
      throw new PTVNetworkError(
        path,
        new TypeError(
          `Invalid JSON response (status ${response.status}, content-type: ${response.headers.get("content-type") ?? "none"})`,
        ),
      );
    }

    const result = validator.safeParse(body);
    if (!result.success) {
      throw new PTVValidationError(path, result.error.issues, body);
    }

    return result.data;
  }

  /**
   * Check API health and connectivity.
   * @description Tests whether the API is responding and your credentials are valid.
   * @returns API health status and metadata
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Healthcheck
   * @example
   * ```typescript
   * const client = new PTVClient(devId, apiKey);
   * const health = await client.healthcheck();
   * console.log(health.status); // "alive"
   * ```
   */
  async healthcheck(): Promise<HealthcheckResponse> {
    return this.request(
      HEALTHCHECK_PATH,
      buildHealthcheckParams(),
      HealthcheckResponseValidator,
    );
  }

  /**
   * Get all transport mode types.
   * @description Returns route type IDs and names (train, tram, bus, vline, night bus).
   * @returns List of route types with IDs and names
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Route_Types
   */
  async routeTypes(): Promise<RouteTypesResponse> {
    return this.request(
      ROUTE_TYPES_PATH,
      buildRouteTypesParams(),
      RouteTypesResponseValidator,
    );
  }

  /**
   * Get all routes, optionally filtered by route types or name.
   * @description Returns all route information including route numbers, names, and service types.
   * @param opts - Optional filters for route types and route name
   * @returns List of routes matching filters
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Routes
   * @example
   * ```typescript
   * const routes = await client.routes({ routeTypes: [0, 1] }); // trains and trams
   * ```
   */
  async routes(opts?: RoutesOptions): Promise<RoutesResponse> {
    return this.request(
      ROUTES_PATH,
      buildRoutesParams(opts),
      RoutesResponseValidator,
    );
  }

  /**
   * Get details for a specific route by ID.
   * @description Returns route name, number, type, and service information.
   * @param routeId - The route ID to retrieve
   * @returns Route details
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Routes
   */
  async route(routeId: number): Promise<RouteResponse> {
    return this.request(
      routePath(routeId),
      {},
      RouteResponseValidator,
    );
  }

  /**
   * Search for stops, routes, and outlets by name.
   * @description Full-text search across stops, routes, and myki outlets.
   * @param term - Search term (station name, route number, etc.)
   * @param opts - Optional filters for route types, latitude, longitude, max distance, and include outlets flag
   * @returns Search results grouped by type (stops, routes, outlets)
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Search
   * @example
   * ```typescript
   * const results = await client.search("Flinders", { routeTypes: [0] });
   * console.log(results.stops); // Flinders Street Station, etc.
   * ```
   */
  async search(term: string, opts?: SearchOptions): Promise<SearchResponse> {
    return this.request(
      searchPath(term),
      buildSearchParams(opts),
      SearchResponseValidator,
    );
  }

  /**
   * Get upcoming departures from a stop for all routes.
   * @description Returns scheduled and real-time departure information from a stop.
   * @param routeType - Transport mode type (0=train, 1=tram, 2=bus, 3=vline, 4=night bus)
   * @param stopId - Stop identifier
   * @param opts - Optional filters for platform, direction, date/time, max results, and expand options
   * @returns Departures, routes, runs, directions, and disruptions
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Departures
   * @example
   * ```typescript
   * const deps = await client.departures(0, 1071, { maxResults: 5, expand: ["run", "route"] });
   * console.log(deps.departures); // Next 5 departures from Flinders Street
   * ```
   */
  async departures(
    routeType: number,
    stopId: number,
    opts?: DepartureOptions,
  ): Promise<DepartureResponse> {
    return this.request(
      departuresPath(routeType, stopId),
      buildDepartureParams(opts),
      DepartureResponseValidator,
    );
  }

  /**
   * Get upcoming departures from a stop for a specific route.
   * @description Returns scheduled and real-time departures filtered to a single route.
   * @param routeType - Transport mode type
   * @param stopId - Stop identifier
   * @param routeId - Route identifier to filter departures
   * @param opts - Optional filters for direction, date/time, max results, and expand options
   * @returns Departures for the specified route
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Departures
   */
  async departuresForRoute(
    routeType: number,
    stopId: number,
    routeId: number,
    opts?: DepartureOptions,
  ): Promise<DepartureResponse> {
    return this.request(
      departuresForRoutePath(routeType, stopId, routeId),
      buildDepartureParams(opts),
      DepartureResponseValidator,
    );
  }

  /**
   * Find stops near a geographic location.
   * @description Returns stops within a specified distance of a latitude/longitude coordinate.
   * @param lat - Latitude in decimal degrees
   * @param lon - Longitude in decimal degrees
   * @param opts - Optional filters for route types, max results, and max distance (meters)
   * @returns Stops near the location with distances
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Stops
   * @example
   * ```typescript
   * const stops = await client.stopsNearby(-37.8136, 144.9631, { maxDistance: 500 });
   * ```
   */
  async stopsNearby(
    lat: number,
    lon: number,
    opts?: NearbyOptions,
  ): Promise<StopsLocationResponse> {
    return this.request(
      stopsNearbyPath(lat, lon),
      buildNearbyParams(opts),
      StopsLocationResponseValidator,
    );
  }

  /**
   * Get all stops on a route.
   * @description Returns stops served by a route, optionally filtered by direction.
   * @param routeId - Route identifier
   * @param routeType - Transport mode type
   * @param opts - Optional direction ID and stop disruptions flag
   * @returns Stops on the route with geographic coordinates
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Stops
   */
  async stopsOnRoute(
    routeId: number,
    routeType: number,
    opts?: StopsRouteOptions,
  ): Promise<StopsRouteResponse> {
    return this.request(
      stopsOnRoutePath(routeId, routeType),
      buildStopsRouteParams(opts),
      StopsRouteResponseValidator,
    );
  }

  /**
   * Get directions for a route.
   * @description Returns direction IDs and names (e.g., "City", "Upfield") for all directions a route travels.
   * @param routeId - Route identifier
   * @returns Directions for the route
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Directions
   */
  async directions(routeId: number): Promise<DirectionsResponse> {
    return this.request(
      directionsPath(routeId),
      {},
      DirectionsResponseValidator,
    );
  }

  /**
   * Get all current service disruptions.
   * @description Returns current and planned disruptions across the network.
   * @param opts - Optional filters for route types and disruption modes
   * @returns All disruptions matching filters
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Disruptions
   */
  async disruptions(opts?: DisruptionOptions): Promise<DisruptionsResponse> {
    return this.request(
      DISRUPTIONS_PATH,
      buildDisruptionParams(opts),
      DisruptionsResponseValidator,
    );
  }

  /**
   * Get disruptions affecting a specific route.
   * @description Returns all current disruptions for a route.
   * @param routeId - Route identifier
   * @returns Disruptions for the route
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Disruptions
   */
  async disruptionsForRoute(routeId: number): Promise<DisruptionsResponse> {
    return this.request(
      disruptionsForRoutePath(routeId),
      {},
      DisruptionsResponseValidator,
    );
  }

  /**
   * Get disruptions affecting a specific stop.
   * @description Returns all current disruptions for a stop.
   * @param stopId - Stop identifier
   * @returns Disruptions for the stop
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Disruptions
   */
  async disruptionsForStop(stopId: number): Promise<DisruptionsResponse> {
    return this.request(
      disruptionsForStopPath(stopId),
      {},
      DisruptionsResponseValidator,
    );
  }

  /**
   * Get all runs for a route.
   * @description Returns service runs (trips) for a route, optionally filtered by date.
   * @param routeId - Route identifier
   * @param routeType - Transport mode type
   * @param opts - Optional date filter and expand options (VehiclePosition, VehicleDescriptor, etc.)
   * @returns Runs for the route
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Runs
   */
  async runs(
    routeId: number,
    routeType: number,
    opts?: ExtendedRunOptions,
  ): Promise<RunsResponse> {
    return this.request(
      runsPath(routeId, routeType),
      buildRunParams(opts),
      RunsResponseValidator,
    );
  }

  /**
   * Get direction name by direction ID.
   * @description Returns direction information for a given direction ID.
   * @param directionId - Direction identifier
   * @returns Direction details
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Directions
   */
  async directionsById(directionId: number): Promise<DirectionsResponse> {
    return this.request(
      directionsByIdPath(directionId),
      {},
      DirectionsResponseValidator,
    );
  }

  /**
   * Get direction name by direction ID and route type.
   * @description Returns direction information filtered by transport mode.
   * @param directionId - Direction identifier
   * @param routeType - Transport mode type
   * @returns Direction details
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Directions
   */
  async directionsByIdAndType(
    directionId: number,
    routeType: number,
  ): Promise<DirectionsResponse> {
    return this.request(
      directionsByIdAndTypePath(directionId, routeType),
      {},
      DirectionsResponseValidator,
    );
  }

  /**
   * Get details for a specific disruption.
   * @description Returns full disruption information including title, description, and affected services.
   * @param disruptionId - Disruption identifier
   * @returns Disruption details
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Disruptions
   */
  async disruptionById(disruptionId: number): Promise<DisruptionResponse> {
    return this.request(
      disruptionByIdPath(disruptionId),
      {},
      DisruptionResponseValidator,
    );
  }

  /**
   * Get all disruption mode types.
   * @description Returns available disruption mode identifiers (e.g., planned works, unplanned outage).
   * @returns List of disruption modes
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Disruptions
   */
  async disruptionModes(): Promise<DisruptionModesResponse> {
    return this.request(
      DISRUPTION_MODES_PATH,
      {},
      DisruptionModesResponseValidator,
    );
  }

  /**
   * Estimate fare for a journey between zones.
   * @description Returns myki fare estimates for journeys across zones.
   * @param minZone - Starting zone number
   * @param maxZone - Ending zone number
   * @param opts - Optional journey touch on/off times
   * @returns Fare estimate
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Fare_Estimate
   */
  async fareEstimate(
    minZone: number,
    maxZone: number,
    opts?: FareEstimateOptions,
  ): Promise<FareEstimateResponse> {
    return this.request(
      fareEstimatePath(minZone, maxZone),
      buildFareEstimateParams(opts),
      FareEstimateResponseValidator,
    );
  }

  /**
   * Get all myki ticket outlets.
   * @description Returns ticket outlet locations across the network.
   * @param opts - Optional max results filter
   * @returns List of ticket outlets
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Outlets
   */
  async outlets(opts?: OutletsOptions): Promise<OutletsResponse> {
    return this.request(
      OUTLETS_PATH,
      buildOutletsParams(opts),
      OutletsResponseValidator,
    );
  }

  /**
   * Find myki outlets near a location.
   * @description Returns ticket outlets within a specified distance of coordinates.
   * @param lat - Latitude in decimal degrees
   * @param lon - Longitude in decimal degrees
   * @param maxDistance - Maximum distance in meters
   * @param opts - Optional max results filter
   * @returns Outlets near the location
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Outlets
   */
  async outletsNearby(
    lat: number,
    lon: number,
    maxDistance: number,
    opts?: OutletsOptions,
  ): Promise<OutletsNearbyResponse> {
    return this.request(
      outletsNearbyPath(lat, lon, maxDistance),
      buildOutletsParams(opts),
      OutletsNearbyResponseValidator,
    );
  }

  /**
   * Get the stopping pattern for a specific run (trip).
   * @description Returns all stops along a run's journey with arrival/departure times.
   * @param runRef - Run reference identifier
   * @param routeType - Transport mode type
   * @param opts - Optional expand, stop ID, and date/time filters
   * @returns Stopping pattern with times for each stop
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Patterns
   */
  async stoppingPattern(
    runRef: string,
    routeType: number,
    opts?: StoppingPatternOptions,
  ): Promise<StoppingPatternResponse> {
    return this.request(
      stoppingPatternPath(runRef, routeType),
      buildStoppingPatternParams(opts),
      StoppingPatternResponseValidator,
    );
  }

  /**
   * Get run details by run reference.
   * @description Returns run information for all route types matching the run reference.
   * @param runRef - Run reference identifier
   * @param opts - Optional date filter and expand options
   * @returns Run details
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Runs
   */
  async runByRef(
    runRef: string,
    opts?: ExtendedRunOptions,
  ): Promise<RunsResponse> {
    return this.request(
      runByRefPath(runRef),
      buildRunParams(opts),
      RunsResponseValidator,
    );
  }

  /**
   * Get run details by run reference and route type.
   * @description Returns run information for a specific transport mode.
   * @param runRef - Run reference identifier
   * @param routeType - Transport mode type
   * @param opts - Optional date filter and expand options
   * @returns Run details
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Runs
   */
  async runByRefAndType(
    runRef: string,
    routeType: number,
    opts?: ExtendedRunOptions,
  ): Promise<RunResponse> {
    return this.request(
      runByRefAndTypePath(runRef, routeType),
      buildRunParams(opts),
      RunResponseValidator,
    );
  }

  /**
   * Get all runs for a route by route ID.
   * @description Returns all service runs for a route, optionally filtered by date.
   * @param routeId - Route identifier
   * @param opts - Optional date filter and expand options
   * @returns Runs for the route
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Runs
   */
  async runsForRoute(
    routeId: number,
    opts?: ExtendedRunOptions,
  ): Promise<RunsResponse> {
    return this.request(
      runsForRoutePath(routeId),
      buildRunParams(opts),
      RunsResponseValidator,
    );
  }

  /**
   * Get detailed information for a specific stop.
   * @description Returns stop name, location, amenities, accessibility, and routes serving the stop.
   * @param stopId - Stop identifier
   * @param routeType - Transport mode type
   * @param opts - Optional flags for stop location, amenities, accessibility, contact, ticket info, and disruptions
   * @returns Stop details with all requested information
   * @see https://timetableapi.ptv.vic.gov.au/swagger/ui/index#!/Stops
   */
  async stopDetails(
    stopId: number,
    routeType: number,
    opts?: StopDetailsOptions,
  ): Promise<StopDetailsResponse> {
    return this.request(
      stopDetailsPath(stopId, routeType),
      buildStopDetailsParams(opts),
      StopDetailsResponseValidator,
    );
  }
}
