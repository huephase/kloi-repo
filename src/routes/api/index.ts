// src/routes/api/index.ts
// Aggregates API routes. All POST routes are handled here.
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { updateWizardState } from '../../services/wizardStateService';

export default async function apiRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // POST /api/session/location - Save location to Redis and redirect to customer info
  app.post('/session/location', async (request, reply) => {
    // Debug logs to diagnose session/cookie issues
    console.log('🔴🔴🔴 Incoming POST /api/session/location');
    console.log('🔴🔴🔴 --------REQUEST HEADERS:', request.headers);
    console.log('🔴🔴🔴 --------REQUEST COOKIES:', request.cookies);
    const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'kloi_sessionId';
    console.log('🔴🔴🔴 Using sessionCookieName:', sessionCookieName);
    const sessionId = request.cookies[sessionCookieName];
    console.log('🔴🔴🔴 Extracted sessionId:', sessionId);
    if (!sessionId) {
      console.log('🔴🔴🔴 Session ID missing! Returning 400.');
      return reply.status(400).send('Session not found');
    }
    console.log('🔴🔴🔴 Session ID present, proceeding to update wizard state.');
    const { placeId, fullAddress, city, country, latitude, longitude } = request.body as Record<string, any>;
    await updateWizardState(sessionId, {
      location: {
        placeId,
        fullAddress,
        city,
        country,
        latitude,
        longitude,
      },
    });
    return reply.redirect('/customer-info');
  });
  // Register other API endpoints here
}

