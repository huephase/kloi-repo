// src/routes/locationFinder.ts Route for GET/POST /location

import { FastifyInstance, FastifyPluginOptions } from 'fastify';

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
  // NOTE TO FIX: fix properly 'request' is declared but its value is never read.
  app.get('/location', async (request, reply) => {
    // Get theme from request, fallback to 'default'
    const theme = (request as any).theme || 'default';
    // Simple theme color mapping (customize as needed)
    const themeColor = getThemeColor(theme);
    return reply.view('wizard/location-finder.hbs', {
      submitted: false,
      theme,
      themeColor,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'demo-key',
    });
  });

  // POST /location - process form submission and re-render view
  app.post('/location', async (request, reply) => {
    const data = request.body as Record<string, any>;
    const theme = (request as any).theme || 'default';
    const themeColor = getThemeColor(theme);
    console.log('🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡 - [file src/routes/locationFinder.ts]' + {theme});
    return reply.view('wizard/location-finder.hbs', {
      submitted: true,
      formData: data,
      theme,
      themeColor,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'demo-key',
    });
  });
}
