// src/routes/api/index.ts
// Aggregates API routes. All POST routes are handled here.
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function apiRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // POST /api/session/location - Save location to Redis and redirect to customer info
  app.post('/session/location', (request, reply) => {
    // Debug logs to diagnose session/cookie issues
    console.log('🔴🔴🔴 Incoming POST /api/session/location');
    
    // Check if session exists
    if (!request.session || !request.session.sessionId) {
      console.log('🔴🔴🔴 Session not found! Returning 400.');
      return reply.status(400).send('Session not found');
    }
    
    console.log('🔴🔴🔴 Session found:', request.session.sessionId.substring(0, 8), '...');
    
    try {
      // Extract location data from request body
      const { placeId, fullAddress, city, country, latitude, longitude } = request.body as Record<string, any>;
      
      // Store location data in session
      request.session.locationData = {
        placeId,
        fullAddress,
        city,
        country,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
      
      // Update timestamp
      request.session.lastVisited = new Date().toISOString();
      
      // Touch the session to ensure it's saved
      request.session.touch();
      
      console.log('✅✅✅ Location data saved to session in Redis');
      
      // Redirect to next step
      return reply.redirect('/customer-info');  
    } catch (err) {
      console.error('🔴🔴🔴 Error saving location data to session:', err);
      return reply.status(500).send('Error saving location data');
    }
  });
  // Register other API endpoints here
}

