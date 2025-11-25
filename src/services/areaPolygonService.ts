// 2025-11-11T00:00:00Z 🟡🟡🟡 - [areaPolygonService] Service to provide polygons for districts/sublocalities
// ⚪⚪⚪ Note: In production, source this from DB or a CDN-hosted GeoJSON. This in-memory map is a placeholder.

import { prisma } from '../lib/prisma';

export type LatLng = { lat: number; lng: number };
export type AreaPolygon = { paths: LatLng[] };

// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [areaPolygonService] Coordinate order configuration from MAP_POLYGON env variable
// 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [areaPolygonService] SECURITY FIX: Auto-detection removed - coordinate order must be explicitly specified
// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [areaPolygonService] Set to 'lng-lat' if DB stores coordinates as [longitude, latitude] (e.g., [54.37, 24.46])
// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [areaPolygonService] Set to 'lat-lng' if DB stores coordinates as [latitude, longitude] (e.g., [24.46, 54.37])
// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [areaPolygonService] Value comes from MAP_POLYGON env variable - can be changed without code modification
const POLYGON_COORDINATE_ORDER: 'lng-lat' | 'lat-lng' = 
  (process.env.MAP_POLYGON === 'lat-lng' || process.env.MAP_POLYGON === 'lng-lat') 
    ? (process.env.MAP_POLYGON as 'lng-lat' | 'lat-lng')
    : 'lng-lat'; // Default fallback if env variable not set or invalid

// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [areaPolygonService] Log coordinate order configuration on module load
console.log(`🟡🟡🟡 - [areaPolygonService ${new Date().toISOString()}] MAP_POLYGON coordinate order: ${POLYGON_COORDINATE_ORDER} (from env: ${process.env.MAP_POLYGON || 'not set'})`);

// 2025-11-11T00:00:00Z 🟡🟡🟡 - [areaPolygonService] In-memory registry keyed by normalized "district||sublocality"
const registry: Record<string, AreaPolygon> = {
  // Example placeholder (disabled by default):
  // 'deira||al rigga': { paths: [ { lat: 25.27, lng: 55.31 }, { lat: 25.28, lng: 55.31 }, { lat: 25.28, lng: 55.33 }, { lat: 25.27, lng: 55.33 } ] }
};

function makeKey(district?: string | null, sublocality?: string | null): string {
  const d = (district || '').toLowerCase().trim();
  const s = (sublocality || '').toLowerCase().trim();
  return `${d}||${s}`;
}

export async function getAreaPolygonByNames(district?: string, sublocality?: string): Promise<AreaPolygon | null> {
  // 2025-11-11T00:00:00Z 🟡🟡🟡 - [areaPolygonService] 1) Try in-memory registry first
  const key = makeKey(district, sublocality);
  const registryPolygon = registry[key] || registry[makeKey(district, '')] || registry[makeKey('', sublocality)];
  if (registryPolygon?.paths?.length >= 3) {
    console.log(`🟡🟡🟡 - [areaPolygonService ${new Date().toISOString()}] Found polygon in registry`, { key, points: registryPolygon.paths.length });
    return registryPolygon;
  }

  // 2025-11-11T00:00:00Z 🟡🟡🟡 - [areaPolygonService] 2) Query DB deliveryLocations.sublocalities for polygon
  try {
    console.log(`🟡🟡🟡 - [areaPolygonService ${new Date().toISOString()}] Looking up polygon from DB`, { district, sublocality });
    const rows = await (prisma as any).deliveryLocations.findMany({
      select: { district: true, sublocalities: true }
    }) as Array<{ district: string; sublocalities: unknown }>;

    // Normalize and search
    const normalizedDistrict = (district || '').toLowerCase().trim();
    const normalizedSublocality = (sublocality || '').toLowerCase().trim();

    let candidate: { district: string; sublocalities: any[] } | null = null;
    const parseSublocalities = (value: unknown, context: { district: string }) => {
      if (Array.isArray(value)) return value as any[];
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
          console.warn(`⚠️⚠️⚠️ - [areaPolygonService ${new Date().toISOString()}] Failed to parse sublocalities JSON string`, { ...context, error: (err as Error).message });
          return [];
        }
      }
      if (value && typeof value === 'object') {
        const maybe = (value as any).sublocalities;
        return Array.isArray(maybe) ? maybe : [];
      }
      return [];
    };

    for (const row of rows) {
      const subs = parseSublocalities(row.sublocalities, { district: row.district });
      if (normalizedDistrict && row.district.toLowerCase().trim() !== normalizedDistrict) {
        // if district provided and does not match, skip
        continue;
      }
      // If sublocality provided, ensure one matches
      if (normalizedSublocality) {
        const hasName = subs.some(s => typeof s?.name === 'string' && s.name.toLowerCase().trim() === normalizedSublocality);
        if (!hasName) continue;
      }
      candidate = { district: row.district, sublocalities: subs };
      break;
    }

    // If district-constrained search failed, try a broader search by sublocality only
    if (!candidate && normalizedSublocality) {
      console.warn(`⚠️⚠️⚠️ - [areaPolygonService ${new Date().toISOString()}] No district match, falling back to sublocality-only search`, { district, sublocality });
      for (const row of rows) {
        const subs = parseSublocalities(row.sublocalities, { district: row.district });
        const hasName = subs.some(s => typeof s?.name === 'string' && s.name.toLowerCase().trim() === normalizedSublocality);
        if (hasName) {
          candidate = { district: row.district, sublocalities: subs };
          break;
        }
      }
    }

    if (!candidate) {
      console.warn(`⚠️⚠️⚠️ - [areaPolygonService ${new Date().toISOString()}] No deliveryLocations row matched after fallback`, { district, sublocality });
      return null;
    }

    // Find the sublocality entry with polygon
    let sub = null as any;
    if (normalizedSublocality) {
      sub = candidate.sublocalities.find((s: any) => typeof s?.name === 'string' && s.name.toLowerCase().trim() === normalizedSublocality);
    } else {
      // if no sublocality provided, pick first entry that has a polygon
      sub = candidate.sublocalities.find((s: any) => Array.isArray(s?.polygon) && s.polygon.length >= 3);
    }
    if (!sub || !Array.isArray(sub.polygon) || sub.polygon.length < 3) {
      console.warn(`⚠️⚠️⚠️ - [areaPolygonService ${new Date().toISOString()}] Matched sublocality has no polygon`, { district: candidate.district, sublocality });
      return null;
    }

    // 2025-11-12T00:00:00Z 🟡🟡🟡 - [areaPolygonService] The stored polygon format is expected as [[lng, lat], ...] or [[lat, lng], ...]
    // 2025-11-12T00:00:00Z 🟡🟡🟡 - [areaPolygonService] Convert to {lat,lng}[], using configured coordinate order
    const paths: LatLng[] = [];
    for (const pair of sub.polygon as Array<any>) {
      const a = Number(pair?.[0]);
      const b = Number(pair?.[1]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      
      let lat: number, lng: number;
      
      // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [areaPolygonService] SECURITY FIX: Auto-detection removed - coordinate order must be explicitly configured
      if (POLYGON_COORDINATE_ORDER === 'lng-lat') {
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [areaPolygonService] Force [lng, lat] interpretation: first is longitude, second is latitude
        lng = a;
        lat = b;
      } else if (POLYGON_COORDINATE_ORDER === 'lat-lng') {
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [areaPolygonService] Force [lat, lng] interpretation: first is latitude, second is longitude
        lat = a;
        lng = b;
      } else {
        // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [areaPolygonService] Invalid configuration - coordinate order must be specified
        console.error(`❗❗❗ - [areaPolygonService ${new Date().toISOString()}] Invalid POLYGON_COORDINATE_ORDER configuration - must be "lng-lat" or "lat-lng"`, { order: POLYGON_COORDINATE_ORDER });
        continue; // Skip this point
      }
      
      paths.push({ lat, lng });
    }
    if (paths.length < 3) {
      console.warn(`⚠️⚠️⚠️ - [areaPolygonService ${new Date().toISOString()}] Polygon conversion yielded insufficient points`, { points: paths.length });
      return null;
    }
    console.log(`✅✅✅ - [areaPolygonService ${new Date().toISOString()}] Polygon loaded from DB`, { district: candidate.district, sublocality, points: paths.length });
    return { paths };
  } catch (err) {
    console.error(`❗❗❗ - [areaPolygonService ${new Date().toISOString()}] DB lookup failed`, err);
    return null;
  }
}

// 2025-11-11T00:00:00Z 🔵🔵🔵 - [areaPolygonService] Can be improved:
// - Implement DB-backed polygons with caching
// - Add admin tooling to import GeoJSON from OSM/Overpass and normalize
// - Serve ETags/Last-Modified for client caching
// - Add CRS validation and winding order normalization


