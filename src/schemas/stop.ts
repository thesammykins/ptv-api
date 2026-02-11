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

export const StopGpsSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).passthrough();

export const StopLocationSchema = z.object({
  gps: StopGpsSchema.optional(),
}).passthrough();

export const StopAccessibilityWheelchairSchema = z.object({
  accessible_ramp: z.boolean().optional(),
  parking: z.boolean().optional(),
  telephone: z.boolean().optional(),
  toilet: z.boolean().optional(),
  low_ticket_counter: z.boolean().optional(),
  manouvering: z.boolean().optional(),
  raised_platform: z.boolean().optional(),
  ramp: z.boolean().optional(),
  secondary_path: z.boolean().optional(),
  raised_platform_shelther: z.boolean().optional(),
  steep_ramp: z.boolean().optional(),
}).passthrough();

export const StopAccessibilitySchema = z.object({
  lighting: z.boolean().optional(),
  platform_number: z.number().optional(),
  audio_customer_information: z.boolean().optional(),
  escalator: z.boolean().optional(),
  hearing_loop: z.boolean().optional(),
  lift: z.boolean().optional(),
  stairs: z.boolean().optional(),
  stop_accessible: z.boolean().optional(),
  tactile_ground_surface_indicator: z.boolean().optional(),
  waiting_room: z.boolean().optional(),
  wheelchair: StopAccessibilityWheelchairSchema.optional(),
}).passthrough();

export const StopAmenityDetailsSchema = z.object({
  toilet: z.boolean().optional(),
  taxi_rank: z.boolean().optional(),
  car_parking: z.string().optional(),
  cctv: z.boolean().optional(),
}).passthrough();

export const StopDetailsSchema = z.object({
  stop_id: z.number(),
  stop_name: z.string(),
  route_type: z.number().optional(),
  station_type: z.string().nullable().optional(),
  station_description: z.string().nullable().optional(),
  stop_location: StopLocationSchema.nullable().optional(),
  stop_amenities: StopAmenityDetailsSchema.nullable().optional(),
  stop_accessibility: StopAccessibilitySchema.nullable().optional(),
  stop_landmark: z.string().nullable().optional(),
  disruption_ids: z.array(z.number()).optional(),
  routes: z.array(z.unknown()).optional(),
}).passthrough();
