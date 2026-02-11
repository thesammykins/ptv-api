import type { z } from "zod";
import type { StatusResponseSchema } from "./schemas/common.js";
import type { DepartureSchema } from "./schemas/departure.js";
import type { StopSchema } from "./schemas/stop.js";
import type { RouteSchema, RouteTypeSchema, RouteServiceStatusSchema } from "./schemas/route.js";
import type { DirectionSchema } from "./schemas/direction.js";
import type { DisruptionSchema, DisruptionRouteSchema, DisruptionStopSchema } from "./schemas/disruption.js";
import type { RunSchema, VehiclePositionSchema, VehicleDescriptorSchema } from "./schemas/run.js";
import type { SearchResultStopSchema, SearchResultRouteSchema, SearchResultOutletSchema } from "./schemas/search.js";
import type { RouteTypesResponseValidator } from "./endpoints/route-types.js";
import type { RoutesResponseValidator, RouteResponseValidator } from "./endpoints/routes.js";
import type { SearchResponseValidator } from "./endpoints/search.js";
import type { DepartureResponseValidator } from "./endpoints/departures.js";
import type { StopsLocationResponseValidator, StopsRouteResponseValidator } from "./endpoints/stops.js";
import type { DirectionsResponseValidator } from "./endpoints/directions.js";
import type { DisruptionsResponseValidator } from "./endpoints/disruptions.js";
import type { RunsResponseValidator } from "./endpoints/runs.js";

// Entity types (inferred from Zod schemas)
export type StatusResponse = z.infer<typeof StatusResponseSchema>;
export type Departure = z.infer<typeof DepartureSchema>;
export type Stop = z.infer<typeof StopSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type RouteType = z.infer<typeof RouteTypeSchema>;
export type RouteServiceStatus = z.infer<typeof RouteServiceStatusSchema>;
export type Direction = z.infer<typeof DirectionSchema>;
export type Disruption = z.infer<typeof DisruptionSchema>;
export type DisruptionRoute = z.infer<typeof DisruptionRouteSchema>;
export type DisruptionStop = z.infer<typeof DisruptionStopSchema>;
export type Run = z.infer<typeof RunSchema>;
export type VehiclePosition = z.infer<typeof VehiclePositionSchema>;
export type VehicleDescriptor = z.infer<typeof VehicleDescriptorSchema>;
export type SearchResultStop = z.infer<typeof SearchResultStopSchema>;
export type SearchResultRoute = z.infer<typeof SearchResultRouteSchema>;
export type SearchResultOutlet = z.infer<typeof SearchResultOutletSchema>;

// Response types (inferred from endpoint Zod validators)
// Healthcheck uses route_types endpoint (v3 has no dedicated healthcheck)
export type HealthcheckResponse = z.infer<typeof RouteTypesResponseValidator>;
export type RouteTypesResponse = z.infer<typeof RouteTypesResponseValidator>;
export type RoutesResponse = z.infer<typeof RoutesResponseValidator>;
export type RouteResponse = z.infer<typeof RouteResponseValidator>;
export type SearchResponse = z.infer<typeof SearchResponseValidator>;
export type DepartureResponse = z.infer<typeof DepartureResponseValidator>;
export type StopsLocationResponse = z.infer<typeof StopsLocationResponseValidator>;
export type StopsRouteResponse = z.infer<typeof StopsRouteResponseValidator>;
export type DirectionsResponse = z.infer<typeof DirectionsResponseValidator>;
export type DisruptionsResponse = z.infer<typeof DisruptionsResponseValidator>;
export type RunsResponse = z.infer<typeof RunsResponseValidator>;

// Endpoint option types
export interface RoutesOptions {
  route_types?: number[];
  route_name?: string;
}

export interface SearchOptions {
  route_types?: number[];
  latitude?: number;
  longitude?: number;
  max_results?: number;
  include_outlets?: boolean;
}

export interface DepartureOptions {
  direction_id?: number;
  max_results?: number;
  expand?: string[];
  date_utc?: string;
}

export interface NearbyOptions {
  route_types?: number[];
  max_distance?: number;
  max_results?: number;
}

export interface StopsRouteOptions {
  direction_id?: number;
}

export interface DisruptionOptions {
  route_types?: number[];
  disruption_status?: "current" | "planned";
}

export interface RunOptions {
  expand?: string[];
}
