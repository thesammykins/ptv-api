import { z } from "zod";

export const OutletSchema = z.object({
  outlet_slid_spid: z.string().optional(),
  outlet_name: z.string().optional(),
  outlet_business: z.string().optional(),
  outlet_latitude: z.number().optional(),
  outlet_longitude: z.number().optional(),
  outlet_suburb: z.string().optional(),
  outlet_postcode: z.number().optional(),
  outlet_business_hour_mon: z.string().optional(),
  outlet_business_hour_tue: z.string().optional(),
  outlet_business_hour_wed: z.string().optional(),
  outlet_business_hour_thur: z.string().optional(),
  outlet_business_hour_fri: z.string().optional(),
  outlet_business_hour_sat: z.string().optional(),
  outlet_business_hour_sun: z.string().optional(),
  outlet_notes: z.string().nullable().optional(),
}).passthrough();

export const OutletGeolocationSchema = z.object({
  outlet_distance: z.number().optional(),
  outlet_slid_spid: z.string().optional(),
  outlet_name: z.string().optional(),
  outlet_business: z.string().optional(),
  outlet_latitude: z.number().optional(),
  outlet_longitude: z.number().optional(),
  outlet_suburb: z.string().optional(),
  outlet_postcode: z.number().optional(),
  outlet_business_hour_mon: z.string().optional(),
  outlet_business_hour_tue: z.string().optional(),
  outlet_business_hour_wed: z.string().optional(),
  outlet_business_hour_thur: z.string().optional(),
  outlet_business_hour_fri: z.string().optional(),
  outlet_business_hour_sat: z.string().optional(),
  outlet_business_hour_sun: z.string().optional(),
  outlet_notes: z.string().nullable().optional(),
}).passthrough();
