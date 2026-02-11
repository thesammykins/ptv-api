import { z } from "zod";

export const StatusResponseSchema = z.object({
  version: z.string(),
  health: z.number(),
}).passthrough();
