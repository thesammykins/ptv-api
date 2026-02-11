import { describe, it, expect } from "vitest";
import {
  directionsPath,
  directionsByIdPath,
  directionsByIdAndTypePath,
  DirectionsResponseValidator,
} from "../../src/endpoints/directions.js";

describe("directionsPath", () => {
  it("returns path for directions by route", () => {
    expect(directionsPath(42)).toBe("/v3/directions/route/42");
  });

  it("handles single-digit route IDs", () => {
    expect(directionsPath(1)).toBe("/v3/directions/route/1");
  });

  it("handles large route IDs", () => {
    expect(directionsPath(999999)).toBe("/v3/directions/route/999999");
  });
});

describe("directionsByIdPath", () => {
  it("returns path for directions by direction ID", () => {
    expect(directionsByIdPath(5)).toBe("/v3/directions/5");
  });

  it("handles single-digit direction IDs", () => {
    expect(directionsByIdPath(1)).toBe("/v3/directions/1");
  });

  it("handles large direction IDs", () => {
    expect(directionsByIdPath(123456)).toBe("/v3/directions/123456");
  });
});

describe("directionsByIdAndTypePath", () => {
  it("returns path for directions by ID and route type", () => {
    expect(directionsByIdAndTypePath(5, 0)).toBe("/v3/directions/5/route_type/0");
  });

  it("handles different route types", () => {
    expect(directionsByIdAndTypePath(10, 3)).toBe("/v3/directions/10/route_type/3");
  });

  it("handles large direction IDs with route type", () => {
    expect(directionsByIdAndTypePath(999, 2)).toBe("/v3/directions/999/route_type/2");
  });
});

describe("DirectionsResponseValidator", () => {
  it("accepts valid response with directions array", () => {
    const validData = {
      directions: [
        {
          direction_id: 1,
          direction_name: "City",
          route_id: 5,
          route_type: 0,
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = DirectionsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.directions).toHaveLength(1);
      expect(result.data.directions[0].direction_name).toBe("City");
    }
  });

  it("accepts empty directions array", () => {
    const validData = {
      directions: [],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = DirectionsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.directions).toHaveLength(0);
    }
  });

  it("preserves unknown fields via passthrough", () => {
    const dataWithExtras = {
      directions: [
        {
          direction_id: 1,
          direction_name: "City",
          route_id: 5,
          route_type: 0,
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
      unknown_field: "preserved",
      extra_data: 123,
    };

    const result = DirectionsResponseValidator.safeParse(dataWithExtras);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("unknown_field", "preserved");
      expect(result.data).toHaveProperty("extra_data", 123);
    }
  });

  it("rejects response missing directions field", () => {
    const invalidData = {
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = DirectionsResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response missing status field", () => {
    const invalidData = {
      directions: [
        {
          direction_id: 1,
          direction_name: "City",
          route_id: 5,
          route_type: 0,
        },
      ],
    };

    const result = DirectionsResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects response with invalid directions array type", () => {
    const invalidData = {
      directions: "not an array",
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = DirectionsResponseValidator.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("accepts multiple directions in array", () => {
    const validData = {
      directions: [
        {
          direction_id: 1,
          direction_name: "City",
          route_id: 5,
          route_type: 0,
        },
        {
          direction_id: 2,
          direction_name: "Outbound",
          route_id: 5,
          route_type: 0,
        },
      ],
      status: {
        version: "3.0",
        health: 1,
      },
    };

    const result = DirectionsResponseValidator.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.directions).toHaveLength(2);
      expect(result.data.directions[1].direction_name).toBe("Outbound");
    }
  });
});
