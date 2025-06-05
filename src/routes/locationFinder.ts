// src/routes/locationFinder.ts Route for GET/POST /location

import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function locationFinder(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // GET /location - render the location finder view
  // NOTE TO FIX: fix properly 'request' is declared but its value is never read.
  app.get('/location', async (_request, reply) => {
    return reply.view('wizard/location-finder.hbs', { submitted: false });
  });

  // POST /location - process form submission and re-render view
  app.post('/location', async (request, reply) => {
    const data = request.body as Record<string, any>;
    // TODO: process data as needed
    // For now, just echo back and show submitted = true
    return reply.view('wizard/location-finder.hbs', {
      submitted: true,
      formData: data,
    });
  });
}
