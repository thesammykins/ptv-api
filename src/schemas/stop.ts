import { z } from "zod";
import { RouteSchema } from "./route.js";

export const StopSchema = z.object({
  stop_id: z.number(),
  stop_name: z.string(),
  stop_latitude: z.number().optional(),
  stop_longitude: z.number().optional(),
  stop_distance: z.number().optional(),
  stop_suburb: z.string().optional(),
  stop_landmark: z.string().optional(),
  route_type: z.number().optional(),
  stop_sequence: z.number().optional(),
  routes: z.array(z.lazy(() => RouteSchema)).optional(),
}).passthrough();
