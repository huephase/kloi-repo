-- 🟡🟡🟡 2025-11-06 - Create deliveryLocations table
CREATE TABLE IF NOT EXISTS "deliveryLocations" (
  id BIGSERIAL PRIMARY KEY,
  district TEXT NOT NULL UNIQUE,
  sublocalities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_locations_sublocalities_gin
  ON "deliveryLocations" USING GIN (sublocalities);

-- Auto-update updated_at timestamp on update
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


