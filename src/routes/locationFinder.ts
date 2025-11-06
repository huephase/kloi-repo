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

    const q = (request as any).query || {};
    const prefillDistrict = q.district || null;
    const prefillSublocality = q.sublocality || null;
    console.log('🟡🟡🟡 - [LOCATION FINDER] Prefill params:', { prefillDistrict, prefillSublocality });

    return reply.view(templatePath, {
      submitted: false,
      theme,
      page_class,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'GOOGLE_MAPS_API_KEY MISSING!',
      googleMapsMapId: process.env.GOOGLE_MAPS_ID || 'GOOGLE_MAPS_ID MISSING!',
      prefillDistrict,
      prefillSublocality,
    });
  });
}
