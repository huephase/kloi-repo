// src/routes/landingPage.ts Handles GET / (landing page) for apex specialtyservices.ae/ only
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function landingPage(app: FastifyInstance, _opts: FastifyPluginOptions) {
  console.log('🟡🟡🟡 - [landingPage] Registering GET /');

  // NOTE TO FIX: fix properly 'request' is declared but its value is never read.
  app.get('/', async (_request, reply) => {
    console.log('🟡🟡🟡 - [landingPage] GET / handler called');
    try {
      const data = { title: 'Welcome to KLOI Wizard' };
      console.log('🟡🟡🟡 - [landingPage] Rendering landing.hbs with:', data);
      return reply.view('landing.hbs', data);
    } catch (err) {
      console.error('❗❗❗ - [landingPage] Error in GET /:', err);
      return reply.status(500).send('Internal Server Error');
    }
  });
}
