import { z } from "zod";
import { DirectionSchema } from "./direction.js";

export const DisruptionStopSchema = z.object({
  stop_id: z.number().optional(),
  stop_name: z.string().optional(),
}).passthrough();

export const DisruptionRouteSchema = z.object({
  route_type: z.number().optional(),
  route_id: z.number().optional(),
  route_name: z.string().optional(),
  route_number: z.string().optional(),
  direction: DirectionSchema.nullable().optional(),
}).passthrough();

export const DisruptionSchema = z.object({
  disruption_id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  disruption_status: z.string().optional(),
  disruption_type: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().nullable().optional(),
  routes: z.array(DisruptionRouteSchema).optional(),
  stops: z.array(DisruptionStopSchema).optional(),
  colour: z.string().optional(),
  display_on_board: z.boolean().optional(),
  display_status: z.boolean().optional(),
}).passthrough();

export const DisruptionModeSchema = z.object({
  disruption_mode_name: z.string(),
  disruption_mode: z.number(),
}).passthrough();
