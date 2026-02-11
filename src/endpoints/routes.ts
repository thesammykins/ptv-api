import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { RouteSchema } from "../schemas/route.js";
import type { RoutesOptions } from "../types.js";

export const ROUTES_PATH = "/v3/routes";

export function routePath(routeId: number): string {
  return `/v3/routes/${routeId}`;
}

export function buildRoutesParams(
  opts?: RoutesOptions,
): Record<string, string | number | number[]> {
  const params: Record<string, string | number | number[]> = {};
  if (opts?.route_types?.length) params.route_types = opts.route_types;
  if (opts?.route_name) params.route_name = opts.route_name;
  return params;
}

export const RoutesResponseValidator = z.object({
  routes: z.array(RouteSchema),
  status: StatusResponseSchema,
}).passthrough();

export const RouteResponseValidator = z.object({
  route: RouteSchema,
  status: StatusResponseSchema,
}).passthrough();

export type RoutesResult = z.infer<typeof RoutesResponseValidator>;
export type RouteResult = z.infer<typeof RouteResponseValidator>;
