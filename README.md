# @thesammykins/ptv-api

TypeScript client for the [PTV (Public Transport Victoria) Timetable API v3](https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/ptv-timetable-api/).

Full coverage of all 26 API endpoints with HMAC-SHA1 request signing, Zod schema validation, automatic request deduplication, and a custom error hierarchy.

## Install

```bash
npm install @thesammykins/ptv-api
```

## Quick Start

```typescript
import { PTVClient } from "@thesammykins/ptv-api";

const client = new PTVClient({
  devId: "your-dev-id",
  apiKey: "your-api-key",
});

// Health check
const status = await client.healthcheck();

// Search for a station
const results = await client.search("Flinders Street");

// Get departures
const departures = await client.departures(0, 1071); // route_type, stop_id

// Nearby stops
const nearby = await client.stopsNearby(-37.8183, 144.9671);
```

## API Credentials

Register for API credentials at the [PTV Developer Portal](https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/ptv-timetable-api/).

## Endpoints

All 26 PTV v3 endpoints are supported:

| Method | Description |
|--------|-------------|
| `healthcheck()` | API health status |
| `routeTypes()` | List all route types (train, tram, bus, etc.) |
| `routes(opts?)` | List routes, optional filter by name/type |
| `routeById(id)` | Single route details |
| `search(term, opts?)` | Search stops, routes, outlets |
| `departures(routeType, stopId, opts?)` | Departures from a stop |
| `departuresForRoute(routeType, stopId, routeId, opts?)` | Departures filtered by route |
| `stopsNearby(lat, lng, opts?)` | Stops near coordinates |
| `stopsForRoute(routeType, routeId, opts?)` | Stops along a route |
| `stopDetails(stopId, routeType, opts?)` | Detailed stop info |
| `directions()` | All directions |
| `directionsForRoute(routeId)` | Directions for a route |
| `directionsById(directionId)` | Direction by ID |
| `directionsByIdAndType(directionId, routeType)` | Direction filtered by route type |
| `disruptions(opts?)` | Current disruptions |
| `disruptionById(disruptionId)` | Single disruption |
| `disruptionsByRoute(routeId, opts?)` | Disruptions for a route |
| `disruptionsByStop(stopId, opts?)` | Disruptions at a stop |
| `disruptionModes()` | Disruption mode metadata |
| `runs(routeId, opts?)` | Runs for a route |
| `runByRef(runRef, opts?)` | Run by reference |
| `runByRefAndType(runRef, routeType, opts?)` | Run filtered by route type |
| `fareEstimate(minZone, maxZone, opts?)` | Fare estimate between zones |
| `outlets(opts?)` | Ticket outlet locations |
| `outletsNearby(lat, lng, opts?)` | Nearby ticket outlets |
| `stoppingPattern(runRef, routeType, opts?)` | Stopping pattern for a run |

## Error Handling

All errors extend `PTVError` with specific subclasses per HTTP status:

```typescript
import { PTVClient, PTVAuthError, PTVRateLimitError } from "@thesammykins/ptv-api";

try {
  const result = await client.departures(0, 1071);
} catch (error) {
  if (error instanceof PTVAuthError) {
    // 401/403 — invalid credentials
  } else if (error instanceof PTVRateLimitError) {
    // 429 — rate limited
  }
}
```

Credentials are automatically redacted from error messages and response bodies.

## RequestManager

Built-in request management with throttling, deduplication, and exponential backoff:

```typescript
import { PTVClient, RequestManager } from "@thesammykins/ptv-api";

const manager = new RequestManager({
  maxConcurrent: 2,
  minRequestInterval: 500,
  maxRetries: 3,
});

const client = new PTVClient({
  devId: "your-dev-id",
  apiKey: "your-api-key",
  requestManager: manager,
});
```

## Requirements

- Node.js >= 20
- Single runtime dependency: [zod](https://zod.dev)

## Development

```bash
npm install
npm run build      # ESM + CJS + .d.ts via tsup
npm run lint       # tsc --noEmit
npm run test       # Vitest unit tests
npm run test:coverage  # 100% coverage thresholds
npm run test:e2e   # E2E tests (requires PTV_DEV_ID + PTV_API_KEY)
```

## License

[MIT](LICENSE)
