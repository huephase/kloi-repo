// src/routes/locationFinder.ts Route for GET/POST /location

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
// import { updateWizardState } from '../services/wizardStateService';

// Helper: Map theme to color (customize as needed)
function getThemeColor(theme: string): string {
  const colorMap: Record<string, string> = {
    red: '#e53e3e',
    blue: '#3b82f6',
    green: '#10b981',
    default: '#3b82f6',
  };
  return colorMap[theme] || colorMap['default'];
}

export default async function locationFinder(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // GET /location - render the location finder view
  app.get('/location', (request, reply) => {
    // Ensure session data is saved to Redis
    try {
      // Always set wizardStarted to true to force session creation
      request.session.wizardStarted = true;
      // Add timestamp to ensure session data changes
      request.session.lastVisited = new Date().toISOString();
      
      // Touch the session to ensure it's saved
      request.session.touch();
      
      console.log('✅ Session data saved to Redis:', request.session.sessionId?.substring(0, 8));
    } catch (err) {
      console.error('⚠️⚠️⚠️ Error saving session data to Redis:', err);
    }
    // Get theme from request, fallback to 'default'
    const theme = (request as any).theme || 'default';
    // Simple theme color mapping (customize as needed)
    const themeColor = getThemeColor(theme);
    // console.log('🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡 - [file src/routes/locationFinder.ts] GET:' + theme);
    return reply.view('wizard/location-finder', {
      submitted: false,
      theme,
      themeColor,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'GOOGLE_MAPS_API_KEY MISSING!',
      googleMapsMapId: process.env.GOOGLE_MAPS_ID || 'GOOGLE_MAPS_ID MISSING!',
    });
  });

  // POST /api/session/location is now handled by the API router (src/routes/api/index.ts)
  // Only the GET /location handler remains here.
}
