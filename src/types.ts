import type { z } from "zod";
import type { StatusResponseSchema } from "./schemas/common.js";
import type { DepartureSchema } from "./schemas/departure.js";
import type { StopSchema, StopGpsSchema, StopLocationSchema, StopAccessibilityWheelchairSchema, StopAccessibilitySchema, StopAmenityDetailsSchema, StopDetailsSchema } from "./schemas/stop.js";
import type { RouteSchema, RouteTypeSchema, RouteServiceStatusSchema } from "./schemas/route.js";
import type { DirectionSchema } from "./schemas/direction.js";
import type { DisruptionSchema, DisruptionRouteSchema, DisruptionStopSchema, DisruptionModeSchema } from "./schemas/disruption.js";
import type { RunSchema, VehiclePositionSchema, VehicleDescriptorSchema } from "./schemas/run.js";
import type { SearchResultStopSchema, SearchResultRouteSchema, SearchResultOutletSchema } from "./schemas/search.js";
import type { OutletSchema, OutletGeolocationSchema } from "./schemas/outlet.js";
import type { PassengerFareSchema, ZoneInfoSchema, FareEstimateResultStatusSchema } from "./schemas/fare-estimate.js";
import type { RouteTypesResponseValidator } from "./endpoints/route-types.js";
import type { RoutesResponseValidator, RouteResponseValidator } from "./endpoints/routes.js";
import type { SearchResponseValidator } from "./endpoints/search.js";
import type { DepartureResponseValidator } from "./endpoints/departures.js";
import type { StopsLocationResponseValidator, StopsRouteResponseValidator, StopDetailsResponseValidator } from "./endpoints/stops.js";
import type { DirectionsResponseValidator } from "./endpoints/directions.js";
import type { DisruptionsResponseValidator, DisruptionResponseValidator, DisruptionModesResponseValidator } from "./endpoints/disruptions.js";
import type { RunsResponseValidator, RunResponseValidator } from "./endpoints/runs.js";
import type { FareEstimateResponseValidator } from "./endpoints/fare-estimate.js";
import type { OutletsResponseValidator, OutletsNearbyResponseValidator } from "./endpoints/outlets.js";
import type { StoppingPatternResponseValidator } from "./endpoints/patterns.js";

// Re-export option interfaces from endpoint modules
export type { FareEstimateOptions } from "./endpoints/fare-estimate.js";
export type { OutletsOptions } from "./endpoints/outlets.js";
export type { StoppingPatternOptions } from "./endpoints/patterns.js";
export type { ExtendedRunOptions } from "./endpoints/runs.js";
export type { StopDetailsOptions } from "./endpoints/stops.js";

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
export type DisruptionMode = z.infer<typeof DisruptionModeSchema>;
export type Run = z.infer<typeof RunSchema>;
export type VehiclePosition = z.infer<typeof VehiclePositionSchema>;
export type VehicleDescriptor = z.infer<typeof VehicleDescriptorSchema>;
export type SearchResultStop = z.infer<typeof SearchResultStopSchema>;
export type SearchResultRoute = z.infer<typeof SearchResultRouteSchema>;
export type SearchResultOutlet = z.infer<typeof SearchResultOutletSchema>;
export type Outlet = z.infer<typeof OutletSchema>;
export type OutletGeolocation = z.infer<typeof OutletGeolocationSchema>;
export type PassengerFare = z.infer<typeof PassengerFareSchema>;
export type ZoneInfo = z.infer<typeof ZoneInfoSchema>;
export type FareEstimateResultStatus = z.infer<typeof FareEstimateResultStatusSchema>;
export type StopDetails = z.infer<typeof StopDetailsSchema>;
export type StopGps = z.infer<typeof StopGpsSchema>;
export type StopLocation = z.infer<typeof StopLocationSchema>;
export type StopAccessibility = z.infer<typeof StopAccessibilitySchema>;
export type StopAccessibilityWheelchair = z.infer<typeof StopAccessibilityWheelchairSchema>;
export type StopAmenityDetails = z.infer<typeof StopAmenityDetailsSchema>;

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
export type StopDetailsResponse = z.infer<typeof StopDetailsResponseValidator>;
export type DirectionsResponse = z.infer<typeof DirectionsResponseValidator>;
export type DisruptionsResponse = z.infer<typeof DisruptionsResponseValidator>;
export type DisruptionResponse = z.infer<typeof DisruptionResponseValidator>;
export type DisruptionModesResponse = z.infer<typeof DisruptionModesResponseValidator>;
export type RunsResponse = z.infer<typeof RunsResponseValidator>;
export type RunResponse = z.infer<typeof RunResponseValidator>;
export type FareEstimateResponse = z.infer<typeof FareEstimateResponseValidator>;
export type OutletsResponse = z.infer<typeof OutletsResponseValidator>;
export type OutletsNearbyResponse = z.infer<typeof OutletsNearbyResponseValidator>;
export type StoppingPatternResponse = z.infer<typeof StoppingPatternResponseValidator>;

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

// Expand parameter literal union types per endpoint
export type DepartureExpand = "all" | "stop" | "route" | "run" | "direction" | "disruption" | "VehicleDescriptor" | "VehiclePosition" | "none";
export type RunExpand = "all" | "VehicleDescriptor" | "VehiclePosition" | "none";
export type PatternExpand = "all" | "stop" | "route" | "run" | "direction" | "disruption" | "VehicleDescriptor" | "VehiclePosition" | "none";

export interface DepartureOptions {
  direction_id?: number;
  max_results?: number;
  expand?: DepartureExpand[];
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
  expand?: RunExpand[];
}
