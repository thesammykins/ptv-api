import { z } from "zod";

export const SearchResultStopSchema = z.object({
  stop_id: z.number(),
  stop_name: z.string(),
  stop_latitude: z.number().optional(),
  stop_longitude: z.number().optional(),
  stop_suburb: z.string().optional(),
  route_type: z.number().optional(),
}).passthrough();

export const SearchResultRouteSchema = z.object({
  route_id: z.number(),
  route_name: z.string(),
  route_type: z.number().optional(),
  route_number: z.string().optional(),
}).passthrough();

export const SearchResultOutletSchema = z.object({
  outlet_name: z.string().optional(),
  outlet_suburb: z.string().optional(),
  outlet_latitude: z.number().optional(),
  outlet_longitude: z.number().optional(),
}).passthrough();
