import { PTVClient } from "../../src/index.js";

export const DEV_ID = process.env.PTV_DEV_ID ?? "";
export const API_KEY = process.env.PTV_API_KEY ?? "";

export const hasCredentials = Boolean(DEV_ID && API_KEY);

export function createClient(): PTVClient {
  return new PTVClient(DEV_ID, API_KEY);
}

// Well-known test fixtures
export const FLINDERS_STOP_ID = 1071;
export const TRAIN_ROUTE_TYPE = 0;
export const INVALID_STOP_ID = 9999999;
