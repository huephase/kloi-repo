// src/routes/index.ts Main router to aggregate all other route modules
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import landingPage from './landingPage';

import locationFinderRoutes from './locationFinder';
import deliveryLocationRoutes from './deliveryLocation';
// ⚠️⚠️⚠️ IMPORTANT NOTE: THE NEW URL FOR ./customerInfo IS /event-details NOW
import customerInfoRoutes from './customerInfo';
import datePickerRoutes from './datePicker';
import eventSetupRoutes from './eventSetup';
import eventSummaryRoutes from './eventSummary';
// healthCheckRoutes removed - now registered directly in app.ts to avoid session validation hooks
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
  await _app.register(deliveryLocationRoutes);
  
  // 👍👍👍👍👍👍 - 2024-12-28 - Health check dashboard now registered directly in app.ts to avoid session validation hooks
  
  // 🟡🟡🟡 Protected wizard routes (session validation applied via preHandler hook above)
  console.log('🟡🟡🟡 - [routes/index] Registering protected wizard routes');
  await _app.register(customerInfoRoutes);
  await _app.register(datePickerRoutes);
  await _app.register(eventSetupRoutes);
  await _app.register(eventSummaryRoutes);
  
  // Register API router with prefix '/api' for all API endpoints
  await _app.register(apiRoutes, { prefix: '/api' });
  
  // 🟡🟡🟡 TODO: Register other wizard route modules here when implemented
  // await _app.register(finalConfirmationRoutes);
  // await _app.register(checkoutRoutes);
  
  console.log('✅✅✅ - [routes/index] All route modules registered with session protection');
  console.log('✅✅✅ - [routes/index] Health check dashboard available at /kloiserverhealthcheck');
}

