// src/routes/index.ts Main router to aggregate all other route modules Aggregates all route modules
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import landingPage from './landingPage';

import locationFinderRoutes from './locationFinder';
import customerInfoRoutes from './customerInfo';
import apiRoutes from './api';

export default async function routes(_app: FastifyInstance, _opts: FastifyPluginOptions) {
  // console.log('🟡🟡🟡 - [routes/index] Registering all route modules');
  await _app.register(landingPage);
  await _app.register(locationFinderRoutes);
  await _app.register(customerInfoRoutes);
  // Register API router with prefix '/api' for all API endpoints
  await _app.register(apiRoutes, { prefix: '/api' });
  // Register other route modules here
}

