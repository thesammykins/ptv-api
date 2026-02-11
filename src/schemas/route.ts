import { z } from "zod";

export const RouteServiceStatusSchema = z.object({
  description: z.string().optional(),
  timestamp: z.string().optional(),
}).passthrough();

export const RouteSchema = z.object({
  route_id: z.number(),
  route_type: z.number(),
  route_number: z.string().optional(),
  route_name: z.string(),
  route_gtfs_id: z.string().optional(),
  route_service_status: RouteServiceStatusSchema.optional(),
}).passthrough();

export const RouteTypeSchema = z.object({
  route_type_name: z.string(),
  route_type: z.number(),
}).passthrough();
