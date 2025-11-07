// 2025-11-06 🟡🟡🟡 Service to read delivery districts and sublocalities
import { prisma } from '../lib/prisma';

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] Normalized sublocality shape for downstream consumption
export type DeliveryLocationSublocality = {
  name: string;
  surcharge: number;
  district: string;
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
const logInfo = (message: string, payload?: unknown) => {
  console.log(`🟡🟡🟡 - [deliveryLocationsService ${new Date().toISOString()}] ${message}`, payload ?? '');
};

const logSuccess = (message: string, payload?: unknown) => {
  console.log(`✅✅✅ - [deliveryLocationsService ${new Date().toISOString()}] ${message}`, payload ?? '');
};

const logWarn = (message: string, payload?: unknown) => {
  console.warn(`⚠️⚠️⚠️ - [deliveryLocationsService ${new Date().toISOString()}] ${message}`, payload ?? '');
};

// 2025-11-07T00:00:00Z 🟡🟡🟡 - [deliveryLocationsService] Normalize raw JSONB payload into typed sublocalities
function normalizeSublocalities(row: DeliveryLocationRow): DeliveryLocationSublocality[] {
  if (!Array.isArray(row.sublocalities)) {
    logWarn('Expected sublocalities array; defaulting to empty', { district: row.district, city: row.city });
    return [];
  }

  return row.sublocalities
    .map((entry, index) => {
      const rawName = (entry as Record<string, unknown>)?.name;
      const name = typeof rawName === 'string' ? rawName.trim() : String(rawName ?? '').trim();
      const rawSurcharge = (entry as Record<string, unknown>)?.surcharge;
      const surcharge = typeof rawSurcharge === 'number' ? rawSurcharge : Number(rawSurcharge ?? 0);

      if (!name) {
        logWarn('Skipped sublocality without valid name', { district: row.district, index });
        return null;
      }

      return {
        name,
        surcharge: Number.isFinite(surcharge) ? surcharge : 0,
        district: row.district,
      } as DeliveryLocationSublocality;
    })
    .filter((entry): entry is DeliveryLocationSublocality => Boolean(entry));
}

export async function getAllDeliveryLocations(): Promise<DeliveryLocationCityView[]> {
  logInfo('Fetching delivery locations from database');
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

  logSuccess('Rows fetched from deliveryLocations table', { count: rows.length });

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

  logSuccess('Prepared delivery locations payload', { cities: result.length });
  return result;
}

