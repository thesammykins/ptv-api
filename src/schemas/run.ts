import { z } from "zod";

export const VehiclePositionSchema = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  bearing: z.number().nullable().optional(),
  datetime_utc: z.string().optional(),
  supplier: z.string().optional(),
}).passthrough();

export const VehicleDescriptorSchema = z.object({
  operator: z.string().optional(),
  description: z.string().optional(),
  length: z.string().optional(),
  low_floor: z.boolean().optional(),
  air_conditioned: z.boolean().optional(),
}).passthrough();

export const RunSchema = z.object({
  run_id: z.number(),
  run_ref: z.string(),
  route_id: z.number().optional(),
  route_type: z.number().optional(),
  direction_id: z.number().optional(),
  destination_name: z.string().optional(),
  status: z.string().optional(),
  express_stop_count: z.number().optional(),
  vehicle_position: VehiclePositionSchema.nullable().optional(),
  vehicle_descriptor: VehicleDescriptorSchema.nullable().optional(),
}).passthrough();
