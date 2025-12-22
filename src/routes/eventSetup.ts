// src/routes/eventSetup.ts
// Route for GET /event-setup - Event setup with menu selection
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { MenuService } from '../services/menuService';
import { TaxesFeesService, TaxFee } from '../services/taxesFeesService';
import { prisma } from '../lib/prisma';
import { extractGuestCountFromSession, calculateNumberOfDaysFromDateInfo } from '../lib/utils';

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

      // 🟡🟡🟡 - [GUEST COUNT] Extract guest count from session using centralized utility
      // 2025-12-20T00:00:00Z 🟡🟡🟡 - [DRY REFACTOR] Using extractGuestCountFromSession() instead of duplicated logic
      const guestCount = extractGuestCountFromSession(sessionData);
      const hasGuestCount = guestCount !== null && guestCount > 0;
      console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] Guest count available:', hasGuestCount, guestCount);

      // 🟡🟡🟡 - [NUMBER OF DAYS] Calculate number of days from dateInfo using centralized utility
      // ⚠️⚠️⚠️ - [DATE INFO VALIDATION] Dates are REQUIRED for accurate calculator pricing
      // 2025-12-20T00:00:00Z 🟡🟡🟡 - [DRY REFACTOR] Using calculateNumberOfDaysFromDateInfo() instead of duplicated logic
      const dateInfo = sessionData.dateInfo as any;
      let numberOfDays = calculateNumberOfDaysFromDateInfo(dateInfo);
      let hasDateInfo = numberOfDays > 1 || (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0);
      
      // 🟡🟡🟡 - [FALLBACK] Try to get from database if not in session
      if (!hasDateInfo) {
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
                hasDateInfo = true; // 🟡🟡🟡 - [DATE INFO FLAG] Valid dates found in database
                console.log('✅✅✅ - [EVENT SETUP ROUTE] Number of days retrieved from database:', numberOfDays);
              }
            }
          }
        } catch (dbError) {
          console.error('❗❗❗ - [EVENT SETUP ROUTE] Error fetching dates from database:', dbError);
          // Continue with default value
        }
        if (!hasDateInfo) {
          console.log('⚠️⚠️⚠️ - [EVENT SETUP ROUTE] Using default numberOfDays (1) - dateInfo not available');
        }
      }
      
      console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] Date info available:', hasDateInfo, 'numberOfDays:', numberOfDays);

      // 🟡🟡🟡 - [CALCULATOR READINESS] Calculator requires BOTH guest count AND dates for accurate pricing
      const canShowCalculator = hasGuestCount && hasDateInfo;
      console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] Calculator can be shown:', canShowCalculator, '(guestCount:', hasGuestCount, ', dates:', hasDateInfo, ')');

      // 🟡🟡🟡 - [TAXES FEES] Load taxes and fees based on country code from location data
      let taxesFees: TaxFee[] = [];
      try {
        const locationData = sessionData.locationData;
        if (locationData) {
          const countryCode = TaxesFeesService.getCountryCodeFromLocation(locationData);
          taxesFees = await TaxesFeesService.getTaxesFeesByCountry(countryCode);
          console.log('✅✅✅ - [EVENT SETUP ROUTE] Loaded', taxesFees.length, 'taxes/fees for country:', countryCode);
        } else {
          console.log('⚠️⚠️⚠️ - [EVENT SETUP ROUTE] No location data available, skipping taxes/fees loading');
        }
      } catch (taxesFeesError) {
        console.error('❗❗❗ - [EVENT SETUP ROUTE] Error loading taxes/fees:', taxesFeesError);
        // Continue without taxes/fees - calculator will work normally
      }

      // 🟡🟡🟡 - [TEMPLATE DATA] Prepare data for template
      const eventSetup = sessionData.eventSetup as any;
      const templateData = {
        theme: theme,
        menuSections: menuSections,
        menuSectionsJson: menuSections ? JSON.stringify(menuSections) : 'null',
        sessionData: sessionData,
        eventSetupJson: eventSetup ? JSON.stringify(eventSetup) : 'null', // 🟡🟡🟡 - [FORM PRE-FILL] Pass eventSetup JSON for form pre-filling
        numberOfDays: numberOfDays,
        hasMenuData: !!menuSections,
        menuError: !menuSections && theme ? 'Unable to load menu data' : null,
        guestCount: guestCount, // 🟡🟡🟡 - [GUEST COUNT] Pass guest count for calculator visibility
        hasGuestCount: hasGuestCount, // 🟡🟡🟡 - [GUEST COUNT] Pass boolean flag for calculator visibility
        hasDateInfo: hasDateInfo, // 🟡🟡🟡 - [DATE INFO] Pass boolean flag indicating dates are available
        canShowCalculator: canShowCalculator, // 🟡🟡🟡 - [CALCULATOR READINESS] Both guest count AND dates required
        taxesFees: taxesFees, // 🟡🟡🟡 - [TAXES FEES] Pass taxes/fees array for calculator
        taxesFeesJson: JSON.stringify(taxesFees) // 🟡🟡🟡 - [TAXES FEES] Pass taxes/fees JSON for calculator initialization
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
