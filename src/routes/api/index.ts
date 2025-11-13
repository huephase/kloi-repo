// src/routes/api/index.ts
// Aggregates API routes. All POST routes are handled here.
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { WizardStepConfig, OrderStatus } from '../../types/index';
import { prisma } from '../../lib/prisma';
import { eventDetailsSchema, locationDataSchema, dateSelectionSchema, eventSetupSchema } from '../../schemas/wizard.schemas';
import { ZodError } from 'zod';
import { reverseGeocodeQuerySchema } from '../../schemas/common.schemas';
import { sanitizeEmail } from '../../lib/utils';
import { createCustomerSafely, resolveCustomerConflict } from '../../services/conflictResolutionService';

// Maps wizard steps to session keys and redirect targets
// The step parameter will be the wizard step, for eg. "location"
// The data will be stored in the session under the key "locationData"
// redirectTo: means the user will be redirected to next wizard, eg for "location" it will be /customer-info
const stepConfig: Record<string, WizardStepConfig> = {
  location: { sessionKey: 'locationData', redirectTo: '/event-details' },
  // ⚠️⚠️⚠️ IMPORTANT NOTE: customerInfo IS eventDetails NOW
  customer: { sessionKey: 'eventDetails', redirectTo: '/date-picker' },
  'event-details': { sessionKey: 'eventDetails', redirectTo: '/date-picker' }, // 🟡🟡🟡 - [NEW ROUTE] Support direct event-details endpoint
  date: { sessionKey: 'dateInfo', redirectTo: '/event-setup' },
  event: { sessionKey: 'eventSetup', redirectTo: '/event-summary' },
  summary: { sessionKey: 'finalReview', redirectTo: '/checkout' }, // optional, for review screen
};

// 🟡🟡🟡 - [VALIDATION] Function to format validation errors for client
function formatValidationErrors(error: ZodError) {
  console.log('❗❗❗ - [VALIDATION] Formatting validation errors:', error.errors);
  
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const field = err.path.join('.');
    errors[field] = err.message;
    console.log(`❗❗❗ - [VALIDATION] Field "${field}": ${err.message}`);
  });
  
  return errors;
}

// 🟡🟡🟡 - [VALIDATION] Function to validate data based on step
function validateStepData(step: string, data: any) {
  // console.log('🟡🟡🟡 - [VALIDATION] Validating data for step:', step);
  // console.log('🟡🟡🟡 - [VALIDATION] Data to validate:', JSON.stringify(data, null, 2));
  
  switch (step) {
    case 'location':
      return locationDataSchema.parse(data);
    
    case 'customer':
    case 'event-details':
      return eventDetailsSchema.parse(data);
    
    case 'date':
      return dateSelectionSchema.parse(data);
    
    case 'event':
      return eventSetupSchema.parse(data);
    
    default:
      // For other steps, return data as-is (no validation)
      console.log('🟡🟡🟡 - [VALIDATION] No specific validation for step:', step);
      return data;
  }
}

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [LOCATION VALIDATION] Point-in-polygon check using ray casting algorithm
  // ⚠️⚠️⚠️ - [LOCATION VALIDATION] Polygon coordinates from DB are always the source of truth
  function isPointInPolygon(lat: number, lng: number, polygon: Array<{ lat: number; lng: number }>): boolean {
    if (!polygon || polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      
      const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [LOCATION VALIDATION] Helper function to validate coordinates match selected delivery area
  // ⚠️⚠️⚠️ - [LOCATION VALIDATION] SECURITY FIX: Polygon containment is primary check, reverse geocoding is fallback
  async function validateLocationCoordinates(
    lat: number,
    lng: number,
    expectedDistrict: string | null,
    expectedSublocality: string | null
  ): Promise<{ valid: boolean; actualDistrict?: string | null; actualSublocality?: string | null; error?: string }> {
    const now = () => new Date().toISOString();
    const logInfo = (message: string, payload?: any) => console.log(`🟡🟡🟡 - [validateLocationCoordinates ${now()}] ${message}`, payload ?? '');
    const logWarn = (message: string, payload?: any) => console.warn(`⚠️⚠️⚠️ - [validateLocationCoordinates ${now()}] ${message}`, payload ?? '');
    const logError = (message: string, payload?: any) => console.error(`❗❗❗ - [validateLocationCoordinates ${now()}] ${message}`, payload ?? '');

    if (!expectedDistrict && !expectedSublocality) {
      logWarn('No expected district or sublocality provided for validation');
      return { valid: true }; // If no expected area, allow any location
    }

    if (!isFinite(lat) || !isFinite(lng)) {
      logError('Invalid coordinates provided', { lat, lng });
      return { valid: false, error: 'Invalid coordinates' };
    }

    // ⚠️⚠️⚠️ - [LOCATION VALIDATION] SECURITY FIX: Validate session data against database first
    try {
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [LOCATION VALIDATION] Verify expected district/sublocality exists in database
      const { getAreaPolygonByNames } = await import('../../services/areaPolygonService');
      const polygon = await getAreaPolygonByNames(expectedDistrict || undefined, expectedSublocality || undefined);
      
      // ⚠️⚠️⚠️ - [LOCATION VALIDATION] SECURITY FIX: Polygon from DB is source of truth - check containment first
      if (polygon && polygon.paths && polygon.paths.length >= 3) {
        const isInside = isPointInPolygon(lat, lng, polygon.paths);
        logInfo('Polygon containment check', { isInside, polygonPoints: polygon.paths.length });
        
        if (!isInside) {
          logWarn('Location validation failed - coordinates outside polygon boundary', {
            expectedDistrict,
            expectedSublocality,
            lat,
            lng
          });
          return { valid: false, error: 'Location is outside your selected delivery area' };
        }
        
        // Point is inside polygon - proceed with reverse geocoding for additional verification
        logInfo('Polygon containment check passed - proceeding with reverse geocoding verification');
      } else {
        logWarn('Polygon not found in database - falling back to reverse geocoding only', {
          expectedDistrict,
          expectedSublocality
        });
      }
    } catch (polygonErr) {
      logError('Error checking polygon containment', polygonErr);
      // Continue with reverse geocoding fallback
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [LOCATION VALIDATION] Reverse geocoding as secondary verification
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      logError('GOOGLE_MAPS_API_KEY missing');
      return { valid: false, error: 'Geocoding not configured' };
    }

    try {
      logInfo('Validating coordinates with reverse geocoding', { lat, lng, expectedDistrict, expectedSublocality });
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat + ',' + lng)}&key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      const data = await res.json() as {
        status: string;
        results?: Array<{
          address_components?: Array<{
            long_name: string;
            short_name: string;
            types: string[];
          }>;
        }>;
      };

      if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
        logError('Reverse geocoding failed', { status: data.status });
        // ⚠️⚠️⚠️ - [LOCATION VALIDATION] If polygon check passed, allow even if reverse geocoding fails
        // If polygon check didn't run, fail closed
        return { valid: false, error: 'Failed to validate location' };
      }

      let actualDistrict: string | null = null;
      let actualSublocality: string | null = null;

      for (const r of data.results) {
        if (!r.address_components) continue;
        const comps = r.address_components as Array<{ long_name: string; short_name: string; types: string[] }>;
        for (const c of comps) {
          if (!actualDistrict && (c.types.includes('administrative_area_level_2') || c.types.includes('sublocality_level_1'))) {
            actualDistrict = c.long_name;
          }
          if (!actualSublocality && (c.types.includes('sublocality') || c.types.includes('neighborhood') || c.types.includes('locality'))) {
            actualSublocality = c.long_name;
          }
        }
        if (actualDistrict && actualSublocality) break;
      }

      logInfo('Reverse geocoding result', { actualDistrict, actualSublocality, expectedDistrict, expectedSublocality });

      // Validate: district must match if expected, sublocality must match if expected
      const districtMatches: boolean = !expectedDistrict || Boolean(actualDistrict && actualDistrict.toLowerCase().trim() === expectedDistrict.toLowerCase().trim());
      const sublocalityMatches: boolean = !expectedSublocality || Boolean(actualSublocality && actualSublocality.toLowerCase().trim() === expectedSublocality.toLowerCase().trim());

      const isValid: boolean = districtMatches && sublocalityMatches;

      if (!isValid) {
        logWarn('Location validation failed - coordinates do not match selected area', {
          expectedDistrict,
          expectedSublocality,
          actualDistrict,
          actualSublocality
        });
      } else {
        logInfo('Location validation successful - coordinates match selected area');
      }

      return {
        valid: isValid,
        actualDistrict,
        actualSublocality,
        error: isValid ? undefined : 'Location is outside your selected delivery area'
      };
    } catch (err) {
      logError('Error validating location coordinates', err);
      return { valid: false, error: 'Failed to validate location' };
    }
  }

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [LOCATION BUILDER] Helper function to build complete location object from session locationData
  function buildLocationObject(sessionLocationData: any): any {
    const now = () => new Date().toISOString();
    const logInfo = (message: string, payload?: any) => console.log(`🟡🟡🟡 - [buildLocationObject ${now()}] ${message}`, payload ?? '');
    const logWarn = (message: string, payload?: any) => console.warn(`⚠️⚠️⚠️ - [buildLocationObject ${now()}] ${message}`, payload ?? '');
  
  if (!sessionLocationData) {
    logWarn('No location data provided to buildLocationObject');
    return null;
  }
  
  // 2025-11-08T00:00:00Z 🟡🟡🟡 - [LOCATION BUILDER] Extract components from session locationData
  // 2025-11-08T00:00:00Z ⚠️⚠️⚠️ - [LOCATION BUILDER] Components MUST come from delivery-location page, not from map geocoding
  const components = sessionLocationData.components || {};
  
  // 2025-11-08T00:00:00Z 🟡🟡🟡 - [LOCATION BUILDER] Prioritize components (from delivery-location) over top-level fields (from map geocoding)
  const city = components.city || sessionLocationData.city || null;
  const country = components.country || sessionLocationData.country || null;
  const sublocality = components.sublocality || sessionLocationData.sublocality || null;
  const surchargeStr = components.surcharge || sessionLocationData.surcharge || '0';
  const surcharge = typeof surchargeStr === 'string' ? parseFloat(surchargeStr) : (typeof surchargeStr === 'number' ? surchargeStr : 0);
  
  // 2025-11-08T00:00:00Z 🟡🟡🟡 - [LOCATION BUILDER] Log warning if components are missing (should come from delivery-location)
  if (!components || Object.keys(components).length === 0) {
    logWarn('No components found in locationData - delivery location metadata may be missing', {
      hasLocationData: !!sessionLocationData,
      locationDataKeys: sessionLocationData ? Object.keys(sessionLocationData) : []
    });
  }
  
  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [LOCATION BUILDER] Build location object with all required fields
  const locationObject: any = {
    latitude: sessionLocationData.latitude ? Number(sessionLocationData.latitude) : null,
    longitude: sessionLocationData.longitude ? Number(sessionLocationData.longitude) : null,
    fullAddress: sessionLocationData.fullAddress || null,
  };
  
  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [LOCATION BUILDER] Add delivery location fields from components
  if (country) locationObject.country = country;
  if (city) locationObject.city = city;
  if (sublocality) locationObject.sublocality = sublocality;
  if (components.district) locationObject.district = components.district;
  if (!isNaN(surcharge) && surcharge >= 0) locationObject.surcharge = surcharge;
  
  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [LOCATION BUILDER] Include selection source if available
  if (components.selectionSource) locationObject.selectionSource = components.selectionSource;
  
  logInfo('Built location object', {
    hasCoordinates: !!(locationObject.latitude && locationObject.longitude),
    hasAddress: !!locationObject.fullAddress,
    country,
    city,
    sublocality,
    surcharge
  });
  
  return locationObject;
}

export default async function apiRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [RATE LIMITING] Simple in-memory rate limiter for /api/geo/reverse
  // ⚠️⚠️⚠️ - [RATE LIMITING] SECURITY FIX: Prevent abuse of reverse geocoding endpoint
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
  const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per session
  
  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [RATE LIMITING] Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 30000); // Cleanup every 30 seconds

  // 🟡🟡🟡 - [GEO API] Reverse geocoding via Google Maps
  app.get('/geo/reverse', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [RATE LIMITING] SECURITY FIX: Check rate limit before processing
      const sessionId = request.session?.sessionId || request.ip || 'anonymous';
      const now = Date.now();
      const rateLimitKey = `geo-reverse-${sessionId}`;
      const rateLimit = rateLimitMap.get(rateLimitKey);
      
      if (rateLimit) {
        if (now > rateLimit.resetTime) {
          // Reset window
          rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        } else if (rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
          console.warn(`⚠️⚠️⚠️ - [GEO API ${new Date().toISOString()}] Rate limit exceeded for session`, { sessionId: sessionId.substring(0, 8) });
          return reply.status(429).send({ 
            success: false, 
            message: 'Too many requests. Please wait a moment and try again.',
            retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
          });
        } else {
          rateLimit.count++;
        }
      } else {
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      }

      const q = (request as any).query || {};
      const parsed = reverseGeocodeQuerySchema.safeParse(q);
      if (!parsed.success) {
        console.error('❗❗❗ - [GEO API] Query validation failed:', parsed.error.flatten());
        return reply.status(400).send({ success: false, message: 'Invalid lat/lng' });
      }

      const { lat, lng } = parsed.data;
      console.log('🟡🟡🟡 - [API ROUTE] GET /api/geo/reverse', { lat, lng });

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error('❗❗❗ - [GEO API] Invalid lat/lng');
        return reply.status(400).send({ success: false, message: 'Invalid lat/lng' });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('❗❗❗ - [GEO API] GOOGLE_MAPS_API_KEY missing');
        return reply.status(500).send({ success: false, message: 'Geocoding not configured' });
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat + ',' + lng)}&key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      // 🟡🟡🟡 - [GEO API] Type the Google Maps Geocoding API response
      const data = await res.json() as {
        status: string;
        results?: Array<{
          address_components?: Array<{
            long_name: string;
            short_name: string;
            types: string[];
          }>;
        }>;
      };
      console.log('🟡🟡🟡 - [GEO API] Google response status:', data.status);

      let district: string | null = null;
      let sublocality: string | null = null;
      if (Array.isArray(data.results)) {
        for (const r of data.results) {
          if (!r.address_components) continue;
          const comps = r.address_components as Array<{ long_name: string; short_name: string; types: string[] }>;
          for (const c of comps) {
            if (!district && (c.types.includes('administrative_area_level_2') || c.types.includes('sublocality_level_1'))) {
              district = c.long_name;
            }
            if (!sublocality && (c.types.includes('sublocality') || c.types.includes('neighborhood') || c.types.includes('locality'))) {
              sublocality = c.long_name;
            }
          }
          if (district && sublocality) break;
        }
      }

      return reply.send({
        success: true,
        district: district || null,
        sublocality: sublocality || null,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❗❗❗ - [GEO API] Reverse geocode error:', err);
      return reply.status(500).send({ success: false, message: 'Reverse geocode failed' });
    }
  });

  // 2025-11-11T00:00:00Z 🟡🟡🟡 - [GEO API] Area polygon by district/sublocality (for client-side polygon containment)
  app.get('/geo/area', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const q = (request as any).query || {};
      const district = typeof q.district === 'string' ? q.district.trim() : '';
      const sublocality = typeof q.sublocality === 'string' ? q.sublocality.trim() : '';

      console.log(`🟡🟡🟡 - [API ROUTE ${new Date().toISOString()}] GET /api/geo/area`, { district, sublocality });

      if (!district && !sublocality) {
        console.error(`❗❗❗ - [GEO API ${new Date().toISOString()}] Missing district and sublocality`);
        return reply.status(400).send({ success: false, message: 'district or sublocality required' });
      }

      const { getAreaPolygonByNames } = await import('../../services/areaPolygonService');
      const polygon = await getAreaPolygonByNames(district, sublocality);

      if (!polygon || !Array.isArray(polygon?.paths) || polygon.paths.length === 0) {
        console.warn(`⚠️⚠️⚠️ - [GEO API ${new Date().toISOString()}] Polygon not found for area`, { district, sublocality });
        return reply.status(404).send({ success: false, message: 'Polygon not found' });
      }

      console.log(`✅✅✅ - [GEO API ${new Date().toISOString()}] Polygon found`, { numPoints: polygon.paths.length });
      return reply.send({
        success: true,
        polygon
      });
    } catch (err) {
      console.error(`❗❗❗ - [GEO API ${new Date().toISOString()}] Area polygon error:`, err);
      return reply.status(500).send({ success: false, message: 'Area polygon lookup failed' });
    }
  });
  
  // 👍👍👍👍👍👍 - 2024-12-28 - SERVER TIME API ENDPOINT
  // This endpoint provides reliable server time to avoid dependency on user device time
  app.get('/server-time', async (_request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [API ROUTE] GET /api/server-time - Providing server time');
    
    try {
      const serverTime = new Date();
      const serverTimeISO = serverTime.toISOString();
      const serverTimeLocal = serverTime.toLocaleString();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log('✅✅✅ - [API ROUTE] Server time provided:', serverTimeISO);
      
      return reply.send({
        success: true,
        serverTime: serverTimeISO,
        serverTimeLocal: serverTimeLocal,
        timezone: timezone,
        timestamp: serverTime.getTime(), // Unix timestamp
        message: 'Server time retrieved successfully'
      });
      
    } catch (error) {
      console.error('❗❗❗ - [API ROUTE] Error getting server time:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get server time',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🟡🟡🟡 - [BOOKED DATES API] Retrieve booked dates from database for date picker calendar
  app.get('/booked-dates', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [API ROUTE] GET /api/booked-dates - Retrieving booked dates from database');
    
    try {
      // 🟡🟡🟡 - [SESSION ID] Get session ID from request to exclude current user's PENDING orders
      const sessionId = request.session?.sessionId;
      console.log('🟡🟡🟡 - [BOOKED DATES] Session ID:', sessionId ? sessionId.substring(0, 8) : 'none');

      // 🟡🟡🟡 - [DATABASE QUERY] Get all orders with eventDateTime data
      // ⚠️⚠️⚠️ - [BOOKING LOGIC] Only include orders with status beyond PENDING (IN_PROGRESS, CANCELLED, COMPLETED)
      // 🟡🟡🟡 - PENDING orders should NOT lock dates as customer hasn't confirmed checkout yet
      // 🟡🟡🟡 - [BACK BUTTON FIX] This fix ensures when user hits back button, their own PENDING order dates remain selectable
      const ordersWithDates = await prisma.kloiOrdersTable.findMany({
        where: {
          eventDateTime: {
            not: null as any
          },
          // 🟡🟡🟡 - [STATUS FILTER] Only lock dates for confirmed orders (beyond PENDING status)
          // 🟡🟡🟡 - Excluding PENDING means dates are only locked once order status progresses beyond pending
          status: {
            in: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'] as any
          }
        },
        select: {
          id: true,
          orderNumber: true,
          eventDateTime: true,
          status: true,
          sessionId: true
        }
      });

      console.log('🟡🟡🟡 - [BOOKED DATES] Found orders with dates (excluding PENDING):', ordersWithDates.length);
      console.log('🟡🟡🟡 - [BOOKED DATES] Status breakdown:', {
        IN_PROGRESS: ordersWithDates.filter(o => o.status === 'IN_PROGRESS').length,
        CANCELLED: ordersWithDates.filter(o => o.status === 'CANCELLED').length,
        COMPLETED: ordersWithDates.filter(o => o.status === 'COMPLETED').length
      });

      // 🟡🟡🟡 - [DATA PROCESSING] Extract all booked dates from eventDateTime JSONB
      const bookedDates: string[] = [];
      const bookedDatesWithDetails: Array<{
        date: string;
        startTime: string;
        endTime: string;
        orderNumber: number;
        status: string;
      }> = [];

      ordersWithDates.forEach(order => {
        const eventDateTime = order.eventDateTime as any;
        
        if (eventDateTime && eventDateTime.events && Array.isArray(eventDateTime.events)) {
          eventDateTime.events.forEach((event: any) => {
            if (event.date) {
              bookedDates.push(event.date);
              bookedDatesWithDetails.push({
                date: event.date,
                startTime: event.startTime || '00:00',
                endTime: event.endTime || '23:59',
                orderNumber: order.orderNumber,
                status: order.status
              });
            }
          });
        }
      });

      // 🟡🟡🟡 - [DEDUPLICATION] Remove duplicate dates (multiple orders on same date)
      const uniqueBookedDates = [...new Set(bookedDates)];
      
      console.log('✅✅✅ - [BOOKED DATES] Unique booked dates found:', uniqueBookedDates.length);
      console.log('🟡🟡🟡 - [BOOKED DATES] Sample booked dates:', uniqueBookedDates.slice(0, 5));

      return reply.send({
        success: true,
        bookedDates: uniqueBookedDates,
        bookedDatesWithDetails: bookedDatesWithDetails,
        totalBookedDates: uniqueBookedDates.length,
        message: 'Booked dates retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❗❗❗ - [API ROUTE] Error retrieving booked dates:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to retrieve booked dates',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 🔍🔍🔍 DATABASE CONNECTION TEST ROUTE
  // 🟤🟤🟤 src/routes/api/index.ts:23:30 - error TS6133: 'request' is declared but its value is never read.
  app.get('/db-test', async (_request, reply: FastifyReply) => {
    console.log('🔍🔍🔍 - [API ROUTE] GET /api/db-test - Testing database connection');
    console.log('🔍🔍🔍 - [API ROUTE] DATABASE_URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    
    try {
      // Test basic database connection
      const startTime = Date.now();
      await prisma.$connect();
      const connectionTime = Date.now() - startTime;
      
      // Test a simple query to verify the connection works
      const testQuery = await prisma.$queryRaw`SELECT version() as db_version, now() as current_time`;
      const queryTime = Date.now() - startTime;
      
      // Get database info
      const customerCount = await prisma.customers.count();
      const sessionCount = await prisma.session.count();
      const orderCount = await prisma.kloiOrdersTable.count();
      const menuCount = await prisma.menus.count();
      
      console.log('✅✅✅ - [API ROUTE] Database connection successful');
      console.log('✅✅✅ - [API ROUTE] Connection time:', connectionTime, 'ms');
      console.log('✅✅✅ - [API ROUTE] Query time:', queryTime, 'ms');
      
      return reply.send({
        success: true,
        message: 'Database connection successful',
        data: {
          databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
          connectionTime: `${connectionTime}ms`,
          queryTime: `${queryTime}ms`,
          databaseInfo: testQuery,
          tableInfo: {
            customers: customerCount,
            sessions: sessionCount,
            orders: orderCount,
            menus: menuCount
          },
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('🔴🔴🔴 - [API ROUTE] Database connection failed:', error);
      console.error('🔴🔴🔴 - [API ROUTE] DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      
      return reply.status(500).send({
        success: false,
        message: 'Database connection failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof Error && 'code' in error ? error.code : 'UNKNOWN',
          databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      // Ensure we disconnect to avoid connection leaks
      await prisma.$disconnect();
    }
  });

  // 🟡🟡🟡 - [DEBUG ENDPOINT] View menu data for debugging
  app.get('/debug-menu/:theme', async (request, reply: FastifyReply) => {
    const theme = (request.params as any).theme;
    console.log('🟡🟡🟡 - [DEBUG ENDPOINT] Viewing menu for theme:', theme);
    
    try {
      const menu = await prisma.menus.findFirst({
        where: { theme: theme }
      });

      if (!menu) {
        return reply.send({
          success: false,
          message: `No menu found for theme: ${theme}`
        });
      }

      return reply.send({
        success: true,
        data: {
          id: menu.id,
          name: menu.name,
          theme: menu.theme,
          menuItems: menu.menuItems
        }
      });

    } catch (error) {
      console.error('❗❗❗ - [DEBUG ENDPOINT] Error viewing menu:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to view menu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🟡🟡🟡 - [TEST ENDPOINT] Test endpoint to create sample menu
  app.post('/test-menu', async (_request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [TEST ENDPOINT] Creating test menu');
    
    try {
      const testMenu = await prisma.menus.create({
        data: {
          name: 'Test Matcha Menu',
          theme: 'red',
          menuItems: {
            "section1": {
              "order": 1,
              "html-type": "h1",
              "content": "Matcha Menu"
            },
            "section2": {
              "order": 2,
              "html-type": "p",
              "content": "Finest Matcha Selections"
            },
            "section3": {
              "order": 3,
              "html-type": "image",
              "src": "/public/menus/red/section-3.jpg",
              "alt": "Fresh matcha preparation",
              "caption": "Freshly prepared matcha with premium ingredients"
            },
            "section4": {
              "order": 4,
              "html-type": "h2",
              "content": "Please select your Matcha menu"
            },
            "section5": {
              "order": 5,
              "html-type": "radio-group",
              "content": {
                "radio1": {
                  "label": "Matcha Ice Cream Only",
                  "description": "Full matcha ice cream selections",
                  "price": 50.00,
                  "price-basis": "Per guest",
                  "popup": {
                    "section1": {
                      "html-type": "image",
                      "src": "/public/menus/red/popup-radio-1.jpg",
                      "alt": "Matcha ice cream",
                      "caption": "Premium matcha ice cream selection"
                    },
                    "section2": {
                      "html-type": "p",
                      "content": "Matcha[a] (抹茶) /ˈmætʃə, ˈmɑːtʃə/ is a finely ground powder of green tea specially processed from shade-grown tea leaves."
                    },
                    "section3": {
                      "html-type": "unordered-list",
                      "content": [
                        "100% Organic", "Ceremonial Grade", "Direct from Japan"
                      ]
                    }
                  }
                },
                "radio2": {
                  "label": "Matcha and Specialty Drinks",
                  "description": "Full matcha ice cream & drinks selections",
                  "price": 75.00,
                  "price-basis": "Per guest"
                },
                "radio3": {
                  "label": "Specialty Drinks Only",
                  "description": "Matcha Drinks",
                  "price": 42.00,
                  "price-basis": "Per guest"
                }
              }
            },
            "section6": {
              "order": 6,
              "html-type": "product-group",
              "content": {
                "seasonal-offer": {
                  "label": "Seasonal Ice Cream",
                  "price": 17.00,
                  "price-basis": "Per guest"
                },
                "zero-sugar": {
                  "label": "Zero Sugar Ice Cream",
                  "price": 9.00,
                  "price-basis": "Per guest"
                }
              }
            },
            "section7": {
              "order": 7,
              "html-type": "h2",
              "content": "Select your upgrades below"
            },
            "section8": {
              "order": 8,
              "html-type": "checkbox-group",
              "content": {
                "checkbox1": {
                  "label": "Matcha Upgrade",
                  "price": 23.00,
                  "price-basis": "Per guest"
                },
                "checkbox2": {
                  "label": "Kids Menu",
                  "price": 15.00,
                  "price-basis": "Per guest"
                },
                "checkbox3": {
                  "label": "Non-Dairy options",
                  "price": 2.00,
                  "price-basis": "Per guest"
                },
                "checkbox4": {
                  "label": "Live DJ",
                  "price": 1500.00,
                  "price-basis": "Per day"
                }
              }
            }
          }
        }
      });

      console.log('✅✅✅ - [TEST ENDPOINT] Test menu created:', testMenu.id);

      return reply.send({
        success: true,
        message: 'Test menu created successfully',
        data: {
          id: testMenu.id,
          name: testMenu.name,
          theme: testMenu.theme
        }
      });

    } catch (error) {
      console.error('❌❌❌ - [TEST ENDPOINT] Failed to create test menu:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to create test menu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🟡🟡🟡 - [TEST ENDPOINT] Test endpoint to create sample order
  app.post('/test-order', async (_request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [TEST ENDPOINT] Creating test order');
    
    try {
      const testOrder = await prisma.kloiOrdersTable.create({
        data: {
          firstName: 'Test',
          lastName: 'User',
          phone: '+971501234567',
          email: 'test@example.com',
          location: {
            fullAddress: 'Test Address, Dubai, UAE',
            city: 'Dubai',
            country: 'UAE',
            latitude: 25.2048,
            longitude: 55.2708
          },
          eventDetails: {
            propertyType: 'APARTMENT',
            buildingName: 'Test Building',
            floorNumber: '5',
            unitNumber: '502',
            street: 'Test Street',
            additionalDirections: 'Test directions'
          },
          // 🟡🟡🟡 - [2025-01-05] Updated to use new eventDateTime JSONB structure
          eventDateTime: {
            events: [
              {
                date: '2025-01-10',
                startTime: '09:00',
                endTime: '17:00'
              }
            ],
            isMultiDay: false
          },
          status: OrderStatus.PENDING
        }
      });

      console.log('✅✅✅ - [TEST ENDPOINT] Test order created:', testOrder.id);
      console.log('✅✅✅ - [TEST ENDPOINT] Order number:', testOrder.orderNumber);

      return reply.send({
        success: true,
        message: 'Test order created successfully',
        data: {
          id: testOrder.id,
          orderNumber: testOrder.orderNumber,
          createdAt: testOrder.createdAt
        }
      });

    } catch (error) {
      console.error('❌❌❌ - [TEST ENDPOINT] Failed to create test order:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to create test order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🟡🟡🟡 - [CONFLICT RESOLUTION API] Endpoint to handle customer conflict resolution
  app.post('/resolve-conflict', async (request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [CONFLICT RESOLUTION API] Resolving customer conflict');
    console.log('🟡🟡🟡 - [CONFLICT RESOLUTION API] Request body:', JSON.stringify(request.body, null, 2));
    
    if (!request.session || !request.session.sessionId) {
      console.log('⚠️⚠️⚠️ - [CONFLICT RESOLUTION API] No session found');
      return reply.status(401).send({
        success: false,
        message: 'Session not found. Please start from the beginning.',
        errors: { session: 'Session not found' }
      });
    }

    try {
      const { phone, email, firstName, lastName, conflictType } = request.body as any;
      
      if (!phone || !conflictType) {
        return reply.status(400).send({
          success: false,
          message: 'Missing required fields for conflict resolution',
          errors: { data: 'Phone and conflict type are required' }
        });
      }

      // 🟡🟡🟡 - [CONFLICT RESOLUTION] Resolve the conflict
      const resolutionResult = await resolveCustomerConflict(
        phone,
        email,
        firstName,
        lastName,
        conflictType
      );

      if (resolutionResult.success) {
        console.log('✅✅✅ - [CONFLICT RESOLUTION API] Conflict resolved successfully:', resolutionResult.customerId);
        
        // Store customer ID in session for future reference
        (request.session as any).customerId = resolutionResult.customerId;
        
        // Update session with the resolved customer data
        (request.session as any).eventDetails = {
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          email: email
        };
        
        console.log('✅✅✅ - [CONFLICT RESOLUTION API] Session updated with resolved customer data');
        
        return reply.send({
          success: true,
          message: 'Customer conflict resolved successfully',
          customerId: resolutionResult.customerId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❗❗❗ - [CONFLICT RESOLUTION API] Failed to resolve conflict:', resolutionResult.message);
        return reply.status(500).send({
          success: false,
          message: 'Failed to resolve customer conflict',
          error: resolutionResult.message
        });
      }
      
    } catch (error) {
      console.error('❌❌❌ - [CONFLICT RESOLUTION API] Error resolving conflict:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error resolving customer conflict',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post<{
    Params: { step: string };
  }>('/session/:step', async (request, reply: FastifyReply) => {
    const step = request.params.step;
    
    // console.log('⚪⚪⚪ - [API ROUTE] POST /session/:step called with step:', step);
    // console.log('⚪⚪⚪ - [API ROUTE] Request body:', JSON.stringify(request.body, null, 2));
    // console.log('⚪⚪⚪ - [API ROUTE] Session ID:', request.session?.sessionId);
    // console.log('⚪⚪⚪ - [API ROUTE] Current session data:', JSON.stringify(request.session, null, 2));
    // 2025-11-04T00:00:00Z ⚪⚪⚪ - [API ROUTE] Detect autosave mode (query or header)
    const q = (request as any).query || {};
    const autosaveQuery = q.autosave === '1' || q.autosave === 1 || q.autosave === true;
    const autosaveHeader = (request.headers['x-kloi-autosave'] === '1');
    const isAutoSave = !!(autosaveQuery || autosaveHeader);
    console.log('⚪⚪⚪ - [API ROUTE] Autosave mode detected:', isAutoSave);
    
    // Validate step is supported
    if (!step || !stepConfig[step]) {
      console.warn(`⚠️⚠️⚠️ - [API ROUTE] Unknown wizard step: ${step}`);
      return reply.status(400).send({
        success: false,
        message: `Invalid wizard step: ${step}`,
        errors: { step: 'Invalid wizard step' }
      });
    }

    if (!request.session || !request.session.sessionId) {
      console.log('⚠️⚠️⚠️ - [API ROUTE] No session found');
      return reply.status(401).send({
        success: false,
        message: 'Session not found. Please start from the beginning.',
        errors: { session: 'Session not found' }
      });
    }

    try {
      const { sessionKey, redirectTo } = stepConfig[step];
      console.log(`🟡🟡🟡 - [API ROUTE] Using config: sessionKey=${sessionKey}, redirectTo=${redirectTo}`);

      // 🟡🟡🟡 - [VALIDATION] Validate strictly for normal saves; be lenient for autosave
      // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Log raw request body for location step to debug components
      // if (step === 'location') {
      //   console.log('🟡🟡🟡 - [API ROUTE] Location step - Raw request body:', JSON.stringify(request.body, null, 2));
      // }
      
      let validatedData;
      if (isAutoSave) {
        // 2025-11-04T00:00:00Z 🟡🟡🟡 - [AUTOSAVE] Skip strict validation; merge partial payload
        console.log('🟡🟡🟡 - [AUTOSAVE] Skipping strict validation for autosave payload');
        validatedData = request.body as any;
      } else {
        try {
          validatedData = validateStepData(step, request.body);
          console.log('✅✅✅ - [VALIDATION] Data validation successful for step:', step);
          // console.log('✅✅✅ - [VALIDATION] Validated data:', JSON.stringify(validatedData, null, 2));
          
          // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Check if components were preserved after validation
          if (step === 'location') {
            // const hasComponents = !!(validatedData as any)?.components;
            // console.log('🟡🟡🟡 - [API ROUTE] Location step - Components after validation:', {
            //   hasComponents,
            //   components: (validatedData as any)?.components,
            //   allKeys: Object.keys(validatedData || {})
            // });
          }
        } catch (validationError) {
          if (validationError instanceof ZodError) {
            console.log('❗❗❗ - [VALIDATION] Validation failed for step:', step);
            console.log('❗❗❗ - [VALIDATION] Validation errors:', validationError.errors);
            
            const formattedErrors = formatValidationErrors(validationError);
            
            // 🟡🟡🟡 - [VALIDATION ERROR RESPONSE] Return validation errors to display in form
            return reply.status(400).send({
              success: false,
              message: 'Please correct the errors below and try again.',
              errors: formattedErrors,
              timestamp: new Date().toISOString()
            });
          } else {
            // Handle unexpected validation errors
            console.error('❌❌❌ - [VALIDATION] Unexpected validation error:', validationError);
            return reply.status(500).send({
              success: false,
              message: 'An unexpected error occurred during validation.',
              errors: { general: 'Validation error' }
            });
          }
        }
      }

      // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Store the data in session. For autosave, merge with existing data.
      // 2025-11-08T00:00:00Z ⚠️⚠️⚠️ - [API ROUTE] Special handling for location step: preserve delivery-location components when updating from map
      if (sessionKey) {
        const current = ((request.session as any)[sessionKey]) || {};
        
        // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Debug logging for location step
        // if (step === 'location') {
        //   console.log('🟡🟡🟡 - [API ROUTE] Location step - Current session data:', JSON.stringify(current, null, 2));
        //   console.log('🟡🟡🟡 - [API ROUTE] Location step - Incoming validated data:', JSON.stringify(validatedData, null, 2));
        //   console.log('🟡🟡🟡 - [API ROUTE] Location step - Current components:', JSON.stringify((current as any)?.components, null, 2));
        // }
        
        let nextValue;
        if (isAutoSave) {
          // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Autosave: merge with existing data
          nextValue = { ...current, ...(validatedData as any) };
        } else if (step === 'location') {
          // 2025-11-08T00:00:00Z ⚠️⚠️⚠️ - [API ROUTE] Location step: preserve delivery-location components when updating from map
          // The map page only sends: latitude, longitude, fullAddress, city, country (from geocoding)
          // We MUST preserve the components object (country, city, sublocality, district, surcharge, selectionSource) from delivery-location
          const existingComponents = (current as any)?.components || {};
          const mapData = validatedData as any;
          
          // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Check if components exist in incoming data (from delivery-location page)
          const incomingComponents = (mapData as any)?.components || {};
          
          // 2025-11-08T00:00:00Z ⚠️⚠️⚠️ - [API ROUTE] Use incoming components if they exist (from delivery-location), otherwise preserve existing
          const finalComponents = Object.keys(incomingComponents).length > 0 ? incomingComponents : existingComponents;
          
          // console.log('🟡🟡🟡 - [API ROUTE] Location step - Component resolution:', {
          //   hasExistingComponents: Object.keys(existingComponents).length > 0,
          //   hasIncomingComponents: Object.keys(incomingComponents).length > 0,
          //   existingComponentsKeys: Object.keys(existingComponents),
          //   incomingComponentsKeys: Object.keys(incomingComponents),
          //   finalComponentsKeys: Object.keys(finalComponents),
          //   finalComponents: finalComponents
          // });
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [LOCATION VALIDATION] Validate coordinates match selected delivery area (only if coordinates are provided)
          if (mapData.latitude && mapData.longitude && !isAutoSave) {
            const lat = Number(mapData.latitude);
            const lng = Number(mapData.longitude);
            const expectedDistrict = finalComponents.district || null;
            const expectedSublocality = finalComponents.sublocality || null;
            
            if (isFinite(lat) && isFinite(lng)) {
              console.log('🟡🟡🟡 - [API ROUTE] Location step - Validating coordinates against selected area', {
                lat,
                lng,
                expectedDistrict,
                expectedSublocality
              });
              
              const validationResult = await validateLocationCoordinates(lat, lng, expectedDistrict, expectedSublocality);
              
              if (!validationResult.valid) {
                console.log('❗❗❗ - [API ROUTE] Location step - Validation failed', validationResult);
                return reply.status(400).send({
                  success: false,
                  message: validationResult.error || 'Location is outside your selected delivery area',
                  errors: { location: validationResult.error || 'Location validation failed' },
                  validationDetails: {
                    expectedDistrict,
                    expectedSublocality,
                    actualDistrict: validationResult.actualDistrict,
                    actualSublocality: validationResult.actualSublocality
                  }
                });
              }
              
              console.log('✅✅✅ - [API ROUTE] Location step - Validation passed', {
                expectedDistrict,
                expectedSublocality,
                actualDistrict: validationResult.actualDistrict,
                actualSublocality: validationResult.actualSublocality
              });
            }
          }
          
          // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Merge: keep components, update coordinates and address from map
          nextValue = {
            ...mapData, // latitude, longitude, fullAddress, city, country from map
            components: finalComponents, // Preserve delivery-location metadata (country, city, sublocality, district, surcharge, selectionSource)
          };
          
          // console.log('✅✅✅ - [API ROUTE] Location update: final merged data', {
          //   hasComponents: !!finalComponents && Object.keys(finalComponents).length > 0,
          //   componentsKeys: Object.keys(finalComponents),
          //   mapUpdates: { latitude: mapData.latitude, longitude: mapData.longitude, fullAddress: mapData.fullAddress },
          //   finalLocationData: JSON.stringify(nextValue, null, 2)
          // });
        } else {
          // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Other steps: replace entirely
          nextValue = validatedData;
        }
        
        (request.session as Record<string, any>)[sessionKey] = nextValue;
        
        // 2025-11-08T00:00:00Z 🟡🟡🟡 - [API ROUTE] Debug: log final session value for location step
        // if (step === 'location') {
        // console.log('🟡🟡🟡 - [API ROUTE] Location step - Final session value:', JSON.stringify(nextValue, null, 2));
        // }
      }

      // 🟡🟡🟡 - [DATABASE SAVE] Save to database for event-details step
      let savedOrder = null;
      if (step === 'event-details' && !isAutoSave) {
        try {
          console.log('🟡🟡🟡 - [DATABASE SAVE] Starting database save for event-details');
          
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [DATABASE SAVE] Get location data from session and build complete location object
          const sessionLocationData = (request.session as any).locationData;
          if (!sessionLocationData) {
            console.log('⚠️⚠️⚠️ - [DATABASE SAVE] No location data found in session');
            return reply.status(400).send({
              success: false,
              message: 'Location data not found. Please select a location first.',
              errors: { location: 'Location data missing' }
            });
          }
          
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [DATABASE SAVE] Build complete location object with all delivery location fields
          const locationData = buildLocationObject(sessionLocationData);
          if (!locationData) {
            console.log('⚠️⚠️⚠️ - [DATABASE SAVE] Failed to build location object from session data');
            return reply.status(400).send({
              success: false,
              message: 'Invalid location data. Please select a location again.',
              errors: { location: 'Invalid location data' }
            });
          }

          // 🟡🟡🟡 - [CUSTOMER CREATION] Create or update customer record with conflict detection
          let customer = null;
          let sanitizedEmail = null;
          
          if (validatedData.phone) {
            console.log('🟡🟡🟡 - [CUSTOMER CREATION] Creating/updating customer with phone:', validatedData.phone);
            
            // 🟡🟡🟡 - [EMAIL SANITIZATION] Sanitize email input
            sanitizedEmail = sanitizeEmail(validatedData.email);
            console.log('🟡🟡🟡 - [CUSTOMER CREATION] Sanitized email:', sanitizedEmail);
            
            // 🟡🟡🟡 - [SAFE CUSTOMER CREATION] Use conflict-aware customer creation
            const customerResult = await createCustomerSafely(
              validatedData.phone,
              validatedData.email,
              validatedData.firstName,
              validatedData.lastName
            );
            
            if (customerResult.success) {
              // Customer created successfully
              console.log('✅✅✅ - [CUSTOMER CREATION] Customer created/updated successfully:', customerResult.customerId);
              
              // Fetch the customer record
              customer = await prisma.customers.findUnique({
                where: { id: customerResult.customerId! }
              });
            } else {
              // Conflict detected, return conflict information to client
              console.log('❗❗❗ - [CUSTOMER CREATION] Conflict detected:', customerResult.message);
              
              return reply.status(409).send({
                success: false,
                message: 'Customer conflict detected',
                conflict: {
                  type: customerResult.conflictType,
                  existingCustomer: customerResult.existingCustomer,
                  message: customerResult.message
                },
                requiresUserConfirmation: true
              });
            }
          } else {
            console.log('🟡🟡🟡 - [CUSTOMER CREATION] No phone provided, creating order without customer link');
            // Still sanitize email for order creation
            sanitizedEmail = sanitizeEmail(validatedData.email);
          }

          // Create order in database
          savedOrder = await prisma.kloiOrdersTable.create({
            data: {
              // Customer info
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              phone: validatedData.phone,
              email: sanitizedEmail,
              
              // Location data as JSONB
              location: locationData,
              
              // Event details as JSONB
              eventDetails: {
                propertyType: validatedData.propertyType,
                buildingName: validatedData.buildingName || null,
                houseNumber: validatedData.houseNumber || null,
                floorNumber: validatedData.floorNumber || null,
                unitNumber: validatedData.unitNumber || null,
                street: validatedData.street || null,
                additionalDirections: validatedData.additionalDirections || null,
              },
              
              // Link to customer if created
              userId: customer?.id || null,
              
              // Session reference
              sessionId: request.session.sessionId,
              
              // Status
              status: OrderStatus.PENDING
            }
          });

          console.log('✅✅✅ - [DATABASE SAVE] Order saved successfully:', savedOrder.id);
          console.log('✅✅✅ - [DATABASE SAVE] Order number:', savedOrder.orderNumber);
          if (customer) {
            console.log('✅✅✅ - [DATABASE SAVE] Order linked to customer:', customer.id);
          }
          
          // Store order ID and customer ID in session for future reference
          (request.session as any).orderId = savedOrder.id;
          (request.session as any).orderNumber = savedOrder.orderNumber;
          (request.session as any).customerId = customer?.id || null;
          
        } catch (dbError) {
          const prismaErr = dbError as any;
          const errorPayload = {
            message: prismaErr?.message,
            code: prismaErr?.code,
            meta: prismaErr?.meta,
            // Avoid logging PII; include only structural hints
            hasValidatedData: !!validatedData,
            hasSessionId: !!request.session?.sessionId,
            dbUrlConfigured: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV
          };
          console.error('❗❗❗ - [DATABASE SAVE] Prisma error details:', JSON.stringify(errorPayload, null, 2));
          console.error('❗❗❗ - [DATABASE SAVE] Failed to save order:', prismaErr);
          return reply.status(500).send({
            success: false,
            message: 'Failed to save order information. Please try again.',
            errors: { database: 'Database save failed' }
          });
        }
      }

      // 🟡🟡🟡 - [DATABASE SAVE] Persist event setup selections and calculator results on normal submit
      if (step === 'event' && !isAutoSave) {
        try {
          console.log('🟡🟡🟡 - [DATABASE SAVE] Starting database save for event step');

          const sessionId = request.session.sessionId;
          if (!sessionId) {
            console.log('⚠️⚠️⚠️ - [DATABASE SAVE] No session ID found');
            return reply.status(400).send({
              success: false,
              message: 'Session not found. Please start from the beginning.',
              errors: { session: 'Session ID missing' }
            });
          }

          // Find existing order by sessionId
          const existingOrder = await prisma.kloiOrdersTable.findFirst({
            where: { sessionId: sessionId }
          });

          const eventSetupPayload = validatedData; // Already validated against eventSetupSchema

          if (existingOrder) {
            console.log('🟡🟡🟡 - [DATABASE SAVE] Found existing order, updating eventSetup:', existingOrder.id);
            await prisma.kloiOrdersTable.update({
              where: { id: existingOrder.id },
              data: {
                eventSetup: eventSetupPayload,
              }
            });
            console.log('✅✅✅ - [DATABASE SAVE] Updated order.eventSetup');
          } else {
            console.log('🟡🟡🟡 - [DATABASE SAVE] No existing order found, creating new order with eventSetup');
            // 2025-11-07T00:00:00Z 🟡🟡🟡 - [DATABASE SAVE] Build complete location object with all delivery location fields
            const sessionLocationData = (request.session as any).locationData || null;
            const locationData = sessionLocationData ? buildLocationObject(sessionLocationData) : null;
            const eventDetails = (request.session as any).eventDetails || null;

            const newOrder = await prisma.kloiOrdersTable.create({
              data: {
                // Optional customer info from prior steps
                firstName: eventDetails?.firstName || null,
                lastName: eventDetails?.lastName || null,
                phone: eventDetails?.phone || null,
                email: eventDetails?.email || null,
                // 2025-11-07T00:00:00Z 🟡🟡🟡 - [DATABASE SAVE] Location object includes all delivery location fields (country, city, sublocality, surcharge)
                location: locationData || undefined,
                eventDetails: eventDetails || undefined,
                // Persist event setup payload
                eventSetup: eventSetupPayload,
                // Session reference and status
                sessionId: sessionId,
                status: OrderStatus.PENDING,
              }
            });
            console.log('✅✅✅ - [DATABASE SAVE] Created new order with eventSetup:', newOrder.id);
            (request.session as any).orderId = newOrder.id;
            (request.session as any).orderNumber = newOrder.orderNumber;
          }
        } catch (dbErr) {
          console.error('❌❌❌ - [DATABASE SAVE] Failed to persist event setup:', dbErr);
          return reply.status(500).send({
            success: false,
            message: 'Failed to save event setup information. Please try again.',
            errors: { database: 'Event setup save failed' }
          });
        }
      }

      // 🟡🟡🟡 - [DATABASE UPDATE] Update database with date/time info for date step
      if (step === 'date') {
        try {
          console.log('🟡🟡🟡 - [DATABASE UPDATE] Starting database update for date step');
          
          // Parse date and time data from validatedData
          const { dates, startTime, endTime, isMultiDay } = validatedData;
          
          // 🟡🟡🟡 - [2025-01-05] Updated to use new eventDateTime JSONB structure
          const eventDateTime = {
            events: dates.map((date: string) => ({
              date: date,
              startTime: startTime,
              endTime: endTime
            })),
            isMultiDay: isMultiDay
          };

          // 🟡🟡🟡 - [UPSERT LOGIC] Use sessionId for accurate upserts to avoid mixups
          const sessionId = request.session.sessionId;
          if (!sessionId) {
            console.log('⚠️⚠️⚠️ - [DATABASE UPDATE] No session ID found');
            return reply.status(400).send({
              success: false,
              message: 'Session not found. Please start from the beginning.',
              errors: { session: 'Session ID missing' }
            });
          }

          // 🟡🟡🟡 - [UPSERT] Find existing order by sessionId and update, or create new one
          const existingOrder = await prisma.kloiOrdersTable.findFirst({
            where: { sessionId: sessionId }
          });

          if (existingOrder) {
            console.log('🟡🟡🟡 - [DATABASE UPDATE] Found existing order, updating:', existingOrder.id);
            
            // Update existing order with date/time information
            await prisma.kloiOrdersTable.update({
              where: { id: existingOrder.id },
              data: {
                eventDateTime: eventDateTime,
                // Store additional date info in eventSetup JSON for backward compatibility
                eventSetup: {
                  dates: dates,
                  startTime: startTime,
                  endTime: endTime,
                  isMultiDay: isMultiDay
                }
              }
            });

            console.log('✅✅✅ - [DATABASE UPDATE] Existing order updated with date/time info');
          } else {
            console.log('🟡🟡🟡 - [DATABASE UPDATE] No existing order found, creating new order with sessionId');
            
            // 2025-11-07T00:00:00Z 🟡🟡🟡 - [DATABASE UPDATE] Get location data and event details from session for new order
            const sessionLocationData = (request.session as any).locationData;
            const eventDetails = (request.session as any).eventDetails;
            
            if (!sessionLocationData || !eventDetails) {
              console.log('⚠️⚠️⚠️ - [DATABASE UPDATE] Missing required session data for new order');
              return reply.status(400).send({
                success: false,
                message: 'Missing required information. Please complete previous steps first.',
                errors: { data: 'Incomplete session data' }
              });
            }
            
            // 2025-11-07T00:00:00Z 🟡🟡🟡 - [DATABASE UPDATE] Build complete location object with all delivery location fields
            const locationData = buildLocationObject(sessionLocationData);
            if (!locationData) {
              console.log('⚠️⚠️⚠️ - [DATABASE UPDATE] Failed to build location object from session data');
              return reply.status(400).send({
                success: false,
                message: 'Invalid location data. Please select a location again.',
                errors: { location: 'Invalid location data' }
              });
            }

            // Create new order with all required data
            const newOrder = await prisma.kloiOrdersTable.create({
              data: {
                // Customer info from event details
                firstName: eventDetails.firstName,
                lastName: eventDetails.lastName,
                phone: eventDetails.phone,
                email: eventDetails.email || null,
                
                // Location data as JSONB
                location: locationData,
                
                // Event details as JSONB
                eventDetails: {
                  propertyType: eventDetails.propertyType,
                  buildingName: eventDetails.buildingName || null,
                  houseNumber: eventDetails.houseNumber || null,
                  floorNumber: eventDetails.floorNumber || null,
                  unitNumber: eventDetails.unitNumber || null,
                  street: eventDetails.street || null,
                  additionalDirections: eventDetails.additionalDirections || null,
                },
                
                // Date/time information
                eventDateTime: eventDateTime,
                eventSetup: {
                  dates: dates,
                  startTime: startTime,
                  endTime: endTime,
                  isMultiDay: isMultiDay
                },
                
                // Session reference
                sessionId: sessionId,
                
                // Status
                status: OrderStatus.PENDING
              }
            });

            console.log('✅✅✅ - [DATABASE UPDATE] New order created with date/time info:', newOrder.id);
            console.log('✅✅✅ - [DATABASE UPDATE] Order number:', newOrder.orderNumber);
            
            // Store order ID in session for future reference
            (request.session as any).orderId = newOrder.id;
            (request.session as any).orderNumber = newOrder.orderNumber;
          }

          console.log('✅✅✅ - [DATABASE UPDATE] Event dates:', dates);
          console.log('✅✅✅ - [DATABASE UPDATE] Start time:', startTime);
          console.log('✅✅✅ - [DATABASE UPDATE] End time:', endTime);
          console.log('✅✅✅ - [DATABASE UPDATE] Event DateTime JSON:', eventDateTime);
          
        } catch (dbError) {
          console.error('❌❌❌ - [DATABASE UPDATE] Failed to update order with date/time:', dbError);
          return reply.status(500).send({
            success: false,
            message: 'Failed to save date and time information. Please try again.',
            errors: { database: 'Database update failed' }
          });
        }
      }

      (request.session as any).lastVisited = new Date().toISOString();
      request.session.touch();
      
      // console.log(`✅✅✅ - [API ROUTE] ${step} data validated and saved to session [${sessionKey}] → ${redirectTo}`);
      // console.log('✅✅✅ - [API ROUTE] Final session state:', JSON.stringify(request.session, null, 2));

      // 🟡🟡🟡 - [SUCCESS RESPONSE] Return success response for AJAX handling
      return reply.send({
        success: true,
        message: 'Data saved successfully',
        nextStep: redirectTo,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      const error = err as Error;
      console.error(`❌❌❌ - [API ROUTE] Error saving ${step} data:`, error);
      console.error('❌❌❌ - [API ROUTE] Stack trace:', error.stack);
      
      return reply.status(500).send({
        success: false,
        message: `Error saving ${step} data. Please try again.`,
        errors: { general: 'Server error occurred' },
        timestamp: new Date().toISOString()
      });
    }
  });

}
