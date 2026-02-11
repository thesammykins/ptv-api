import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { RunSchema } from "../schemas/run.js";
import type { RunOptions } from "../types.js";

export interface ExtendedRunOptions {
  expand?: string[];
  date_utc?: string;
  include_geopath?: boolean;
}

export function runsPath(routeId: number, routeType: number): string {
  return `/v3/runs/route/${routeId}/route_type/${routeType}`;
}

export function runByRefPath(runRef: string): string {
  return `/v3/runs/${runRef}`;
}

export function runByRefAndTypePath(runRef: string, routeType: number): string {
  return `/v3/runs/${runRef}/route_type/${routeType}`;
}

export function runsForRoutePath(routeId: number): string {
  return `/v3/runs/route/${routeId}`;
}

export function buildRunParams(
  opts?: ExtendedRunOptions,
): Record<string, string | boolean | string[]> {
  const params: Record<string, string | boolean | string[]> = {};
  if (opts?.expand?.length) params.expand = opts.expand;
  if (opts?.date_utc) params.date_utc = opts.date_utc;
  if (opts?.include_geopath !== undefined) params.include_geopath = opts.include_geopath;
  return params;
}

export const RunsResponseValidator = z.object({
  runs: z.array(RunSchema),
  status: StatusResponseSchema,
}).passthrough();

export const RunResponseValidator = z.object({
  run: RunSchema,
  status: StatusResponseSchema,
}).passthrough();

export type RunsResult = z.infer<typeof RunsResponseValidator>;
export type RunResult = z.infer<typeof RunResponseValidator>;
