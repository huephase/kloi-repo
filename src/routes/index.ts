// src/routes/index.ts Main router to aggregate all other route modules
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import landingPage from './landingPage';

import locationFinderRoutes from './locationFinder';
// ⚠️⚠️⚠️ IMPORTANT NOTE: THE NEW URL FOR ./customerInfo IS /event-details NOW
import customerInfoRoutes from './customerInfo';
import apiRoutes from './api';
// 🟡🟡🟡 Import session validation hooks
import { validateWizardSession } from '../hooks/sessionHooks';

export default async function routes(_app: FastifyInstance, _opts: FastifyPluginOptions) {
  console.log('🟡🟡🟡 - [routes/index] Registering all route modules with session protection');
  
  // 🟡🟡🟡 Register session validation hook as preHandler for wizard routes
  console.log('🟡🟡🟡 - [routes/index] Registering wizard session validation hook');
  _app.addHook('preHandler', validateWizardSession);
  
  // Register routes - landingPage and locationFinder are NOT protected (entry points)
  await _app.register(landingPage);
  await _app.register(locationFinderRoutes);
  
  // 🟡🟡🟡 Protected wizard routes (session validation applied via preHandler hook above)
  console.log('🟡🟡🟡 - [routes/index] Registering protected wizard routes');
  await _app.register(customerInfoRoutes);
  
  // Register API router with prefix '/api' for all API endpoints
  await _app.register(apiRoutes, { prefix: '/api' });
  
  // 🟡🟡🟡 TODO: Register other wizard route modules here when implemented
  // await _app.register(datePickerRoutes);
  // await _app.register(eventSetupRoutes);
  // await _app.register(eventSummaryRoutes);
  // await _app.register(finalConfirmationRoutes);
  // await _app.register(checkoutRoutes);
  
  console.log('✅✅✅ - [routes/index] All route modules registered with session protection');
}

