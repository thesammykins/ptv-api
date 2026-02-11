import { z } from "zod";

export const DepartureSchema = z.object({
  stop_id: z.number(),
  route_id: z.number(),
  run_id: z.number(),
  run_ref: z.string(),
  direction_id: z.number(),
  scheduled_departure_utc: z.string(),
  estimated_departure_utc: z.string().nullable(),
  at_platform: z.boolean(),
  platform_number: z.string().nullable(),
  flags: z.string(),
  departure_sequence: z.number(),
  disruption_ids: z.array(z.number()),
}).passthrough();
