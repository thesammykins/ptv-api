import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { DepartureSchema } from "../schemas/departure.js";
import { StopSchema } from "../schemas/stop.js";
import { RouteSchema } from "../schemas/route.js";
import { RunSchema } from "../schemas/run.js";
import { DirectionSchema } from "../schemas/direction.js";
import { DisruptionSchema } from "../schemas/disruption.js";
import type { PatternExpand } from "../types.js";

export function stoppingPatternPath(runRef: string, routeType: number): string {
  return `/v3/pattern/run/${runRef}/route_type/${routeType}`;
}

export interface StoppingPatternOptions {
  expand?: PatternExpand[];
  stop_id?: number;
  date_utc?: string;
  include_skipped_stops?: boolean;
  include_geopath?: boolean;
}

export function buildStoppingPatternParams(
  opts?: StoppingPatternOptions,
): Record<string, string | number | boolean | string[]> {
  const params: Record<string, string | number | boolean | string[]> = {};
  if (opts?.expand?.length) params.expand = opts.expand;
  if (opts?.stop_id !== undefined) params.stop_id = opts.stop_id;
  if (opts?.date_utc) params.date_utc = opts.date_utc;
  if (opts?.include_skipped_stops !== undefined) params.include_skipped_stops = opts.include_skipped_stops;
  if (opts?.include_geopath !== undefined) params.include_geopath = opts.include_geopath;
  return params;
}

export const StoppingPatternResponseValidator = z.object({
  departures: z.array(DepartureSchema),
  stops: z.record(z.string(), StopSchema).default({}),
  routes: z.record(z.string(), RouteSchema).default({}),
  runs: z.record(z.string(), RunSchema).default({}),
  directions: z.record(z.string(), DirectionSchema).default({}),
  disruptions: z.array(DisruptionSchema).default([]),
  status: StatusResponseSchema,
}).passthrough();

export type StoppingPatternResult = z.infer<typeof StoppingPatternResponseValidator>;
