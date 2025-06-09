// src/routes/api/index.ts
// Aggregates API routes. All POST routes are handled here.
import { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';
import { WizardStepConfig } from '../../types';

// Maps wizard steps to session keys and redirect targets
// The step parameter will be the wizard step, for eg. "location"
// The data will be stored in the session under the key "locationData"
// redirectTo: means the user will be redirected to next wizard, eg for "location" it will be /customer-info
const stepConfig: Record<string, WizardStepConfig> = {
  location: { sessionKey: 'locationData', redirectTo: '/customer-info' },
  customer: { sessionKey: 'customerInfo', redirectTo: '/date-picker' },
  date: { sessionKey: 'dateInfo', redirectTo: '/event-setup' },
  event: { sessionKey: 'eventSetup', redirectTo: '/event-summary' },
  summary: { sessionKey: 'finalReview', redirectTo: '/checkout' }, // optional, for review screen
};

export default async function apiRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.post<{
    Params: { step: string };
  }>('/session/:step', async (request, reply: FastifyReply) => {
    const step = request.params.step;
    
    console.log('⚪⚪⚪ - [API ROUTE] POST /session/:step called with step:', step);
    console.log('⚪⚪⚪ - [API ROUTE] Request body:', JSON.stringify(request.body, null, 2));
    console.log('⚪⚪⚪ - [API ROUTE] Session ID:', request.session?.sessionId);
    console.log('⚪⚪⚪ - [API ROUTE] Current session data:', JSON.stringify(request.session, null, 2));
    
    // Validate step is supported
    if (!step || !stepConfig[step]) {
      console.warn(`⚠️⚠️⚠️ - [API ROUTE] Unknown wizard step: ${step}`);
      return reply.status(400).send('Invalid wizard step');
    }

    if (!request.session || !request.session.sessionId) {
      console.log('⚠️⚠️⚠️ - [API ROUTE] No session found');
      return reply.status(400).send('Session not found');
    }

    try {
      const { sessionKey, redirectTo } = stepConfig[step];
      console.log(`🟡🟡🟡 - [API ROUTE] Using config: sessionKey=${sessionKey}, redirectTo=${redirectTo}`);

      // Store the request body under the corresponding session key
      if (sessionKey) {
        const beforeUpdate = { ...request.session };
        console.log('🟡🟡🟡 - [API ROUTE] Session BEFORE update:', JSON.stringify(beforeUpdate, null, 2));
        
        // Use type assertion to safely assign dynamic properties
        (request.session as Record<string, any>)[sessionKey] = request.body;
        
        console.log(`🟡🟡🟡 - [API ROUTE] Setting session[${sessionKey}] =`, JSON.stringify(request.body, null, 2));
        console.log('🟡🟡🟡 - [API ROUTE] Session AFTER update:', JSON.stringify(request.session, null, 2));
      }

      request.session.lastVisited = new Date().toISOString();
      request.session.touch();
      
      console.log(`🟡🟡🟡 - [API ROUTE] ${step} data saved to session [${sessionKey}] → ${redirectTo}`);
      console.log('🟡🟡🟡 - [API ROUTE] Final session state:', JSON.stringify(request.session, null, 2));

      return reply.redirect(redirectTo);
    } catch (err) {
      const error = err as Error;
      console.error(`⚠️⚠️⚠️ - [API ROUTE] Error saving ${step} data:`, error);
      console.error('🔴🔴🔴 - [API ROUTE] Stack trace:', error.stack);
      return reply.status(500).send(`Error saving ${step} data`);
    }
  });
}
