import { z } from "zod";

export const PassengerFareSchema = z.object({
  PassengerType: z.string().optional(),
  Fare2HourPeak: z.number().optional(),
  Fare2HourOffPeak: z.number().optional(),
  FareDailyPeak: z.number().optional(),
  FareDailyOffPeak: z.number().optional(),
  Pass7Days: z.number().optional(),
  Pass28To69DayPerDay: z.number().optional(),
  Pass70PlusDayPerDay: z.number().optional(),
  WeekendCap: z.number().optional(),
  HolidayCap: z.number().optional(),
}).passthrough();

export const ZoneInfoSchema = z.object({
  MinZone: z.number().optional(),
  MaxZone: z.number().optional(),
  UniqueZones: z.array(z.number()).optional(),
}).passthrough();

export const FareEstimateResultSchema = z.object({
  IsEarlyBird: z.boolean().optional(),
  IsJourneyInFreeTramZone: z.boolean().optional(),
  IsThisWeekendJourney: z.boolean().optional(),
  ZoneInfo: ZoneInfoSchema.optional(),
  PassengerFares: z.array(PassengerFareSchema).optional(),
}).passthrough();

export const FareEstimateResultStatusSchema = z.object({
  StatusCode: z.number().optional(),
  Message: z.string().optional(),
}).passthrough();
