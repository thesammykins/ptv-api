import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { RouteTypeSchema } from "../schemas/route.js";

export const ROUTE_TYPES_PATH = "/v3/route_types";

export function buildRouteTypesParams(): Record<string, never> {
  return {};
}

export const RouteTypesResponseValidator = z.object({
  route_types: z.array(RouteTypeSchema),
  status: StatusResponseSchema,
}).passthrough();

export type RouteTypesResult = z.infer<typeof RouteTypesResponseValidator>;
