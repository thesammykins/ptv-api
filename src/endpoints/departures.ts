import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { DepartureSchema } from "../schemas/departure.js";
import { StopSchema } from "../schemas/stop.js";
import { RouteSchema } from "../schemas/route.js";
import { RunSchema } from "../schemas/run.js";
import { DirectionSchema } from "../schemas/direction.js";
import { DisruptionSchema } from "../schemas/disruption.js";
import type { DepartureOptions } from "../types.js";

export function departuresPath(routeType: number, stopId: number): string {
  return `/v3/departures/route_type/${routeType}/stop/${stopId}`;
}

export function departuresForRoutePath(
  routeType: number,
  stopId: number,
  routeId: number,
): string {
  return `/v3/departures/route_type/${routeType}/stop/${stopId}/route/${routeId}`;
}

export function buildDepartureParams(
  opts?: DepartureOptions,
): Record<string, string | number | string[]> {
  const params: Record<string, string | number | string[]> = {};
  if (opts?.direction_id !== undefined) params.direction_id = opts.direction_id;
  if (opts?.max_results !== undefined) params.max_results = opts.max_results;
  if (opts?.expand?.length) params.expand = opts.expand;
  if (opts?.date_utc) params.date_utc = opts.date_utc;
  return params;
}

export const DepartureResponseValidator = z.object({
  departures: z.array(DepartureSchema),
  stops: z.record(z.string(), StopSchema).default({}),
  routes: z.record(z.string(), RouteSchema).default({}),
  runs: z.record(z.string(), RunSchema).default({}),
  directions: z.record(z.string(), DirectionSchema).default({}),
  disruptions: z.record(z.string(), DisruptionSchema).default({}),
  status: StatusResponseSchema,
}).passthrough();

export type DepartureResult = z.infer<typeof DepartureResponseValidator>;
