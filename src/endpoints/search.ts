import { z } from "zod";
import { StatusResponseSchema } from "../schemas/common.js";
import { SearchResultStopSchema, SearchResultRouteSchema, SearchResultOutletSchema } from "../schemas/search.js";
import type { SearchOptions } from "../types.js";

export function searchPath(term: string): string {
  return `/v3/search/${encodeURIComponent(term)}`;
}

export function buildSearchParams(
  opts?: SearchOptions,
): Record<string, string | number | boolean | number[]> {
  const params: Record<string, string | number | boolean | number[]> = {};
  if (opts?.route_types?.length) params.route_types = opts.route_types;
  if (opts?.latitude !== undefined) params.latitude = opts.latitude;
  if (opts?.longitude !== undefined) params.longitude = opts.longitude;
  if (opts?.max_results !== undefined) params.max_results = opts.max_results;
  if (opts?.include_outlets !== undefined) params.include_outlets = opts.include_outlets;
  return params;
}

export const SearchResponseValidator = z.object({
  stops: z.array(SearchResultStopSchema),
  routes: z.array(SearchResultRouteSchema),
  outlets: z.array(SearchResultOutletSchema),
  status: StatusResponseSchema,
}).passthrough();

export type SearchResult = z.infer<typeof SearchResponseValidator>;
