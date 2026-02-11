import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { DisruptionSchema, DisruptionModeSchema } from "../schemas/disruption.js";
import type { DisruptionOptions } from "../types.js";

export const DISRUPTIONS_PATH = "/v3/disruptions";
export const DISRUPTION_MODES_PATH = "/v3/disruptions/modes";

export function disruptionByIdPath(disruptionId: number): string {
  return `/v3/disruptions/${disruptionId}`;
}

export function disruptionsForRoutePath(routeId: number): string {
  return `/v3/disruptions/route/${routeId}`;
}

export function disruptionsForStopPath(stopId: number): string {
  return `/v3/disruptions/stop/${stopId}`;
}

export function buildDisruptionParams(
  opts?: DisruptionOptions,
): Record<string, string | number[]> {
  const params: Record<string, string | number[]> = {};
  if (opts?.route_types?.length) params.route_types = opts.route_types;
  if (opts?.disruption_status) params.disruption_status = opts.disruption_status;
  return params;
}

export const DisruptionsResponseValidator = z.object({
  disruptions: z.record(z.string(), z.array(DisruptionSchema)).default({}),
  status: StatusResponseSchema,
}).passthrough();

export type DisruptionsResult = z.infer<typeof DisruptionsResponseValidator>;

export const DisruptionResponseValidator = z.object({
  disruption: DisruptionSchema,
  status: StatusResponseSchema,
}).passthrough();

export type DisruptionResult = z.infer<typeof DisruptionResponseValidator>;

export const DisruptionModesResponseValidator = z.object({
  disruption_modes: z.array(DisruptionModeSchema),
  status: StatusResponseSchema,
}).passthrough();

export type DisruptionModesResult = z.infer<typeof DisruptionModesResponseValidator>;
