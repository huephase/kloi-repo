// src/routes/eventSetup.ts
// Route for GET /event-setup - Event setup with menu selection
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { MenuService } from '../services/menuService';
import { prisma } from '../lib/prisma';

// 🟡🟡🟡 - [EVENT SETUP ROUTE] Main route handler for event setup page
export default async function eventSetupRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  
  // 🟡🟡🟡 - [GET EVENT SETUP] Render event setup page with menu form
  app.get('/event-setup', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] GET /event-setup - Rendering event setup page');
    
    try {
      // 🟡🟡🟡 - [SESSION VALIDATION] Ensure session exists and wizard is started
      if (!request.session || !request.session.wizardStarted) {
        console.log('⚠️⚠️⚠️ - [EVENT SETUP ROUTE] No valid session found, redirecting to delivery location');
        // 2025-11-07T00:00:00Z 🟡🟡🟡 - [eventSetup.ts] Redirect to delivery-location (entry point) instead of location-finder
        return reply.redirect('/delivery-location');
      }

      // 🟡🟡🟡 - [THEME DETECTION] Get theme from request
      const theme = (request as any).theme;
      if (!theme) {
        console.log('⚠️⚠️⚠️ - [EVENT SETUP ROUTE] No theme detected, using default');
        // Could set a default theme here if needed
      }

      console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] Theme detected:', theme);

      // 🟡🟡🟡 - [MENU FETCHING] Fetch menu data for the theme
      let menuSections = null;
      if (theme) {
        try {
          menuSections = await MenuService.getThemeMenu(theme);
          console.log('✅✅✅ - [EVENT SETUP ROUTE] Menu sections loaded:', menuSections?.length || 0);
        } catch (menuError) {
          console.error('❗❗❗ - [EVENT SETUP ROUTE] Error loading menu:', menuError);
          // Continue without menu - will show error message in template
        }
      }

      // 🟡🟡🟡 - [SESSION DATA] Get existing session data for form population
      const sessionData = {
        locationData: (request.session as any).locationData,
        eventDetails: (request.session as any).eventDetails,
        dateInfo: (request.session as any).dateInfo,
        eventSetup: (request.session as any).eventSetup
      };

      console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] Session data available:', Object.keys(sessionData).filter(key => (sessionData as any)[key]));

      // 🟡🟡🟡 - [GUEST COUNT] Extract guest count from eventSetup session for calculator visibility
      let guestCount: number | null = null;
      const eventSetup = sessionData.eventSetup as any;
      if (eventSetup) {
        // 🟡🟡🟡 - [GUEST COUNT EXTRACTION] Try productQuantities first
        if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
          const guestCountValue = eventSetup.productQuantities['guest-count'];
          if (typeof guestCountValue === 'number' && guestCountValue > 0) {
            guestCount = guestCountValue;
            console.log('✅✅✅ - [EVENT SETUP ROUTE] Guest count extracted from productQuantities:', guestCount);
          }
        }
        
        // 🟡🟡🟡 - [GUEST COUNT EXTRACTION] Fallback to calculator.guestCount if not found
        if (guestCount === null && eventSetup.calculator && typeof eventSetup.calculator === 'object') {
          const calculatorGuestCount = eventSetup.calculator.guestCount;
          if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
            guestCount = calculatorGuestCount;
            console.log('✅✅✅ - [EVENT SETUP ROUTE] Guest count extracted from calculator:', guestCount);
          }
        }
      }
      
      const hasGuestCount = guestCount !== null && guestCount > 0;
      console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] Guest count available:', hasGuestCount, guestCount);

      // 🟡🟡🟡 - [NUMBER OF DAYS] Calculate number of days from dateInfo.dates array
      let numberOfDays = 1; // 🔵🔵🔵 - [DEFAULT] Default to 1 day if dateInfo not available
      const dateInfo = sessionData.dateInfo as any;
      if (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0) {
        numberOfDays = dateInfo.dates.length;
        console.log('✅✅✅ - [EVENT SETUP ROUTE] Number of days calculated from dateInfo:', numberOfDays);
      } else {
        // 🟡🟡🟡 - [FALLBACK] Try to get from database if not in session
        try {
          const sessionId = request.session.sessionId;
          if (sessionId) {
            const existingOrder = await prisma.kloiOrdersTable.findFirst({
              where: { sessionId: sessionId },
              select: { eventSetup: true }
            });
            if (existingOrder && existingOrder.eventSetup && typeof existingOrder.eventSetup === 'object') {
              const eventSetup = existingOrder.eventSetup as any;
              if (eventSetup.dates && Array.isArray(eventSetup.dates) && eventSetup.dates.length > 0) {
                numberOfDays = eventSetup.dates.length;
                console.log('✅✅✅ - [EVENT SETUP ROUTE] Number of days retrieved from database:', numberOfDays);
              }
            }
          }
        } catch (dbError) {
          console.error('❗❗❗ - [EVENT SETUP ROUTE] Error fetching dates from database:', dbError);
          // Continue with default value
        }
        if (numberOfDays === 1) {
          console.log('⚠️⚠️⚠️ - [EVENT SETUP ROUTE] Using default numberOfDays (1) - dateInfo not available');
        }
      }

      // 🟡🟡🟡 - [TEMPLATE DATA] Prepare data for template
      const templateData = {
        theme: theme,
        menuSections: menuSections,
        menuSectionsJson: menuSections ? JSON.stringify(menuSections) : 'null',
        sessionData: sessionData,
        numberOfDays: numberOfDays,
        hasMenuData: !!menuSections,
        menuError: !menuSections && theme ? 'Unable to load menu data' : null,
        guestCount: guestCount, // 🟡🟡🟡 - [GUEST COUNT] Pass guest count for calculator visibility
        hasGuestCount: hasGuestCount // 🟡🟡🟡 - [GUEST COUNT] Pass boolean flag for calculator visibility
      };

      console.log('✅✅✅ - [EVENT SETUP ROUTE] Rendering event setup page');
      
      // 🟡🟡🟡 - [RENDER TEMPLATE] Render the event setup template
      return reply.view('wizard/event-setup', templateData);
      
    } catch (error) {
      console.error('❌❌❌ - [EVENT SETUP ROUTE] Error rendering event setup page:', error);
      
      // 🟡🟡🟡 - [ERROR HANDLING] Return error page
      return reply.status(500).view('error', {
        error: 'Failed to load event setup page',
        message: 'Please try again or contact support if the problem persists.',
        theme: (request as any).theme
      });
    }
  });
}
