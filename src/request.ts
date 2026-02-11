import { createHmac } from "node:crypto";

export interface SigningCredentials {
  devId: string;
  apiKey: string;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | (string | number)[]>,
): string {
  const allParams: Record<string, string[]> = {};

  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) continue;
    const values = Array.isArray(val) ? val.map(String) : [String(val)];
    allParams[key] = values.sort();
  }

  const sortedKeys = Object.keys(allParams).sort();
  const parts: string[] = [];

  for (const key of sortedKeys) {
    for (const v of allParams[key]) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }

  return parts.join("&");
}

export function signRequest(
  path: string,
  queryString: string,
  apiKey: string,
): string {
  const message = queryString ? `${path}?${queryString}` : path;
  return createHmac("sha1", apiKey)
    .update(message)
    .digest("hex")
    .toUpperCase();
}

export function buildSignedUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string | number | boolean | (string | number)[]>,
  credentials: SigningCredentials,
): string {
  const allParams = { ...params, devid: credentials.devId };
  const queryString = buildQueryString(allParams);
  const signature = signRequest(path, queryString, credentials.apiKey);
  return `${baseUrl}${path}?${queryString}&signature=${signature}`;
}
