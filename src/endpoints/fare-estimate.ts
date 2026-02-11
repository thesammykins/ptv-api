import { z } from "zod";
import { FareEstimateResultSchema, FareEstimateResultStatusSchema } from "../schemas/fare-estimate.js";

export function fareEstimatePath(minZone: number, maxZone: number): string {
  return `/v3/fare_estimate/min_zone/${minZone}/max_zone/${maxZone}`;
}

export interface FareEstimateOptions {
  journey_touch_on_utc?: string;
  journey_touch_off_utc?: string;
  is_journey_in_free_tram_zone?: boolean;
  is_journey_in_overlap_zone?: boolean;
  travelled_route_types?: number[];
}

export function buildFareEstimateParams(
  opts?: FareEstimateOptions,
): Record<string, string | boolean | number[]> {
  const params: Record<string, string | boolean | number[]> = {};
  if (opts?.journey_touch_on_utc !== undefined) params.journey_touch_on_utc = opts.journey_touch_on_utc;
  if (opts?.journey_touch_off_utc !== undefined) params.journey_touch_off_utc = opts.journey_touch_off_utc;
  if (opts?.is_journey_in_free_tram_zone !== undefined) params.is_journey_in_free_tram_zone = opts.is_journey_in_free_tram_zone;
  if (opts?.is_journey_in_overlap_zone !== undefined) params.is_journey_in_overlap_zone = opts.is_journey_in_overlap_zone;
  if (opts?.travelled_route_types !== undefined) params.travelled_route_types = opts.travelled_route_types;
  return params;
}

export const FareEstimateResponseValidator = z.object({
  FareEstimateResultStatus: FareEstimateResultStatusSchema.optional(),
  FareEstimateResult: FareEstimateResultSchema.optional(),
}).passthrough();

export type FareEstimateResult = z.infer<typeof FareEstimateResponseValidator>;
