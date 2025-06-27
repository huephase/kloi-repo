// ⚠️⚠️⚠️ IMPORTANT NOTE: THE NEW URL FOR ./customerInfo IS /event-details NOW
// 
// src/routes/customerInfo.ts
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

export default async function eventDetails(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // ⚠️⚠️⚠️ IMPORTANT NOTE: THE NEW URL FOR ./customerInfo IS /event-details NOW
  app.get('/event-details', (request: FastifyRequest, reply: FastifyReply) => {
    // 🟡🟡🟡 Session validation is handled by validateWizardSession preHandler hook
    const theme = (request as any).theme || 'default';
    console.log('🟡🟡🟡 - [EVENT DETAILS] Rendering event details page with theme:', theme);

    // At this point, we know the session is valid (handled by the hook)
    const sessionInfo = request.session ? {
      sessionId: request.session.sessionId?.substring(0, 8),
      wizardStarted: request.session.wizardStarted,
      lastVisited: request.session.lastVisited
    } : {};

    console.log('✅✅✅ - [EVENT DETAILS] Session info:', sessionInfo);
    
    // Get location data from session if it exists
    const locationData = request.session?.locationData as any;
    const location = locationData?.fullAddress || null;
    
    console.log('🟡🟡🟡 - [EVENT DETAILS] Location data from session:', location);

    // Render the event details page with location data
    return reply.view('wizard/event-details', {
      theme,
      location,
      // Add any other template variables needed for the event-details page
    });
  });
}
// ⚠️⚠️⚠️ IMPORTANT NOTE: THE NEW URL FOR ./customerInfo IS /event-details NOW

