const REDACT_PATTERNS = [
  /devid=[^&]*/gi,
  /signature=[^&]*/gi,
  /apikey=[^&]*/gi,
  /key=[^&]*/gi,
  /api_key=[^&]*/gi,
];

function redactCredentials(input: string): string {
  let result = input;
  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const key = match.split("=")[0];
      return `${key}=[REDACTED]`;
    });
  }
  return result;
}

function redactBody(body: unknown): unknown {
  if (typeof body === "string") return redactCredentials(body);
  if (typeof body !== "object" || body === null) return body;
  try {
    return JSON.parse(redactCredentials(JSON.stringify(body)));
  } catch {
    return body;
  }
}

export class PTVError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly responseBody?: unknown,
  ) {
    super(redactCredentials(message));
    this.name = "PTVError";
    this.endpoint = endpoint.split("?")[0];
    this.responseBody = redactBody(responseBody);
    if (this.stack) {
      this.stack = redactCredentials(this.stack);
    }
  }
}

export class PTVAuthError extends PTVError {
  constructor(endpoint: string, responseBody?: unknown) {
    super("Authentication failed", 403, endpoint, responseBody);
    this.name = "PTVAuthError";
  }
}

export class PTVBadRequestError extends PTVError {
  constructor(endpoint: string, responseBody?: unknown) {
    super("Bad request", 400, endpoint, responseBody);
    this.name = "PTVBadRequestError";
  }
}

export class PTVNotFoundError extends PTVError {
  constructor(endpoint: string, responseBody?: unknown) {
    super("Resource not found", 404, endpoint, responseBody);
    this.name = "PTVNotFoundError";
  }
}

export class PTVRateLimitError extends PTVError {
  constructor(endpoint: string, responseBody?: unknown) {
    super("Rate limit exceeded", 429, endpoint, responseBody);
    this.name = "PTVRateLimitError";
  }
}

export class PTVServerError extends PTVError {
  constructor(statusCode: number, endpoint: string, responseBody?: unknown) {
    super(`Server error (${statusCode})`, statusCode, endpoint, responseBody);
    this.name = "PTVServerError";
  }
}

export class PTVValidationError extends PTVError {
  constructor(
    endpoint: string,
    public readonly zodErrors: unknown,
    responseBody?: unknown,
  ) {
    super("Response validation failed", 0, endpoint, responseBody);
    this.name = "PTVValidationError";
  }
}

export class PTVNetworkError extends PTVError {
  constructor(endpoint: string, cause?: Error) {
    super(
      `Network error: ${cause?.message ?? "unknown"}`,
      0,
      endpoint,
    );
    this.name = "PTVNetworkError";
    if (cause) this.cause = cause;
  }
}

export class PTVTimeoutError extends PTVError {
  constructor(endpoint: string, timeoutMs: number) {
    super(
      `Request timed out after ${timeoutMs}ms`,
      0,
      endpoint,
    );
    this.name = "PTVTimeoutError";
  }
}

export function errorFromStatus(
  statusCode: number,
  endpoint: string,
  responseBody?: unknown,
): PTVError {
  if (statusCode === 400) {
    return new PTVBadRequestError(endpoint, responseBody);
  }
  if (statusCode === 401 || statusCode === 403) {
    return new PTVAuthError(endpoint, responseBody);
  }
  if (statusCode === 404) {
    return new PTVNotFoundError(endpoint, responseBody);
  }
  if (statusCode === 429) {
    return new PTVRateLimitError(endpoint, responseBody);
  }
  if (statusCode >= 500) {
    return new PTVServerError(statusCode, endpoint, responseBody);
  }
  return new PTVError(
    `HTTP ${statusCode}`,
    statusCode,
    endpoint,
    responseBody,
  );
}
