import { ROUTE_TYPES_PATH, RouteTypesResponseValidator } from "./route-types.js";

export const HEALTHCHECK_PATH = ROUTE_TYPES_PATH;

export function buildHealthcheckParams(): Record<string, never> {
  return {};
}

export const HealthcheckResponseValidator = RouteTypesResponseValidator;
