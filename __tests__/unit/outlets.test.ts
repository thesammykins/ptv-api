import { describe, it, expect } from "vitest";
import {
  OUTLETS_PATH,
  outletsNearbyPath,
  buildOutletsParams,
  OutletsResponseValidator,
  OutletsNearbyResponseValidator,
} from "../../src/endpoints/outlets.js";

describe("OUTLETS_PATH", () => {
  it("returns correct path for outlets list", () => {
    expect(OUTLETS_PATH).toBe("/v3/outlets");
  });
});

describe("outletsNearbyPath", () => {
  it("returns path for outlets near location", () => {
    expect(outletsNearbyPath(-37.8136, 144.9631, 500)).toBe(
      "/v3/outlets/location/-37.8136,144.9631,500"
    );
  });

  it("handles integer coordinates", () => {
    expect(outletsNearbyPath(-38, 145, 1000)).toBe(
      "/v3/outlets/location/-38,145,1000"
    );
  });

  it("handles positive coordinates", () => {
    expect(outletsNearbyPath(37.5, 144.2, 250)).toBe(
      "/v3/outlets/location/37.5,144.2,250"
    );
  });

  it("handles large max_distance values", () => {
    expect(outletsNearbyPath(-37.8136, 144.9631, 10000)).toBe(
      "/v3/outlets/location/-37.8136,144.9631,10000"
    );
  });
});

describe("buildOutletsParams", () => {
  it("returns empty object when no options provided", () => {
    expect(buildOutletsParams()).toEqual({});
  });

  it("returns empty object when undefined options provided", () => {
    expect(buildOutletsParams(undefined)).toEqual({});
  });

  it("includes max_results when provided", () => {
    expect(buildOutletsParams({ max_results: 10 })).toEqual({
      max_results: 10,
    });
  });

  it("handles max_results of 1", () => {
    expect(buildOutletsParams({ max_results: 1 })).toEqual({
      max_results: 1,
    });
  });

  it("handles large max_results values", () => {
    expect(buildOutletsParams({ max_results: 999 })).toEqual({
      max_results: 999,
    });
  });
});

describe("OutletsResponseValidator", () => {
  it("accepts valid response with outlets array", () => {
    const validData = {
      outlets: [
        {
          outlet_slid_spid: "12345",
          outlet_name: "Test Outlet",
          outlet_business: "7-Eleven",
          outlet_latitude: -37.8136,
          outlet_longitude: 144.9631,
          outlet_suburb: "Melbourne",
          outlet_postcode: 3000,
          outlet_business_hour_mon: "9am-5pm",
          outlet_business_hour_tue: "9am-5pm",
          outlet_business_hour_wed: "9am-5pm",
          outlet_business_hour_thur: "9am-5pm",
          outlet_business_hour_fri: "9am-5pm",
          outlet_business_hour_sat: "10am-4pm",
          outlet_business_hour_sun: "Closed",
          outlet_notes: "Near train station",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets).toHaveLength(1);
      expect(result.data.outlets[0].outlet_name).toBe("Test Outlet");
    }
  });

  it("accepts empty outlets array", () => {
    const validData = {
      outlets: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets).toHaveLength(0);
    }
  });

  it("accepts outlets with minimal fields", () => {
    const validData = {
      outlets: [
        {
          outlet_name: "Minimal Outlet",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets[0].outlet_name).toBe("Minimal Outlet");
    }
  });

  it("accepts null outlet_notes", () => {
    const validData = {
      outlets: [
        {
          outlet_name: "Test Outlet",
          outlet_notes: null,
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets[0].outlet_notes).toBeNull();
    }
  });

  it("preserves unknown fields via passthrough", () => {
    const dataWithExtras = {
      outlets: [
        {
          outlet_name: "Test Outlet",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
      unknown_field: "preserved",
      extra_data: 123,
    };

    const result = OutletsResponseValidator.safeParse(dataWithExtras);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("unknown_field", "preserved");
      expect(result.data).toHaveProperty("extra_data", 123);
    }
  });

  it("rejects response missing outlets field", () => {
    const invalidData = {
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response missing status field", () => {
    const invalidData = {
      outlets: [
        {
          outlet_name: "Test Outlet",
        },
      ],
    };

    const result = OutletsResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response with invalid outlets array type", () => {
    const invalidData = {
      outlets: "not an array",
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("accepts multiple outlets in array", () => {
    const validData = {
      outlets: [
        {
          outlet_name: "First Outlet",
          outlet_suburb: "Melbourne",
        },
        {
          outlet_name: "Second Outlet",
          outlet_suburb: "Richmond",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets).toHaveLength(2);
      expect(result.data.outlets[1].outlet_name).toBe("Second Outlet");
    }
  });
});

describe("OutletsNearbyResponseValidator", () => {
  it("accepts valid response with outlet_distance field", () => {
    const validData = {
      outlets: [
        {
          outlet_distance: 150.5,
          outlet_slid_spid: "12345",
          outlet_name: "Test Outlet",
          outlet_business: "7-Eleven",
          outlet_latitude: -37.8136,
          outlet_longitude: 144.9631,
          outlet_suburb: "Melbourne",
          outlet_postcode: 3000,
          outlet_business_hour_mon: "9am-5pm",
          outlet_business_hour_tue: "9am-5pm",
          outlet_business_hour_wed: "9am-5pm",
          outlet_business_hour_thur: "9am-5pm",
          outlet_business_hour_fri: "9am-5pm",
          outlet_business_hour_sat: "10am-4pm",
          outlet_business_hour_sun: "Closed",
          outlet_notes: "Near train station",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsNearbyResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets).toHaveLength(1);
      expect(result.data.outlets[0].outlet_distance).toBe(150.5);
      expect(result.data.outlets[0].outlet_name).toBe("Test Outlet");
    }
  });

  it("accepts empty outlets array", () => {
    const validData = {
      outlets: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsNearbyResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets).toHaveLength(0);
    }
  });

  it("accepts outlets with minimal fields including distance", () => {
    const validData = {
      outlets: [
        {
          outlet_distance: 250.0,
          outlet_name: "Minimal Outlet",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsNearbyResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets[0].outlet_distance).toBe(250.0);
      expect(result.data.outlets[0].outlet_name).toBe("Minimal Outlet");
    }
  });

  it("preserves unknown fields via passthrough", () => {
    const dataWithExtras = {
      outlets: [
        {
          outlet_distance: 100.0,
          outlet_name: "Test Outlet",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
      unknown_field: "preserved",
      extra_data: 456,
    };

    const result = OutletsNearbyResponseValidator.safeParse(dataWithExtras);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("unknown_field", "preserved");
      expect(result.data).toHaveProperty("extra_data", 456);
    }
  });

  it("rejects response missing outlets field", () => {
    const invalidData = {
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsNearbyResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response missing status field", () => {
    const invalidData = {
      outlets: [
        {
          outlet_distance: 100.0,
          outlet_name: "Test Outlet",
        },
      ],
    };

    const result = OutletsNearbyResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response with invalid outlets array type", () => {
    const invalidData = {
      outlets: "not an array",
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsNearbyResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("accepts multiple outlets sorted by distance", () => {
    const validData = {
      outlets: [
        {
          outlet_distance: 100.5,
          outlet_name: "Closest Outlet",
          outlet_suburb: "Melbourne",
        },
        {
          outlet_distance: 250.0,
          outlet_name: "Further Outlet",
          outlet_suburb: "Richmond",
        },
        {
          outlet_distance: 450.75,
          outlet_name: "Furthest Outlet",
          outlet_suburb: "Collingwood",
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = OutletsNearbyResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlets).toHaveLength(3);
      expect(result.data.outlets[0].outlet_distance).toBe(100.5);
      expect(result.data.outlets[2].outlet_distance).toBe(450.75);
    }
  });
});
