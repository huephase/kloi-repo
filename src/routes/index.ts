// src/routes/index.ts Main router to aggregate all other route modules Aggregates all route modules
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import landingPage from './landingPage';

import locationFinder from './locationFinder';

export default async function routes(_app: FastifyInstance, _opts: FastifyPluginOptions) {
  // console.log('🟡🟡🟡 - [routes/index] Registering all route modules');
  await _app.register(landingPage);
  await _app.register(locationFinder);
  // Register other route modules here
}

