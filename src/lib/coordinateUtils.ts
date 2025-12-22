// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Centralized coordinate normalization utilities
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Eliminates DRY violations across services and scripts

export type CoordinatePair = { lat: number; lng: number };

// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Get coordinate order from MAP_POLYGON environment variable
// 2025-12-20T00:00:00Z ⚠️⚠️⚠️ - [coordinateUtils] SECURITY: Auto-detection removed - coordinate order must be explicitly configured
function getCoordinateOrder(): 'lng-lat' | 'lat-lng' {
  const order = process.env.MAP_POLYGON;
  if (order === 'lat-lng' || order === 'lng-lat') {
    return order as 'lng-lat' | 'lat-lng';
  }
  // Default fallback if env variable not set or invalid
  console.warn('⚠️⚠️⚠️ - [coordinateUtils] MAP_POLYGON not set or invalid, defaulting to lng-lat');
  return 'lng-lat';
}

// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Normalize a single coordinate pair from various formats
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Supports array format [lng, lat] or [lat, lng], and object format {lat, lng} or {latitude, longitude}
export function normalizeCoordinatePair(
  pair: number[] | { lat: number; lng: number } | { latitude: number; longitude: number } | any,
  coordinateOrder?: 'lng-lat' | 'lat-lng'
): CoordinatePair | null {
  const order = coordinateOrder || getCoordinateOrder();
  
  // Handle array format: [lng, lat] or [lat, lng]
  if (Array.isArray(pair) && pair.length >= 2) {
    const first = Number(pair[0]);
    const second = Number(pair[1]);
    
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      console.log('🟡🟡🟡 - [coordinateUtils] Skipped coordinate pair with invalid numbers');
      return null;
    }
    
    let lat: number, lng: number;
    
    if (order === 'lng-lat') {
      // 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Force [lng, lat] interpretation: first is longitude, second is latitude
      lng = first;
      lat = second;
    } else if (order === 'lat-lng') {
      // 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Force [lat, lng] interpretation: first is latitude, second is longitude
      lat = first;
      lng = second;
    } else {
      // 2025-12-20T00:00:00Z ⚠️⚠️⚠️ - [coordinateUtils] Invalid configuration - coordinate order must be specified
      console.error('❗❗❗ - [coordinateUtils] Invalid coordinate order configuration - must be "lng-lat" or "lat-lng"', { order });
      return null;
    }
    
    return { lat, lng };
  }
  
  // Handle object format: { lat, lng } or { latitude, longitude }
  if (pair && typeof pair === 'object') {
    let lat: number | undefined, lng: number | undefined;
    
    // Try { lat, lng } first
    if ('lat' in pair && 'lng' in pair) {
      lat = Number(pair.lat);
      lng = Number(pair.lng);
    } 
    // Fallback to { latitude, longitude }
    else if ('latitude' in pair && 'longitude' in pair) {
      lat = Number(pair.latitude);
      lng = Number(pair.longitude);
    }
    
    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  
  console.log('🟡🟡🟡 - [coordinateUtils] Unsupported coordinate pair format');
  return null;
}

// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Normalize entire polygon coordinate arrays
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Returns null if insufficient points (< 3) or invalid format
export function normalizePolygonCoordinates(
  raw: unknown,
  coordinateOrder?: 'lng-lat' | 'lat-lng'
): CoordinatePair[] | null {
  if (!Array.isArray(raw)) {
    console.log('🟡🟡🟡 - [coordinateUtils] Polygon data is not an array');
    return null;
  }
  
  const points: CoordinatePair[] = [];
  
  raw.forEach((pair, index) => {
    const normalized = normalizeCoordinatePair(pair, coordinateOrder);
    if (normalized) {
      points.push(normalized);
    } else {
      console.log(`🟡🟡🟡 - [coordinateUtils] Skipped polygon entry at index ${index}`);
    }
  });
  
  if (points.length < 3) {
    console.warn('⚠️⚠️⚠️ - [coordinateUtils] Polygon has insufficient points', { count: points.length });
    return null;
  }
  
  return points;
}

// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Convert normalized coordinate to array format in specified storage order
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Used by import scripts to convert to database storage format
export function coordinateToArray(
  coord: CoordinatePair,
  storageOrder: 'lng-lat' | 'lat-lng'
): [number, number] {
  if (storageOrder === 'lng-lat') {
    return [coord.lng, coord.lat];
  } else {
    return [coord.lat, coord.lng];
  }
}

// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Auto-detect coordinate format based on value ranges and normalize
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Used by import scripts for format detection (not used by services for security)
export function normalizeCoordinatePairWithAutoDetect(
  pair: number[],
  targetStorageOrder: 'lng-lat' | 'lat-lng'
): [number, number] | null {
  const first = Number(pair?.[0]);
  const second = Number(pair?.[1]);
  
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }
  
  // Auto-detect format based on value ranges
  const isLikelyLngLat = Math.abs(first) <= 180 && Math.abs(second) <= 90;
  const isLikelyLatLng = Math.abs(first) <= 90 && Math.abs(second) <= 180;
  
  let normalized: CoordinatePair | null = null;
  
  if (isLikelyLngLat) {
    // Already in [lng, lat] format
    normalized = { lng: first, lat: second };
  } else if (isLikelyLatLng) {
    // Already in [lat, lng] format
    normalized = { lat: first, lng: second };
  } else {
    // Ambiguous - assume based on target storage order to avoid data loss
    if (targetStorageOrder === 'lng-lat') {
      normalized = { lng: first, lat: second };
    } else {
      normalized = { lat: first, lng: second };
    }
  }
  
  // Convert to target storage format
  return coordinateToArray(normalized, targetStorageOrder);
}

