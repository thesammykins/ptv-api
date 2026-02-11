import { z } from "zod";

export const DirectionSchema = z.object({
  direction_id: z.number(),
  direction_name: z.string(),
  route_id: z.number().optional(),
  route_type: z.number().optional(),
}).passthrough();
