import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { RunSchema } from "../schemas/run.js";
import type { RunOptions } from "../types.js";

export function runsPath(routeId: number, routeType: number): string {
  return `/v3/runs/route/${routeId}/route_type/${routeType}`;
}

export function buildRunParams(
  opts?: RunOptions,
): Record<string, string[]> {
  const params: Record<string, string[]> = {};
  if (opts?.expand?.length) params.expand = opts.expand;
  return params;
}

export const RunsResponseValidator = z.object({
  runs: z.array(RunSchema),
  status: StatusResponseSchema,
}).passthrough();

export type RunsResult = z.infer<typeof RunsResponseValidator>;
