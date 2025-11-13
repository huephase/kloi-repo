// 2025-11-11T00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] CLI utility to upsert delivery area polygons from GeoJSON
import fs from 'fs';
import path from 'path';
import process from 'process';
import { prisma } from '../lib/prisma';

// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] Coordinate order configuration for DB storage from MAP_POLYGON env variable
// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] Set to 'lng-lat' to store coordinates as [longitude, latitude] in DB (e.g., [54.37, 24.46])
// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] Set to 'lat-lng' to store coordinates as [latitude, longitude] in DB (e.g., [24.46, 54.37])
// 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [importGeoJsonPolygon] IMPORTANT: This should match your existing database format and MAP_POLYGON env variable
// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] Uses MAP_POLYGON env variable - ensures consistency with code interpretation
const DB_STORAGE_COORDINATE_ORDER: 'lng-lat' | 'lat-lng' = 
  (process.env.MAP_POLYGON === 'lat-lng' || process.env.MAP_POLYGON === 'lng-lat') 
    ? (process.env.MAP_POLYGON as 'lng-lat' | 'lat-lng')
    : 'lat-lng'; // Default fallback if env variable not set or invalid

type CLIOptions = {
  district: string;
  sublocality: string;
  file: string;
};

type GeoJSONGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

type GeoJSONFeature = {
  type: 'Feature';
  geometry: GeoJSONGeometry;
};

type GeoJSON =
  | GeoJSONFeature
  | {
      type: 'FeatureCollection';
      features: GeoJSONFeature[];
    };

function logInfo(message: string, payload?: unknown) {
  console.log(`🟡🟡🟡 - [importGeoJsonPolygon ${new Date().toISOString()}] ${message}`, payload ?? '');
}

function logSuccess(message: string, payload?: unknown) {
  console.log(`✅✅✅ - [importGeoJsonPolygon ${new Date().toISOString()}] ${message}`, payload ?? '');
}

function logError(message: string, payload?: unknown) {
  console.error(`❗❗❗ - [importGeoJsonPolygon ${new Date().toISOString()}] ${message}`, payload ?? '');
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: Partial<CLIOptions> = {};

  args.forEach((arg) => {
    const [rawKey, rawValue] = arg.split('=');
    const key = rawKey.replace(/^--/, '');
    const value = rawValue ?? '';
    if (key === 'district') options.district = value;
    if (key === 'sublocality') options.sublocality = value;
    if (key === 'file') options.file = value;
  });

  if (!options.district || !options.sublocality || !options.file) {
    logError('Missing required parameters. Usage: ts-node src/scripts/importGeoJsonPolygon.ts --district="Abu Dhabi Island" --sublocality="Al Bateen" --file=./polygon.geojson');
    process.exitCode = 1;
    throw new Error('Invalid CLI arguments');
  }

  return options as CLIOptions;
}

function readGeoJSON(filePath: string): GeoJSON {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  logInfo('Reading GeoJSON file', { absolutePath });
  const fileContents = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(fileContents) as GeoJSON;
}

function extractFirstPolygonCoordinates(geojson: GeoJSON): number[][] {
  const resolvePolygon = (geometry: GeoJSONGeometry | undefined): number[][] | null => {
    if (!geometry) return null;
    if (geometry.type === 'Polygon') {
      return geometry.coordinates?.[0] ?? null;
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates?.[0]?.[0] ?? null;
    }
    return null;
  };

  if ((geojson as any).type === 'FeatureCollection') {
    const features = (geojson as { features: GeoJSONFeature[] }).features;
    for (const feature of features) {
      const coords = resolvePolygon(feature.geometry);
      if (coords?.length) return coords;
    }
    return [];
  }

  if ((geojson as any).type === 'Feature') {
    const coords = resolvePolygon((geojson as GeoJSONFeature).geometry);
    return coords ?? [];
  }

  return [];
}

function normalizePolygonPairs(pairs: number[][]): number[][] {
  return pairs
    .map((pair) => {
      const first = Number(pair?.[0]);
      const second = Number(pair?.[1]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) {
        return null;
      }

      // 2025-11-12T00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] Normalize to configured DB storage format
      if (DB_STORAGE_COORDINATE_ORDER === 'lng-lat') {
        // 2025-11-12T00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] Store as [lng, lat] in DB
        if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
          // Already [lng, lat] format
          return [first, second];
        }
        if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
          // Convert [lat, lng] -> [lng, lat]
          return [second, first];
        }
        // If both exceed ranges, assume [lng, lat] to avoid data loss
        return [first, second];
      } else {
        // 2025-11-12T00:00:00Z 🟡🟡🟡 - [importGeoJsonPolygon] Store as [lat, lng] in DB
        if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
          // Already [lat, lng] format
          return [first, second];
        }
        if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
          // Convert [lng, lat] -> [lat, lng]
          return [second, first];
        }
        // If both exceed ranges, assume [lat, lng] to avoid data loss
        return [first, second];
      }
    })
    .filter((pair): pair is number[] => Array.isArray(pair) && pair.length === 2);
}

async function upsertPolygon({ district, sublocality, file }: CLIOptions) {
  const geojson = readGeoJSON(file);
  const rawPairs = extractFirstPolygonCoordinates(geojson);
  if (!rawPairs.length) {
    throw new Error('No polygon coordinates found in GeoJSON (expected Polygon or MultiPolygon geometry).');
  }

  const normalizedPairs = normalizePolygonPairs(rawPairs);
  if (normalizedPairs.length < 3) {
    throw new Error('Normalized polygon has fewer than 3 coordinate pairs.');
  }

  logInfo('Normalized polygon coordinate pairs', { points: normalizedPairs.length });

  const row = await (prisma as any).deliveryLocations.findUnique({
    where: { district },
    select: { district: true, sublocalities: true },
  });

  if (!row) {
    throw new Error(`District "${district}" not found in deliveryLocations table.`);
  }

  const sublocalitiesValue = row.sublocalities;
  const sublocalitiesArray: any[] = Array.isArray(sublocalitiesValue)
    ? sublocalitiesValue
    : typeof sublocalitiesValue === 'string'
      ? JSON.parse(sublocalitiesValue)
      : Array.isArray((sublocalitiesValue as any)?.sublocalities)
        ? (sublocalitiesValue as any).sublocalities
        : [];

  if (!sublocalitiesArray.length) {
    throw new Error(`District "${district}" does not have a sublocalities array in the database.`);
  }

  const normalizedName = sublocality.toLowerCase().trim();
  const target = sublocalitiesArray.find((entry) => typeof entry?.name === 'string' && entry.name.toLowerCase().trim() === normalizedName);

  if (!target) {
    throw new Error(`Sublocality "${sublocality}" not found under district "${district}".`);
  }

  target.polygon = normalizedPairs;

  await (prisma as any).deliveryLocations.update({
    where: { district },
    data: { sublocalities: sublocalitiesArray },
  });

  logSuccess('Polygon imported successfully', {
    district,
    sublocality,
    points: normalizedPairs.length,
  });
}

async function main() {
  try {
    const options = parseArgs();
    await upsertPolygon(options);
  } catch (err) {
    logError('Import failed', (err as Error).message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();


