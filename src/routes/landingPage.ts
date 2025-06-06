// src/routes/landingPage.ts Handles GET / (landing page) for apex specialtyservices.ae/ only
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

// NOTE TO FIX: fix properly 'app' is declared but its value is never read.
export default async function landingPage(_app: FastifyInstance, _opts: FastifyPluginOptions) {
  console.log('🟡🟡🟡 - [landingPage] Registering GET /');

}
