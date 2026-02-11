import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { OutletSchema, OutletGeolocationSchema } from "../schemas/outlet.js";

export const OUTLETS_PATH = "/v3/outlets";

export function outletsNearbyPath(lat: number, lon: number, maxDistance: number): string {
  return `/v3/outlets/location/${lat},${lon},${maxDistance}`;
}

export interface OutletsOptions {
  max_results?: number;
}

export function buildOutletsParams(
  opts?: OutletsOptions,
): Record<string, number> {
  const params: Record<string, number> = {};
  if (opts?.max_results !== undefined) params.max_results = opts.max_results;
  return params;
}

export const OutletsResponseValidator = z.object({
  outlets: z.array(OutletSchema),
  status: StatusResponseSchema,
}).passthrough();

export const OutletsNearbyResponseValidator = z.object({
  outlets: z.array(OutletGeolocationSchema),
  status: StatusResponseSchema,
}).passthrough();

export type OutletsResult = z.infer<typeof OutletsResponseValidator>;
export type OutletsNearbyResult = z.infer<typeof OutletsNearbyResponseValidator>;
