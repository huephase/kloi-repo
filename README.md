# Project documentation

## Important Documentation

- **[CHANGELOG.md](./docs/CHANGELOG.md)**: Tracks all breaking changes, major changes, and directional changes in the application. **⚠️ Always review before migrations or major updates.**
- **[ORDER_STATUS_SYSTEM.md](./docs/ORDER_STATUS_SYSTEM.md)**: Documentation for the centralized order status management system.

## Adding to Changelog

When making significant changes, please document them in [CHANGELOG.md](./docs/CHANGELOG.md) using the [CHANGELOG_TEMPLATE.md](./docs/CHANGELOG_TEMPLATE.md) as a guide.

## Environment

Set required env vars:

- DATABASE_URL
- GOOGLE_MAPS_API_KEY
- SESSION_COOKIE_NAME
- REDIS_SESSION_SECRET

## Delivery Locations Data Import (pgAdmin)

1) The table is created by migration `20251106120000_add_delivery_locations_table`.

2) If your JSON has `major_area` and `communities`:

```
{
  "dubai_localities": [
    { "major_area": "Deira", "communities": ["Nakhlat Deira (Palm Deira/Deira Island)", "Al Corniche"] }
  ]
}
```

Run this in pgAdmin (replace YOUR_JSON_HERE):

```
WITH payload AS (
  SELECT CAST($$YOUR_JSON_HERE$$ AS jsonb) AS j
), rows AS (
  SELECT x->>'major_area' AS district,
         (x->'communities')::jsonb AS sublocalities
  FROM payload, LATERAL jsonb_array_elements(j->'dubai_localities') AS x
)
INSERT INTO "deliveryLocations" (district, sublocalities)
SELECT district, sublocalities FROM rows
ON CONFLICT (district) DO UPDATE SET sublocalities = EXCLUDED.sublocalities;
```
