// src/routes/eventSetup.ts
// Route for GET /event-setup - Event setup with menu selection
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { MenuService } from '../services/menuService';

// 🟡🟡🟡 - [EVENT SETUP ROUTE] Main route handler for event setup page
export default async function eventSetupRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  
  // 🟡🟡🟡 - [GET EVENT SETUP] Render event setup page with menu form
  app.get('/event-setup', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [EVENT SETUP ROUTE] GET /event-setup - Rendering event setup page');
    
    try {
      // 🟡🟡🟡 - [SESSION VALIDATION] Ensure session exists and wizard is started
      if (!request.session || !request.session.wizardStarted) {
        console.log('⚠️⚠️⚠️ - [EVENT SETUP ROUTE] No valid session found, redirecting to location finder');
        return reply.redirect('/location-finder');
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

      // 🟡🟡🟡 - [TEMPLATE DATA] Prepare data for template
      const templateData = {
        theme: theme,
        menuSections: menuSections,
        menuSectionsJson: menuSections ? JSON.stringify(menuSections) : 'null',
        sessionData: sessionData,
        hasMenuData: !!menuSections,
        menuError: !menuSections && theme ? 'Unable to load menu data' : null
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
