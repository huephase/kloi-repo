// src/routes/eventSummary.ts
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { generatePageClass } from '../lib/pageClass';
import { MenuService } from '../services/menuService';
import { TaxesFeesService, TaxFee } from '../services/taxesFeesService';
import { extractGuestCountFromSession, calculateNumberOfDaysFromDateInfo } from '../lib/utils';

export default async function eventSummaryRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // 👍👍👍👍👍👍 - 2025-11-04 - EVENT SUMMARY PAGE ROUTE (Root path)
  // 2025-11-04T00:00:00Z - Renders a simple HTML summary page of the wizard selections
  // 2025-11-04T00:00:00Z - Sections: location, customer, event-details, date, event
  app.get('/event-summary', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ROUTE] GET /event-summary - Rendering event summary page');

    try {
      // 🟡🟡🟡 - [THEME] Detect theme from request (set by middleware)
      const theme = (request as any).theme || 'default';
      const templatePath = 'wizard/event-summary';
      const page_class = generatePageClass(templatePath);
      console.log('🟡🟡🟡 - [ROUTE] Theme for event-summary:', theme);

      // 🟡🟡🟡 - [MENU FETCHING] Fetch menu data for the theme (needed for calculator)
      let menuSections = null;
      if (theme) {
        try {
          menuSections = await MenuService.getThemeMenu(theme);
          console.log('✅✅✅ - [EVENT SUMMARY ROUTE] Menu sections loaded:', menuSections?.length || 0);
        } catch (menuError) {
          console.error('❗❗❗ - [EVENT SUMMARY ROUTE] Error loading menu:', menuError);
          // Continue without menu - calculator won't initialize but page will still render
        }
      }

      // ⚪⚪⚪ - 2025-11-04T00:00:00Z - Read session-stored values for each step
      const sessionAny = (request.session as any) || {};
      const locationData = sessionAny.locationData || null;
      const eventDetails = sessionAny.eventDetails || null; // used by 'customer' and 'event-details'
      const dateInfo = sessionAny.dateInfo || null;
      const eventSetup = sessionAny.eventSetup || null;
      
      // 🟡🟡🟡 - [CALCULATOR DATA] Extract data needed for calculator initialization using centralized utilities
      // 2025-12-20T00:00:00Z 🟡🟡🟡 - [DRY REFACTOR] Using extractGuestCountFromSession() and calculateNumberOfDaysFromDateInfo() instead of duplicated logic
      const sessionData = { eventSetup, dateInfo };
      const guestCount = extractGuestCountFromSession(sessionData);
      const numberOfDays = calculateNumberOfDaysFromDateInfo(dateInfo);
      
      const canShowCalculator = guestCount !== null && guestCount > 0 && numberOfDays > 0 && menuSections !== null;
      console.log('🟡🟡🟡 - [EVENT SUMMARY ROUTE] Calculator can be shown:', canShowCalculator, { guestCount, numberOfDays, hasMenu: !!menuSections });

      // 🟡🟡🟡 - [TAXES FEES] Load taxes and fees based on country code from location data
      let taxesFees: TaxFee[] = [];
      try {
        if (locationData) {
          const countryCode = TaxesFeesService.getCountryCodeFromLocation(locationData);
          taxesFees = await TaxesFeesService.getTaxesFeesByCountry(countryCode);
          console.log('✅✅✅ - [EVENT SUMMARY ROUTE] Loaded', taxesFees.length, 'taxes/fees for country:', countryCode);
        } else {
          console.log('⚠️⚠️⚠️ - [EVENT SUMMARY ROUTE] No location data available, skipping taxes/fees loading');
        }
      } catch (taxesFeesError) {
        console.error('❗❗❗ - [EVENT SUMMARY ROUTE] Error loading taxes/fees:', taxesFeesError);
        // Continue without taxes/fees - calculator will work normally
      }

      console.log('⚪⚪⚪ - [EVENT SUMMARY] Session ID:', request.session?.sessionId?.substring(0, 8));
      console.log('⚪⚪⚪ - [EVENT SUMMARY] Keys present:', {
        hasLocation: !!locationData,
        hasEventDetails: !!eventDetails,
        hasDateInfo: !!dateInfo,
        hasEventSetup: !!eventSetup
      });

      // 🔵🔵🔵 - 2025-11-04T00:00:00Z - Helper to render JSON data as semantic HTML
      function renderDataAsHTML(data: any, sectionName: string): string {
        try {
          if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return '<p class="data-empty">No data captured yet.</p>';
          }

          const items: string[] = [];
          
          // 🟡🟡🟡 - Handle different data structures based on section
          if (sectionName === 'location' && data.fullAddress) {
            items.push(`<dt>Delivery Address</dt><dd>${escapeHtml(data.fullAddress)}</dd>`);
            // 🟡🟡🟡 - [2025-11-07T00:00:00Z] Display area (sublocality) from session cookie if available
            if (data.components && data.components.sublocality) {
              items.push(`<dt>Area</dt><dd>${escapeHtml(data.components.sublocality)}</dd>`);
            }
            if (data.city) items.push(`<dt>City</dt><dd>${escapeHtml(data.city)}</dd>`);
            if (data.country) items.push(`<dt>Country</dt><dd>${escapeHtml(data.country)}</dd>`);
            if (data.latitude && data.longitude) {
              items.push(`<dt>Coordinates</dt><dd>${escapeHtml(data.latitude)}, ${escapeHtml(data.longitude)}</dd>`);
            }
          } else if (sectionName === 'customer' || sectionName === 'event-details') {
            if (data.firstName) items.push(`<dt>First Name</dt><dd>${escapeHtml(data.firstName)}</dd>`);
            if (data.lastName) items.push(`<dt>Last Name</dt><dd>${escapeHtml(data.lastName)}</dd>`);
            if (data.phone) items.push(`<dt>Phone</dt><dd>${escapeHtml(data.phone)}</dd>`);
            if (data.email) items.push(`<dt>Email</dt><dd>${escapeHtml(data.email)}</dd>`);
            if (data.propertyType) items.push(`<dt>Property Type</dt><dd>${escapeHtml(data.propertyType)}</dd>`);
            if (data.buildingName) items.push(`<dt>Building Name</dt><dd>${escapeHtml(data.buildingName)}</dd>`);
            if (data.houseNumber) items.push(`<dt>House Number</dt><dd>${escapeHtml(data.houseNumber)}</dd>`);
            if (data.floorNumber) items.push(`<dt>Floor</dt><dd>${escapeHtml(data.floorNumber)}</dd>`);
            if (data.unitNumber) items.push(`<dt>Unit</dt><dd>${escapeHtml(data.unitNumber)}</dd>`);
            if (data.street) items.push(`<dt>Street</dt><dd>${escapeHtml(data.street)}</dd>`);
            if (data.additionalDirections) items.push(`<dt>Additional Directions</dt><dd>${escapeHtml(data.additionalDirections)}</dd>`);
          } else if (sectionName === 'date' && data.dates) {
            items.push(`<dt>Selected Dates</dt><dd><ul class="date-list">${(Array.isArray(data.dates) ? data.dates : []).map((d: string) => `<li>${escapeHtml(d)}</li>`).join('')}</ul></dd>`);
            if (data.startTime) items.push(`<dt>Start Time</dt><dd>${escapeHtml(data.startTime)}</dd>`);
            if (data.endTime) items.push(`<dt>End Time</dt><dd>${escapeHtml(data.endTime)}</dd>`);
            if (data.isMultiDay !== undefined) items.push(`<dt>Multi-Day Event</dt><dd>${data.isMultiDay ? 'Yes' : 'No'}</dd>`);
          } else if (sectionName === 'event-setup') {
            // 🟡🟡🟡 - [GUEST COUNT] Display guest count prominently if available
            let guestCountDisplayed = false;
            if (data.productQuantities && typeof data.productQuantities === 'object') {
              const guestCount = data.productQuantities['guest-count'];
              if (typeof guestCount === 'number' && guestCount > 0) {
                items.push(`<dt>Guest Count</dt><dd>${escapeHtml(String(guestCount))}</dd>`);
                guestCountDisplayed = true;
              }
            }
            // 🟡🟡🟡 - [GUEST COUNT FALLBACK] Try calculator.guestCount if not in productQuantities
            if (!guestCountDisplayed && data.calculator && typeof data.calculator === 'object') {
              const calculatorGuestCount = data.calculator.guestCount;
              if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
                items.push(`<dt>Guest Count</dt><dd>${escapeHtml(String(calculatorGuestCount))}</dd>`);
                guestCountDisplayed = true;
              }
            }
            
            // 🟡🟡🟡 - [RADIO SELECTIONS] Display radio selections with user-friendly labels
            if (data.radioSelections && typeof data.radioSelections === 'object') {
              // 🟡🟡🟡 - [DISPLAY LABELS] Use radioSelectionsDisplay for friendly labels, fallback to raw keys
              const radioItems = Object.entries(data.radioSelections).map(([groupId, optionKey]) => {
                let displayLabel = String(optionKey);
                // 🟡🟡🟡 - [FRIENDLY LABEL] Try to get friendly label from radioSelectionsDisplay
                if (data.radioSelectionsDisplay && typeof data.radioSelectionsDisplay === 'object' && data.radioSelectionsDisplay[groupId]) {
                  displayLabel = data.radioSelectionsDisplay[groupId];
                }
                return `<li><strong>${escapeHtml(displayLabel)}</strong></li>`;
              }).join('');
              if (radioItems) items.push(`<dt>Menu Selections</dt><dd><ul class="selection-list">${radioItems}</ul></dd>`);
            }
            
            // 🟡🟡🟡 - [CHECKBOX SELECTIONS] Display checkbox selections with user-friendly labels
            if (data.checkboxSelections && typeof data.checkboxSelections === 'object') {
              // 🟡🟡🟡 - [DISPLAY LABELS] Use checkboxSelectionsDisplay for friendly labels, fallback to raw keys
              const checkboxItems = Object.entries(data.checkboxSelections).map(([optionKey]) => {
                let displayLabel = String(optionKey);
                // 🟡🟡🟡 - [FRIENDLY LABEL] Try to get friendly label from checkboxSelectionsDisplay
                if (data.checkboxSelectionsDisplay && typeof data.checkboxSelectionsDisplay === 'object' && data.checkboxSelectionsDisplay[optionKey]) {
                  displayLabel = data.checkboxSelectionsDisplay[optionKey];
                }
                return `<li><strong>${escapeHtml(displayLabel)}</strong></li>`;
              }).join('');
              if (checkboxItems) items.push(`<dt>Upgrades</dt><dd><ul class="selection-list">${checkboxItems}</ul></dd>`);
            }
            
            // 🟡🟡🟡 - [PRODUCT QUANTITIES] Display product quantities with user-friendly labels
            if (data.productQuantities && typeof data.productQuantities === 'object') {
              // 🟡🟡🟡 - [DISPLAY LABELS] Use productLabels for friendly labels, fallback to raw keys
              const quantityItems = Object.entries(data.productQuantities)
                .filter(([key]) => key !== 'guest-count') // Exclude guest-count as it's displayed separately
                .map(([productKey, qty]) => {
                  let displayLabel = String(productKey);
                  // 🟡🟡🟡 - [FRIENDLY LABEL] Try to get friendly label from productLabels
                  if (data.productLabels && typeof data.productLabels === 'object' && data.productLabels[productKey]) {
                    displayLabel = data.productLabels[productKey];
                  }
                  return `<li><strong>${escapeHtml(displayLabel)}:</strong> ${escapeHtml(String(qty))}</li>`;
                })
                .join('');
              if (quantityItems) items.push(`<dt>Extras</dt><dd><ul class="selection-list">${quantityItems}</ul></dd>`);
            }
            // 🟡🟡🟡 - [CALCULATOR TOTALS] Skip displaying subtotal/total here - live calculator shows them
            // ⚠️⚠️⚠️ - [CALCULATOR TOTALS] Subtotal and Total are displayed in the live calculator section below
            if (data.calculator && typeof data.calculator === 'object' && data.calculator.totals) {
              const totals = data.calculator.totals;
              // 🟡🟡🟡 - [MINIMUM ORDER DISPLAY] Only show minimum order if subtotal < minimumOrderTotal
              // ⚠️⚠️⚠️ - [MINIMUM ORDER LOGIC] When minimum is met, do NOT display minimum order requirement
              if (totals.minimumOrderTotal !== undefined && totals.minimumOrderTotal > 0) {
                const subtotal = totals.subtotal || 0;
                if (subtotal < totals.minimumOrderTotal) {
                items.push(`<dt>Minimum Order</dt><dd>AED ${escapeHtml(String(totals.minimumOrderTotal.toFixed(2)))}</dd>`);
                }
              }
            }
            // 🟡🟡🟡 - [FALLBACK] Display other fields generically, excluding already handled fields
            // ⚠️⚠️⚠️ - [EXCLUDE DISPLAY LABELS] Exclude display label fields as they're only used for rendering, not for display
            const excludedKeys = ['radioSelections', 'checkboxSelections', 'productQuantities', 'calculator', 'radioSelectionsDisplay', 'checkboxSelectionsDisplay', 'productLabels'];
            Object.entries(data).forEach(([key, val]) => {
              if (!excludedKeys.includes(key) && val !== null && val !== undefined) {
                if (typeof val === 'object' && !Array.isArray(val)) {
                  items.push(`<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(JSON.stringify(val, null, 2))}</dd>`);
                } else {
                  items.push(`<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(val))}</dd>`);
                }
              }
            });
          } else {
            // 🟡🟡🟡 - Generic fallback for any other structure
            Object.entries(data).forEach(([key, val]) => {
              if (val !== null && val !== undefined) {
                if (Array.isArray(val)) {
                  items.push(`<dt>${escapeHtml(key)}</dt><dd><ul class="selection-list">${val.map((v: any) => `<li>${escapeHtml(String(v))}</li>`).join('')}</ul></dd>`);
                } else if (typeof val === 'object') {
                  items.push(`<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(JSON.stringify(val, null, 2))}</dd>`);
                } else {
                  items.push(`<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(val))}</dd>`);
                }
              }
            });
          }

          return items.length > 0 ? `<dl class="data-display setup-summary">${items.join('')}</dl>` : '<p class="data-empty">No data captured yet.</p>';
        } catch (err) {
          console.error('❗❗❗ - [RENDER DATA] Error rendering data for section:', sectionName, err);
          return '<p class="data-empty">Error displaying data.</p>';
        }
      }

      // 🔵🔵🔵 - 2025-11-04T00:00:00Z - HTML escape helper (handles any type)
      function escapeHtml(value: any): string {
        if (value === null || value === undefined) {
          return '';
        }
        const text = String(value);
        const map: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
      }

      // 🟡🟡🟡 - Map step names to their edit destinations (UI routes) and step identifiers for save
      const editConfig: Record<string, { url: string; step: string }> = {
        location: { url: '/location', step: 'location' },
        customer: { url: '/event-details', step: 'event-details' },
        'event-details': { url: '/event-details', step: 'event-details' },
        date: { url: '/date-picker', step: 'date' },
        event: { url: '/event-setup', step: 'event' }
      };

      // 🟡🟡🟡 - Render Handlebars view to inherit global styles and theme
      return reply.view(templatePath, {
        theme,
        page_class,
        locationData,
        eventDetails,
        dateInfo,
        eventSetup,
        eventSetupJson: eventSetup ? JSON.stringify(eventSetup) : 'null', // 🟡🟡🟡 - [CALCULATOR] JSON string for JavaScript state restoration
        menuSections: menuSections, // 🟡🟡🟡 - [CALCULATOR] Menu sections for calculator initialization
        menuSectionsJson: menuSections ? JSON.stringify(menuSections) : 'null', // 🟡🟡🟡 - [CALCULATOR] JSON string for JavaScript
        guestCount: guestCount, // 🟡🟡🟡 - [CALCULATOR] Guest count for calculator
        numberOfDays: numberOfDays, // 🟡🟡🟡 - [CALCULATOR] Number of days for calculator
        canShowCalculator: canShowCalculator, // 🟡🟡🟡 - [CALCULATOR] Flag indicating calculator can be shown
        taxesFees: taxesFees, // 🟡🟡🟡 - [TAXES FEES] Pass taxes/fees array for calculator
        taxesFeesJson: JSON.stringify(taxesFees), // 🟡🟡🟡 - [TAXES FEES] Pass taxes/fees JSON for calculator initialization
        renderLocation: renderDataAsHTML(locationData, 'location'),
        renderCustomer: renderDataAsHTML(eventDetails, 'customer'),
        renderEventDetails: renderDataAsHTML(eventDetails, 'event-details'),
        renderDate: renderDataAsHTML(dateInfo, 'date'),
        renderEventSetup: renderDataAsHTML(eventSetup, 'event-setup'),
        editConfig
      });
    } catch (error) {
      console.error('❗❗❗ - [ROUTE] Error rendering event summary:', error);
      console.error('❗❗❗ - [ROUTE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❗❗❗ - [ROUTE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        sessionId: request.session?.sessionId?.substring(0, 8)
      });
      return reply.status(500).send(`Failed to render event summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

// Route for GET/POST /event-summary
