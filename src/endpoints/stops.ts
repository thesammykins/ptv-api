import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { StopSchema, StopDetailsSchema } from "../schemas/stop.js";
import { DisruptionSchema } from "../schemas/disruption.js";
import type { NearbyOptions, StopsRouteOptions } from "../types.js";

export interface StopDetailsOptions {
  stop_location?: boolean;
  stop_amenities?: boolean;
  stop_accessibility?: boolean;
  stop_contact?: boolean;
  stop_ticket?: boolean;
  gtfs?: boolean;
  stop_staffing?: boolean;
  stop_disruptions?: boolean;
}

export function stopsNearbyPath(lat: number, lon: number): string {
  return `/v3/stops/location/${lat},${lon}`;
}

export function stopsOnRoutePath(routeId: number, routeType: number): string {
  return `/v3/stops/route/${routeId}/route_type/${routeType}`;
}

export function stopDetailsPath(stopId: number, routeType: number): string {
  return `/v3/stops/${stopId}/route_type/${routeType}`;
}

export function buildNearbyParams(
  opts?: NearbyOptions,
): Record<string, number | number[]> {
  const params: Record<string, number | number[]> = {};
  if (opts?.route_types?.length) params.route_types = opts.route_types;
  if (opts?.max_distance !== undefined) params.max_distance = opts.max_distance;
  if (opts?.max_results !== undefined) params.max_results = opts.max_results;
  return params;
}

export function buildStopsRouteParams(
  opts?: StopsRouteOptions,
): Record<string, number> {
  const params: Record<string, number> = {};
  if (opts?.direction_id !== undefined) params.direction_id = opts.direction_id;
  return params;
}

export function buildStopDetailsParams(
  opts?: StopDetailsOptions,
): Record<string, boolean> {
  const params: Record<string, boolean> = {};
  if (opts?.stop_location !== undefined) params.stop_location = opts.stop_location;
  if (opts?.stop_amenities !== undefined) params.stop_amenities = opts.stop_amenities;
  if (opts?.stop_accessibility !== undefined) params.stop_accessibility = opts.stop_accessibility;
  if (opts?.stop_contact !== undefined) params.stop_contact = opts.stop_contact;
  if (opts?.stop_ticket !== undefined) params.stop_ticket = opts.stop_ticket;
  if (opts?.gtfs !== undefined) params.gtfs = opts.gtfs;
  if (opts?.stop_staffing !== undefined) params.stop_staffing = opts.stop_staffing;
  if (opts?.stop_disruptions !== undefined) params.stop_disruptions = opts.stop_disruptions;
  return params;
}

export const StopsLocationResponseValidator = z.object({
  stops: z.array(StopSchema),
  disruptions: z.record(z.string(), DisruptionSchema).optional(),
  status: StatusResponseSchema,
}).passthrough();

export const StopsRouteResponseValidator = z.object({
  stops: z.array(StopSchema),
  disruptions: z.record(z.string(), DisruptionSchema).optional(),
  status: StatusResponseSchema,
}).passthrough();

export const StopDetailsResponseValidator = z.object({
  stop: StopDetailsSchema,
  disruptions: z.record(z.string(), DisruptionSchema).optional(),
  status: StatusResponseSchema,
}).passthrough();

export type StopsLocationResult = z.infer<typeof StopsLocationResponseValidator>;
export type StopsRouteResult = z.infer<typeof StopsRouteResponseValidator>;
export type StopDetailsResult = z.infer<typeof StopDetailsResponseValidator>;
