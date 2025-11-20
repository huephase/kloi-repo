// src/routes/eventSummary.ts
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { generatePageClass } from '../lib/pageClass';

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

      // ⚪⚪⚪ - 2025-11-04T00:00:00Z - Read session-stored values for each step
      const sessionAny = (request.session as any) || {};
      const locationData = sessionAny.locationData || null;
      const eventDetails = sessionAny.eventDetails || null; // used by 'customer' and 'event-details'
      const dateInfo = sessionAny.dateInfo || null;
      const eventSetup = sessionAny.eventSetup || null;

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
            if (data.radioSelections && typeof data.radioSelections === 'object') {
              const radioItems = Object.entries(data.radioSelections).map(([key, val]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(val))}</li>`).join('');
              if (radioItems) items.push(`<dt>Menu Selections</dt><dd><ul class="selection-list">${radioItems}</ul></dd>`);
            }
            if (data.checkboxSelections && typeof data.checkboxSelections === 'object') {
              const checkboxItems = Object.entries(data.checkboxSelections).map(([key, val]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(val))}</li>`).join('');
              if (checkboxItems) items.push(`<dt>Upgrades</dt><dd><ul class="selection-list">${checkboxItems}</ul></dd>`);
            }
            if (data.productQuantities && typeof data.productQuantities === 'object') {
              const quantityItems = Object.entries(data.productQuantities).map(([key, val]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(val))}</li>`).join('');
              if (quantityItems) items.push(`<dt>Product Quantities</dt><dd><ul class="selection-list">${quantityItems}</ul></dd>`);
            }
            // 🟡🟡🟡 - Fallback: display all other fields generically
            Object.entries(data).forEach(([key, val]) => {
              if (!['radioSelections', 'checkboxSelections', 'productQuantities'].includes(key) && val !== null && val !== undefined) {
                items.push(`<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(val))}</dd>`);
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

          return items.length > 0 ? `<dl class="data-display">${items.join('')}</dl>` : '<p class="data-empty">No data captured yet.</p>';
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
