import { describe, it, expect } from "vitest";
import { 
  fareEstimatePath, 
  buildFareEstimateParams, 
  FareEstimateResponseValidator 
} from "../../src/endpoints/fare-estimate.js";

describe("fare-estimate endpoint", () => {
  describe("fareEstimatePath", () => {
    it("constructs correct path with min and max zones", () => {
      expect(fareEstimatePath(1, 2)).toBe("/v3/fare_estimate/min_zone/1/max_zone/2");
    });

    it("handles larger zone numbers", () => {
      expect(fareEstimatePath(5, 10)).toBe("/v3/fare_estimate/min_zone/5/max_zone/10");
    });
  });

  describe("buildFareEstimateParams", () => {
    it("returns empty object when no options provided", () => {
      expect(buildFareEstimateParams()).toEqual({});
    });

    it("returns empty object when empty options provided", () => {
      expect(buildFareEstimateParams({})).toEqual({});
    });

    it("includes journey_touch_on_utc when provided", () => {
      const params = buildFareEstimateParams({
        journey_touch_on_utc: "2024-01-01T08:00:00Z",
      });
      expect(params).toEqual({
        journey_touch_on_utc: "2024-01-01T08:00:00Z",
      });
    });

    it("includes journey_touch_off_utc when provided", () => {
      const params = buildFareEstimateParams({
        journey_touch_off_utc: "2024-01-01T09:00:00Z",
      });
      expect(params).toEqual({
        journey_touch_off_utc: "2024-01-01T09:00:00Z",
      });
    });

    it("includes is_journey_in_free_tram_zone when true", () => {
      const params = buildFareEstimateParams({
        is_journey_in_free_tram_zone: true,
      });
      expect(params).toEqual({
        is_journey_in_free_tram_zone: true,
      });
    });

    it("includes is_journey_in_free_tram_zone when false", () => {
      const params = buildFareEstimateParams({
        is_journey_in_free_tram_zone: false,
      });
      expect(params).toEqual({
        is_journey_in_free_tram_zone: false,
      });
    });

    it("includes is_journey_in_overlap_zone when provided", () => {
      const params = buildFareEstimateParams({
        is_journey_in_overlap_zone: true,
      });
      expect(params).toEqual({
        is_journey_in_overlap_zone: true,
      });
    });

    it("includes travelled_route_types array when provided", () => {
      const params = buildFareEstimateParams({
        travelled_route_types: [0, 1],
      });
      expect(params).toEqual({
        travelled_route_types: [0, 1],
      });
    });

    it("includes travelled_route_types with single element", () => {
      const params = buildFareEstimateParams({
        travelled_route_types: [2],
      });
      expect(params).toEqual({
        travelled_route_types: [2],
      });
    });

    it("includes all parameters when all provided", () => {
      const params = buildFareEstimateParams({
        journey_touch_on_utc: "2024-01-01T08:00:00Z",
        journey_touch_off_utc: "2024-01-01T09:00:00Z",
        is_journey_in_free_tram_zone: true,
        is_journey_in_overlap_zone: false,
        travelled_route_types: [0, 1, 2],
      });
      expect(params).toEqual({
        journey_touch_on_utc: "2024-01-01T08:00:00Z",
        journey_touch_off_utc: "2024-01-01T09:00:00Z",
        is_journey_in_free_tram_zone: true,
        is_journey_in_overlap_zone: false,
        travelled_route_types: [0, 1, 2],
      });
    });
  });

  describe("FareEstimateResponseValidator", () => {
    it("validates valid complete response", () => {
      const validResponse = {
        FareEstimateResultStatus: {
          StatusCode: 0,
          Message: "Success",
        },
        FareEstimateResult: {
          IsEarlyBird: false,
          IsJourneyInFreeTramZone: false,
          IsThisWeekendJourney: false,
          ZoneInfo: {
            MinZone: 1,
            MaxZone: 2,
            UniqueZones: [1, 2],
          },
          PassengerFares: [
            {
              PassengerType: "Full Fare",
              Fare2HourPeak: 4.60,
              Fare2HourOffPeak: 3.60,
              FareDailyPeak: 9.20,
              FareDailyOffPeak: 7.20,
              Pass7Days: 46.00,
              Pass28To69DayPerDay: 5.88,
              Pass70PlusDayPerDay: 4.62,
              WeekendCap: 7.20,
              HolidayCap: 7.20,
            },
          ],
        },
      };

      const result = FareEstimateResponseValidator.parse(validResponse);
      expect(result.FareEstimateResultStatus?.StatusCode).toBe(0);
      expect(result.FareEstimateResult?.ZoneInfo?.MinZone).toBe(1);
      expect(result.FareEstimateResult?.PassengerFares?.[0]?.PassengerType).toBe("Full Fare");
    });

    it("validates minimal response with empty objects", () => {
      const minimalResponse = {
        FareEstimateResultStatus: {},
        FareEstimateResult: {},
      };

      const result = FareEstimateResponseValidator.parse(minimalResponse);
      expect(result).toBeDefined();
      expect(result.FareEstimateResultStatus).toEqual({});
      expect(result.FareEstimateResult).toEqual({});
    });

    it("validates response with missing optional fields", () => {
      const partialResponse = {
        FareEstimateResult: {
          IsEarlyBird: true,
          ZoneInfo: {
            MinZone: 1,
          },
        },
      };

      const result = FareEstimateResponseValidator.parse(partialResponse);
      expect(result.FareEstimateResult?.IsEarlyBird).toBe(true);
      expect(result.FareEstimateResult?.ZoneInfo?.MinZone).toBe(1);
    });

    it("validates empty response", () => {
      const emptyResponse = {};

      const result = FareEstimateResponseValidator.parse(emptyResponse);
      expect(result).toEqual({});
    });

    it("preserves unknown fields via passthrough", () => {
      const responseWithUnknown = {
        FareEstimateResult: {
          IsEarlyBird: false,
          UnknownField: "preserved",
        },
        UnknownTopLevel: "also preserved",
      };

      const result = FareEstimateResponseValidator.parse(responseWithUnknown);
      expect((result as Record<string, unknown>).UnknownTopLevel).toBe("also preserved");
      expect((result.FareEstimateResult as Record<string, unknown>)?.UnknownField).toBe("preserved");
    });

    it("validates response with multiple passenger fares", () => {
      const multiPassengerResponse = {
        FareEstimateResult: {
          PassengerFares: [
            {
              PassengerType: "Full Fare",
              Fare2HourPeak: 4.60,
            },
            {
              PassengerType: "Concession",
              Fare2HourPeak: 2.30,
            },
            {
              PassengerType: "Senior",
              Fare2HourPeak: 0.00,
            },
          ],
        },
      };

      const result = FareEstimateResponseValidator.parse(multiPassengerResponse);
      expect(result.FareEstimateResult?.PassengerFares).toHaveLength(3);
      expect(result.FareEstimateResult?.PassengerFares?.[1]?.PassengerType).toBe("Concession");
    });

    it("validates response with empty arrays", () => {
      const emptyArrayResponse = {
        FareEstimateResult: {
          PassengerFares: [],
          ZoneInfo: {
            UniqueZones: [],
          },
        },
      };

      const result = FareEstimateResponseValidator.parse(emptyArrayResponse);
      expect(result.FareEstimateResult?.PassengerFares).toEqual([]);
      expect(result.FareEstimateResult?.ZoneInfo?.UniqueZones).toEqual([]);
    });
  });
});
