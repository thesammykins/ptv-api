import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { StopSchema } from "../schemas/stop.js";
import { DisruptionSchema } from "../schemas/disruption.js";
import type { NearbyOptions, StopsRouteOptions } from "../types.js";

export function stopsNearbyPath(lat: number, lon: number): string {
  return `/v3/stops/location/${lat},${lon}`;
}

export function stopsOnRoutePath(routeId: number, routeType: number): string {
  return `/v3/stops/route/${routeId}/route_type/${routeType}`;
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

export type StopsLocationResult = z.infer<typeof StopsLocationResponseValidator>;
export type StopsRouteResult = z.infer<typeof StopsRouteResponseValidator>;
