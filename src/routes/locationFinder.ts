// src/routes/locationFinder.ts Route for GET/POST /location

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { generatePageClass } from '../lib/pageClass';

export default async function locationFinder(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/location', (request, reply) => {
    try {
      //🟡🟡🟡 Always set wizardStarted to true to force session creation
      (request.session as any).wizardStarted = true;
      //🟡🟡🟡 Add timestamp to ensure session data changes
      (request.session as any).lastVisited = new Date().toISOString();
      //🟡🟡🟡 Touch the session to ensure it's saved
      request.session.touch();
      console.log('✅✅✅ Session data saved to Redis:', request.session.sessionId?.substring(0, 8));
      console.log('⚪⚪⚪ - [LOCATION FINDER] Session data saved to Redis:', request.session.sessionId?.substring(0, 8));
      console.log('⚪⚪⚪ - [LOCATION FINDER] Updated session state:', JSON.stringify(request.session, null, 2));
    } catch (err) {
      console.error('⚠️⚠️⚠️ Error saving session data to Redis:', err);
    }

    const theme = (request as any).theme || 'default';
    console.log('🟡🟡🟡 - [file src/routes/locationFinder.ts] GET THE THEME:' + theme);

    // 🟡🟡🟡 Generate page class for template
    const templatePath = 'wizard/location-finder';
    const page_class = generatePageClass(templatePath);

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [locationFinder.ts] Read location data from session (set by delivery-locations page)
    const locationData = (request.session as any)?.locationData || null;
    if (locationData) {
      console.log('✅✅✅ - [LOCATION FINDER] Location data found in session:', {
        fullAddress: locationData.fullAddress,
        city: locationData.components?.city || locationData.city,
        district: locationData.components?.district || locationData.district,
        sublocality: locationData.components?.sublocality || locationData.sublocality
      });
    } else {
      console.log('⚠️⚠️⚠️ - [LOCATION FINDER] No location data in session - user should start from delivery-locations page');
      // 🟡🟡🟡 - [LOCATION FINDER] Redirect to delivery-location if no location data exists
      return reply.redirect('/delivery-location');
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [locationFinder.ts] Stringify location data for safe template rendering
    const locationDataJson = locationData ? JSON.stringify(locationData).replace(/</g, '\\u003c') : 'null';

    return reply.view(templatePath, {
      submitted: false,
      theme,
      page_class,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'GOOGLE_MAPS_API_KEY MISSING!',
      googleMapsMapId: process.env.GOOGLE_MAPS_ID || 'GOOGLE_MAPS_ID MISSING!',
      locationDataJson: locationDataJson,
    });
  });
}
