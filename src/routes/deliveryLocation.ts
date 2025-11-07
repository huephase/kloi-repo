// 2025-11-06 🟡🟡🟡 Route for GET /delivery-location
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { generatePageClass } from '../lib/pageClass';
import { getAllDeliveryLocations } from '../services/deliveryLocationsService';

export default async function deliveryLocation(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/delivery-location', async (request, reply) => {
    console.log('🟡🟡🟡 - [deliveryLocation.ts] Rendering delivery locations page');
    const theme = (request as any).theme || 'default';
    const templatePath = 'delivery-locations';
    const page_class = generatePageClass(templatePath);

    try {
      const cities = await getAllDeliveryLocations();
      console.log('✅✅✅ - [deliveryLocation.ts] Locations loaded for city selector:', {
        cities: cities.length,
        sublocalities: cities.reduce((acc, city) => acc + city.combinedSublocalities.length, 0)
      });

      const deliveryDataJson = JSON.stringify(cities).replace(/</g, '\\u003c');

      return reply.view(templatePath, {
        theme,
        page_class,
        cities,
        deliveryDataJson,
        year: new Date().getFullYear(),
      });
    } catch (err) {
      console.error('❗❗❗ - [deliveryLocation.ts] Failed to load locations:', err);
      return reply.view('error', {
        theme,
        page_class,
        message: 'Failed to load delivery locations',
      });
    }
  });
}


