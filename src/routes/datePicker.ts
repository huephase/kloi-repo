// src/routes/datePicker.ts - Route for GET /date-picker

import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { generatePageClass } from '../lib/pageClass';

export default async function datePicker(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/date-picker', (request: FastifyRequest, reply: FastifyReply) => {
    // 🟡🟡🟡 - [DATE PICKER] Session validation is handled by validateWizardSession preHandler hook
    const theme = (request as any).theme || 'default';
    // console.log('🟡🟡🟡 - [DATE PICKER] Rendering date picker page with theme:', theme);

    // At this point, we know the session is valid (handled by the hook)
    const sessionInfo = request.session ? {
      sessionId: request.session.sessionId?.substring(0, 8),
      wizardStarted: request.session.wizardStarted,
      lastVisited: request.session.lastVisited
    } : {};

    console.log('✅✅✅ - [DATE PICKER] Session info:', sessionInfo);
    
    // Get location data from session if it exists
    const locationData = request.session?.locationData as any;
    const location = locationData?.fullAddress || null;
    
    // console.log('🟡🟡🟡 - [DATE PICKER] Location data from session:', location);

    // 🟡🟡🟡 - [FORM DATA] Get existing event details from session if available
    const existingEventDetails = (request.session as any)?.eventDetails;
    const customerInfo = existingEventDetails || {};
    
    // console.log('🟡🟡🟡 - [DATE PICKER] Customer info from session:', customerInfo);
    
    // 🟡🟡🟡 - [ORDER INFO] Get order information from session if available
    const orderId = (request.session as any)?.orderId;
    const orderNumber = (request.session as any)?.orderNumber;
    
    // console.log('🟡🟡🟡 - [DATE PICKER] Order info from session:', { orderId, orderNumber });

    // 🟡🟡🟡 - [DATE INFO] Get existing date selection from session for restoration
    const dateInfo = (request.session as any)?.dateInfo;
    const dateInfoJson = dateInfo ? JSON.stringify(dateInfo) : 'null';
    console.log('🟡🟡🟡 - [DATE PICKER] Date info from session:', dateInfo ? 'found' : 'not found');
    if (dateInfo) {
      console.log('🟡🟡🟡 - [DATE PICKER] Restoring dates:', dateInfo.dates?.length || 0, 'dates');
    }

    // 🟡🟡🟡 Generate page class for template
    const templatePath = 'wizard/date-picker';
    const page_class = generatePageClass(templatePath);

    // Render the date picker page with session data
    return reply.view(templatePath, {
      theme,
      page_class,
      location,
      customerInfo, // 🟡🟡🟡 - [FORM DATA] Pass customer info for context
      orderId, // 🟡🟡🟡 - [ORDER INFO] Pass order ID for reference
      orderNumber, // 🟡🟡🟡 - [ORDER INFO] Pass order number for display
      dateInfo: dateInfo, // 🟡🟡🟡 - [DATE INFO] Pass date info for restoration
      dateInfoJson: dateInfoJson, // 🟡🟡🟡 - [DATE INFO JSON] Pass as JSON string for JavaScript
    });
  });
}
