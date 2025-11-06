# Delivery Locations Flow

## Goal

Replace the splash page link to `/location` with a new `/delivery-location` flow that lists districts and sublocalities from DB, supports “Detect My Location” via Google Maps Geocoding, and then forwards users to `/location` with selected sublocality context.

## Database

- Create table `deliveryLocations` with a unique district and JSONB sublocalities.
- Provide SQL for pgAdmin and (optionally) a Prisma model.

SQL (for pgAdmin):

```sql
CREATE TABLE IF NOT EXISTS "deliveryLocations" (
  id BIGSERIAL PRIMARY KEY,
  district TEXT NOT NULL UNIQUE,
  sublocalities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_locations_sublocalities_gin
  ON "deliveryLocations" USING GIN (sublocalities);

-- Optional trigger to auto-update updated_at (Postgres >= 10)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_delivery_locations ON "deliveryLocations";
CREATE TRIGGER set_updated_at_delivery_locations
BEFORE UPDATE ON "deliveryLocations"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Prisma model (if using Prisma for access):

```prisma
model deliveryLocations {
  id           BigInt    @id @default(autoincrement())
  district     String    @unique
  sublocalities Json
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  @@map("deliveryLocations")
}
```

## Data import

- You will paste your existing JSON into pgAdmin once the table exists. I will provide an example `INSERT` template and document the expected JSON structure:

Expected JSON source shape (example):

```json
{
  "dubai_localities": [
    { "major_area": "Deira", "communities": ["Nakhlat Deira (Palm Deira/Deira Island)", "Al Corniche", "Al Ras"] },
    { "major_area": "Bur Dubai & Central/West", "communities": ["Al Shindagha", "Al Souk Al Kabir (Al Bastakiya/Al Fahidi)"] }
  ]
}
```

Mapping:

- major_area -> deliveryLocations.district
- communities -> deliveryLocations.sublocalities (JSONB array of strings)

Example inserts (pgAdmin), per district:

```sql
INSERT INTO "deliveryLocations" (district, sublocalities)
VALUES ('Deira', '["Nakhlat Deira (Palm Deira/Deira Island)","Al Corniche","Al Ras"]'::jsonb)
ON CONFLICT (district) DO UPDATE SET sublocalities = EXCLUDED.sublocalities;
```

Optional bulk import (if you paste the whole JSON into a `:json_payload` parameter or a temp table), Postgres-only example:

```sql
WITH payload AS (
  SELECT CAST($YOUR_JSON_HERE$ AS jsonb) AS j
), rows AS (
  SELECT x->>'major_area' AS district,
         (x->'communities')::jsonb AS sublocalities
  FROM payload, LATERAL jsonb_array_elements(j->'dubai_localities') AS x
)
INSERT INTO "deliveryLocations" (district, sublocalities)
SELECT district, sublocalities FROM rows
ON CONFLICT (district) DO UPDATE SET sublocalities = EXCLUDED.sublocalities;
```

## Backend changes

- Add new page route `GET /delivery-location` in `src/routes/deliveryLocation.ts` that:
  - Loads all districts and sublocalities via a service
  - Renders `views/delivery-locations.hbs`
- Add API endpoint `GET /api/geo/reverse?lat=..&lng=..` in `src/routes/api/index.ts` (or a new file) that:
  - Calls Google Geocoding API (server-side) using `GOOGLE_MAPS_API_KEY`
  - Extracts district and sublocality names from the response
  - Returns a best-match `{ district, sublocality }`
- Add a small `deliveryLocationsService` in `src/services/deliveryLocationsService.ts` for DB access.
- Wire route registration in `src/routes/index.ts`.
- In `public/themes/127/127_splash.html`, change only the anchor href from `/location` to `/delivery-location`. Do not modify any splash setup, routing, or rendering logic.

Essential handler skeletons (concise):

```ts
// src/routes/deliveryLocation.ts
fastify.get('/delivery-location', async (request, reply) => {
  const locations = await deliveryLocationsService.getAll();
  return reply.view('delivery-locations', { locations });
});
```
```ts
// src/routes/api/index.ts (reverse geocode)
fastify.get('/api/geo/reverse', async (request, reply) => {
  const { lat, lng } = request.query as { lat: string; lng: string };
  // call Google Geocoding, map to { district, sublocality }
  return reply.send({ district, sublocality });
});
```

## Frontend (HBS + JS)

- New template `src/views/delivery-locations.hbs`:
  - Lists districts; each expands/collapses to show sublocalities
  - Clicking a sublocality redirects to `/location?district=...&sublocality=...`
  - “Detect My Location” button:
    - Uses `navigator.geolocation.getCurrentPosition`
    - Calls `/api/geo/reverse?lat=..&lng=..`
    - If a match is returned, auto-navigate to `/location?district=...&sublocality=...`
    - Otherwise, highlight the best district and prompt user to pick
- Add minimal progressive enhancement JS under `public/global/js/delivery-location.js` and include it in the HBS.

## Configuration

- Add `GOOGLE_MAPS_API_KEY` to env, wire in `src/config/index.ts` and reuse in the API route.
- Timeouts and error handling around Google API.

## Validation and schemas

- Add light schema validation for reverse geocode query params in `src/schemas/common.schemas.ts` (e.g., numeric lat/lng).

## Logging and comments

- Add timestamped explanatory comments and structured logs per your project’s emoji conventions across new routes, services, and client JS.

## Integration points

- Ensure `/location` handler can accept optional `district` and `sublocality` query params to pre-fill the UI.
- Confirm registration order so static/theme splash renders first and link routes correctly.

## Testing

- Manual test flow:
  - Open splash → click → `/delivery-location`
  - District list renders from DB
  - Select sublocality → navigates to `/location` with query params
  - “Detect My Location” → permissions → redirects with inferred sublocality

## Ops

- Provide a short README snippet for pgAdmin import and env setup.