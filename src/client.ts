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
  buildNearbyParams,
  buildStopsRouteParams,
  StopsLocationResponseValidator,
  StopsRouteResponseValidator,
} from "./endpoints/stops.js";
import {
  directionsPath,
  DirectionsResponseValidator,
} from "./endpoints/directions.js";
import {
  DISRUPTIONS_PATH,
  disruptionsForRoutePath,
  disruptionsForStopPath,
  buildDisruptionParams,
  DisruptionsResponseValidator,
} from "./endpoints/disruptions.js";
import {
  runsPath,
  buildRunParams,
  RunsResponseValidator,
} from "./endpoints/runs.js";
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
  DisruptionOptions,
  RunsResponse,
  RunOptions,
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
      body = await response.json();
    } catch {
      throw new PTVNetworkError(path, new TypeError("Invalid JSON response"));
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
    opts?: RunOptions,
  ): Promise<RunsResponse> {
    return this.request(
      runsPath(routeId, routeType),
      buildRunParams(opts),
      RunsResponseValidator,
    );
  }
}
