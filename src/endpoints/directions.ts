import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { DirectionSchema } from "../schemas/direction.js";

export function directionsPath(routeId: number): string {
  return `/v3/directions/route/${routeId}`;
}

export function directionsByIdPath(directionId: number): string {
  return `/v3/directions/${directionId}`;
}

export function directionsByIdAndTypePath(
  directionId: number,
  routeType: number,
): string {
  return `/v3/directions/${directionId}/route_type/${routeType}`;
}

export const DirectionsResponseValidator = z.object({
  directions: z.array(DirectionSchema),
  status: StatusResponseSchema,
}).passthrough();

export type DirectionsResult = z.infer<typeof DirectionsResponseValidator>;
