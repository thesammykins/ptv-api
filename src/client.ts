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

export class PTVClient {
  private readonly credentials: SigningCredentials;
  private readonly baseUrl: string;
  private readonly requestManager: RequestManager;

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

  async healthcheck(): Promise<HealthcheckResponse> {
    return this.request(
      HEALTHCHECK_PATH,
      buildHealthcheckParams(),
      HealthcheckResponseValidator,
    );
  }

  async routeTypes(): Promise<RouteTypesResponse> {
    return this.request(
      ROUTE_TYPES_PATH,
      buildRouteTypesParams(),
      RouteTypesResponseValidator,
    );
  }

  async routes(opts?: RoutesOptions): Promise<RoutesResponse> {
    return this.request(
      ROUTES_PATH,
      buildRoutesParams(opts),
      RoutesResponseValidator,
    );
  }

  async route(routeId: number): Promise<RouteResponse> {
    return this.request(
      routePath(routeId),
      {},
      RouteResponseValidator,
    );
  }

  async search(term: string, opts?: SearchOptions): Promise<SearchResponse> {
    return this.request(
      searchPath(term),
      buildSearchParams(opts),
      SearchResponseValidator,
    );
  }

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

  async directions(routeId: number): Promise<DirectionsResponse> {
    return this.request(
      directionsPath(routeId),
      {},
      DirectionsResponseValidator,
    );
  }

  async disruptions(opts?: DisruptionOptions): Promise<DisruptionsResponse> {
    return this.request(
      DISRUPTIONS_PATH,
      buildDisruptionParams(opts),
      DisruptionsResponseValidator,
    );
  }

  async disruptionsForRoute(routeId: number): Promise<DisruptionsResponse> {
    return this.request(
      disruptionsForRoutePath(routeId),
      {},
      DisruptionsResponseValidator,
    );
  }

  async disruptionsForStop(stopId: number): Promise<DisruptionsResponse> {
    return this.request(
      disruptionsForStopPath(stopId),
      {},
      DisruptionsResponseValidator,
    );
  }

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

  async directionsById(directionId: number): Promise<DirectionsResponse> {
    return this.request(
      directionsByIdPath(directionId),
      {},
      DirectionsResponseValidator,
    );
  }

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

  async disruptionById(disruptionId: number): Promise<DisruptionResponse> {
    return this.request(
      disruptionByIdPath(disruptionId),
      {},
      DisruptionResponseValidator,
    );
  }

  async disruptionModes(): Promise<DisruptionModesResponse> {
    return this.request(
      DISRUPTION_MODES_PATH,
      {},
      DisruptionModesResponseValidator,
    );
  }

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

  async outlets(opts?: OutletsOptions): Promise<OutletsResponse> {
    return this.request(
      OUTLETS_PATH,
      buildOutletsParams(opts),
      OutletsResponseValidator,
    );
  }

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
