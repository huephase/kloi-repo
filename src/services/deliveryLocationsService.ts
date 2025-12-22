// 2025-11-06 🟡🟡🟡 Service to read delivery districts and sublocalities
import { prisma } from '../lib/prisma';
import { normalizePolygonCoordinates } from '../lib/coordinateUtils';
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [DRY REFACTOR] Using coordinateUtils instead of duplicated coordinate normalization logic

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] Normalized sublocality shape for downstream consumption
export type DeliveryLocationPolygonPoint = {
  lat: number;
  lng: number;
};

export type DeliveryLocationSublocality = {
  name: string;
  surcharge: number;
  district: string;
  polygon?: DeliveryLocationPolygonPoint[];
};

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] District grouping for city aggregations
type DeliveryLocationDistrictGroup = {
  district: string;
  sublocalities: DeliveryLocationSublocality[];
};

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] City level aggregation returned to routes/views
export type DeliveryLocationCityView = {
  country: string;
  city: string;
  districts: DeliveryLocationDistrictGroup[];
  combinedSublocalities: DeliveryLocationSublocality[];
};

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] Raw row shape returned from Prisma query
type DeliveryLocationRow = {
  id: bigint;
  country: string;
  city: string;
  district: string;
  sublocalities: unknown;
  created_at: Date;
  updated_at: Date;
};

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] Shared logger helpers for consistent emoji/timestamp output
// const logInfo = (message: string, payload?: unknown) => {
//   console.log(`🟡🟡🟡 - [deliveryLocationsService ${new Date().toISOString()}] ${message}`, payload ?? '');
// };

// const logSuccess = (message: string, payload?: unknown) => {
//   console.log(`✅✅✅ - [deliveryLocationsService ${new Date().toISOString()}] ${message}`, payload ?? '');
// };

// const logWarn = (message: string, payload?: unknown) => {
//   console.warn(`🟡🟡🟡 - [deliveryLocationsService ${new Date().toISOString()}] ${message}`, payload ?? '');
// };

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] Normalize raw JSONB payload into typed sublocalities
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [DRY REFACTOR] Using normalizePolygonCoordinates() from coordinateUtils instead of duplicated logic
function normalizePolygon(raw: unknown): DeliveryLocationPolygonPoint[] | undefined {
  const normalized = normalizePolygonCoordinates(raw);
  return normalized || undefined;
}

function ensureArray(value: unknown, _context: { district: string; city: string }): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      // logWarn('Parsed sublocalities string but result was not an array', context);
      return [];
    } catch (err) {
      // logWarn('Failed to parse sublocalities JSON string', { ...context, error: (err as Error).message });
      return [];
    }
  }
  if (value && typeof value === 'object') {
    const maybeArray = (value as any).sublocalities;
    if (Array.isArray(maybeArray)) return maybeArray;
  }
  // logWarn('Unexpected sublocalities value shape; defaulting to empty', context);
  return [];
}

function normalizeSublocalities(row: DeliveryLocationRow): DeliveryLocationSublocality[] {
  const sublocalityEntries = Array.isArray(row.sublocalities)
    ? (row.sublocalities as any[])
    : ensureArray(row.sublocalities, { district: row.district, city: row.city });

  if (!sublocalityEntries.length) return [];

  return sublocalityEntries
    .map((entry, _index) => {
      const rawName = (entry as Record<string, unknown>)?.name;
      const name = typeof rawName === 'string' ? rawName.trim() : String(rawName ?? '').trim();
      const rawSurcharge = (entry as Record<string, unknown>)?.surcharge;
      const surcharge = typeof rawSurcharge === 'number' ? rawSurcharge : Number(rawSurcharge ?? 0);

      if (!name) {
        // logWarn('Skipped sublocality without valid name', { district: row.district, index });
        return null;
      }

      const polygon = normalizePolygon((entry as Record<string, unknown>)?.polygon);

      const result: DeliveryLocationSublocality = {
        name,
        surcharge: Number.isFinite(surcharge) ? surcharge : 0,
        district: row.district,
      };
      if (polygon) {
        result.polygon = polygon;
      }
      return result;
    })
    .filter((entry): entry is DeliveryLocationSublocality => Boolean(entry));
}

export async function getAllDeliveryLocations(): Promise<DeliveryLocationCityView[]> {
  // logInfo('Fetching delivery locations from database');
  // ⚠️⚠️⚠️ - [PRISMA CLIENT] Type assertion needed until Prisma client is regenerated with: npm run prisma:generate
  const rows = await (prisma as any).deliveryLocations.findMany({
    select: {
      id: true,
      country: true,
      city: true,
      district: true,
      sublocalities: true,
      created_at: true,
      updated_at: true,
    }
  }) as unknown as DeliveryLocationRow[];

  // logSuccess('Rows fetched from deliveryLocations table', { count: rows.length });

  const groupedByCity = new Map<string, DeliveryLocationCityView>();

  rows.forEach((row) => {
    const normalized = normalizeSublocalities(row);
    const cityKey = `${row.country}::${row.city}`;

    if (!groupedByCity.has(cityKey)) {
      groupedByCity.set(cityKey, {
        country: row.country,
        city: row.city,
        districts: [],
        combinedSublocalities: [],
      });
    }

    const cityEntry = groupedByCity.get(cityKey)!;
    cityEntry.districts.push({
      district: row.district,
      sublocalities: normalized.map((item) => ({ ...item })),
    });
    cityEntry.combinedSublocalities.push(...normalized);
  });

  const result = Array.from(groupedByCity.values()).map((cityEntry) => {
    const uniqueCombined = new Map<string, DeliveryLocationSublocality>();

    cityEntry.combinedSublocalities.forEach((entry) => {
      const key = `${entry.district}::${entry.name}`;
      if (!uniqueCombined.has(key)) {
        uniqueCombined.set(key, entry);
      }
    });

    return {
      ...cityEntry,
      combinedSublocalities: Array.from(uniqueCombined.values()),
    };
  });

  // logSuccess('Prepared delivery locations payload', { cities: result.length });
  return result;
}

