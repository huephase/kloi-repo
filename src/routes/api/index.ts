// src/routes/api/index.ts
// Aggregates API routes. All POST routes are handled here.
import { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';
import { WizardStepConfig, OrderStatus, ORDER_STATUS_GROUPS } from '../../types/index';
import { prisma } from '../../lib/prisma';
import { eventDetailsSchema, locationDataSchema, dateSelectionSchema, eventSetupSchema } from '../../schemas/wizard.schemas';
import { ZodError } from 'zod';

// Maps wizard steps to session keys and redirect targets
// The step parameter will be the wizard step, for eg. "location"
// The data will be stored in the session under the key "locationData"
// redirectTo: means the user will be redirected to next wizard, eg for "location" it will be /customer-info
const stepConfig: Record<string, WizardStepConfig> = {
  location: { sessionKey: 'locationData', redirectTo: '/event-details' },
  // ⚠️⚠️⚠️ IMPORTANT NOTE: customerInfo IS eventDetails NOW
  customer: { sessionKey: 'eventDetails', redirectTo: '/date-picker' },
  'event-details': { sessionKey: 'eventDetails', redirectTo: '/date-picker' }, // 🟡🟡🟡 - [NEW ROUTE] Support direct event-details endpoint
  date: { sessionKey: 'dateInfo', redirectTo: '/event-setup' },
  event: { sessionKey: 'eventSetup', redirectTo: '/event-summary' },
  summary: { sessionKey: 'finalReview', redirectTo: '/checkout' }, // optional, for review screen
};

// 🟡🟡🟡 - [VALIDATION] Function to format validation errors for client
function formatValidationErrors(error: ZodError) {
  console.log('❗❗❗ - [VALIDATION] Formatting validation errors:', error.errors);
  
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const field = err.path.join('.');
    errors[field] = err.message;
    console.log(`❗❗❗ - [VALIDATION] Field "${field}": ${err.message}`);
  });
  
  return errors;
}

// 🟡🟡🟡 - [VALIDATION] Function to validate data based on step
function validateStepData(step: string, data: any) {
  console.log('🟡🟡🟡 - [VALIDATION] Validating data for step:', step);
  console.log('🟡🟡🟡 - [VALIDATION] Data to validate:', JSON.stringify(data, null, 2));
  
  switch (step) {
    case 'location':
      return locationDataSchema.parse(data);
    
    case 'customer':
    case 'event-details':
      return eventDetailsSchema.parse(data);
    
    case 'date':
      return dateSelectionSchema.parse(data);
    
    case 'event':
      return eventSetupSchema.parse(data);
    
    default:
      // For other steps, return data as-is (no validation)
      console.log('🟡🟡🟡 - [VALIDATION] No specific validation for step:', step);
      return data;
  }
}

export default async function apiRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  
  // 👍👍👍👍👍👍 - 2024-12-28 - SERVER TIME API ENDPOINT
  // This endpoint provides reliable server time to avoid dependency on user device time
  app.get('/server-time', async (_request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [API ROUTE] GET /api/server-time - Providing server time');
    
    try {
      const serverTime = new Date();
      const serverTimeISO = serverTime.toISOString();
      const serverTimeLocal = serverTime.toLocaleString();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log('✅✅✅ - [API ROUTE] Server time provided:', serverTimeISO);
      
      return reply.send({
        success: true,
        serverTime: serverTimeISO,
        serverTimeLocal: serverTimeLocal,
        timezone: timezone,
        timestamp: serverTime.getTime(), // Unix timestamp
        message: 'Server time retrieved successfully'
      });
      
    } catch (error) {
      console.error('❗❗❗ - [API ROUTE] Error getting server time:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get server time',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🟡🟡🟡 - [BOOKED DATES API] Retrieve booked dates from database for date picker calendar
  app.get('/booked-dates', async (_request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [API ROUTE] GET /api/booked-dates - Retrieving booked dates from database');
    
    try {
      // 🟡🟡🟡 - [DATABASE QUERY] Get all orders with eventDateTime data
      const ordersWithDates = await prisma.kloiOrdersTable.findMany({
        where: {
          eventDateTime: {
            not: null as any
          },
          // 🟡🟡🟡 - [FILTER] Only include orders that are bookable (not cancelled or completed)
          status: {
            in: [...ORDER_STATUS_GROUPS.BOOKABLE]
          }
        },
        select: {
          id: true,
          orderNumber: true,
          eventDateTime: true,
          status: true
        }
      });

      console.log('🟡🟡🟡 - [BOOKED DATES] Found orders with dates:', ordersWithDates.length);

      // 🟡🟡🟡 - [DATA PROCESSING] Extract all booked dates from eventDateTime JSONB
      const bookedDates: string[] = [];
      const bookedDatesWithDetails: Array<{
        date: string;
        startTime: string;
        endTime: string;
        orderNumber: number;
        status: string;
      }> = [];

      ordersWithDates.forEach(order => {
        const eventDateTime = order.eventDateTime as any;
        
        if (eventDateTime && eventDateTime.events && Array.isArray(eventDateTime.events)) {
          eventDateTime.events.forEach((event: any) => {
            if (event.date) {
              bookedDates.push(event.date);
              bookedDatesWithDetails.push({
                date: event.date,
                startTime: event.startTime || '00:00',
                endTime: event.endTime || '23:59',
                orderNumber: order.orderNumber,
                status: order.status
              });
            }
          });
        }
      });

      // 🟡🟡🟡 - [DEDUPLICATION] Remove duplicate dates (multiple orders on same date)
      const uniqueBookedDates = [...new Set(bookedDates)];
      
      console.log('✅✅✅ - [BOOKED DATES] Unique booked dates found:', uniqueBookedDates.length);
      console.log('🟡🟡🟡 - [BOOKED DATES] Sample booked dates:', uniqueBookedDates.slice(0, 5));

      return reply.send({
        success: true,
        bookedDates: uniqueBookedDates,
        bookedDatesWithDetails: bookedDatesWithDetails,
        totalBookedDates: uniqueBookedDates.length,
        message: 'Booked dates retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❗❗❗ - [API ROUTE] Error retrieving booked dates:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to retrieve booked dates',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 🔍🔍🔍 DATABASE CONNECTION TEST ROUTE
  // 🟤🟤🟤 src/routes/api/index.ts:23:30 - error TS6133: 'request' is declared but its value is never read.
  app.get('/db-test', async (_request, reply: FastifyReply) => {
    console.log('🔍🔍🔍 - [API ROUTE] GET /api/db-test - Testing database connection');
    console.log('🔍🔍🔍 - [API ROUTE] DATABASE_URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    
    try {
      // Test basic database connection
      const startTime = Date.now();
      await prisma.$connect();
      const connectionTime = Date.now() - startTime;
      
      // Test a simple query to verify the connection works
      const testQuery = await prisma.$queryRaw`SELECT version() as db_version, now() as current_time`;
      const queryTime = Date.now() - startTime;
      
      // Get database info
      const customerCount = await prisma.customers.count();
      const sessionCount = await prisma.session.count();
      const orderCount = await prisma.kloiOrdersTable.count();
      const menuCount = await prisma.menus.count();
      
      console.log('✅✅✅ - [API ROUTE] Database connection successful');
      console.log('✅✅✅ - [API ROUTE] Connection time:', connectionTime, 'ms');
      console.log('✅✅✅ - [API ROUTE] Query time:', queryTime, 'ms');
      
      return reply.send({
        success: true,
        message: 'Database connection successful',
        data: {
          databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
          connectionTime: `${connectionTime}ms`,
          queryTime: `${queryTime}ms`,
          databaseInfo: testQuery,
          tableInfo: {
            customers: customerCount,
            sessions: sessionCount,
            orders: orderCount,
            menus: menuCount
          },
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('🔴🔴🔴 - [API ROUTE] Database connection failed:', error);
      console.error('🔴🔴🔴 - [API ROUTE] DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      
      return reply.status(500).send({
        success: false,
        message: 'Database connection failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof Error && 'code' in error ? error.code : 'UNKNOWN',
          databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      // Ensure we disconnect to avoid connection leaks
      await prisma.$disconnect();
    }
  });

  // 🟡🟡🟡 - [DEBUG ENDPOINT] View menu data for debugging
  app.get('/debug-menu/:theme', async (request, reply: FastifyReply) => {
    const theme = (request.params as any).theme;
    console.log('🟡🟡🟡 - [DEBUG ENDPOINT] Viewing menu for theme:', theme);
    
    try {
      const menu = await prisma.menus.findFirst({
        where: { theme: theme }
      });

      if (!menu) {
        return reply.send({
          success: false,
          message: `No menu found for theme: ${theme}`
        });
      }

      return reply.send({
        success: true,
        data: {
          id: menu.id,
          name: menu.name,
          theme: menu.theme,
          menuItems: menu.menuItems
        }
      });

    } catch (error) {
      console.error('❗❗❗ - [DEBUG ENDPOINT] Error viewing menu:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to view menu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🟡🟡🟡 - [TEST ENDPOINT] Test endpoint to create sample menu
  app.post('/test-menu', async (_request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [TEST ENDPOINT] Creating test menu');
    
    try {
      const testMenu = await prisma.menus.create({
        data: {
          name: 'Test Matcha Menu',
          theme: 'red',
          menuItems: {
            "section1": {
              "order": 1,
              "html-type": "h1",
              "content": "Matcha Menu"
            },
            "section2": {
              "order": 2,
              "html-type": "p",
              "content": "Finest Matcha Selections"
            },
            "section3": {
              "order": 3,
              "html-type": "image",
              "src": "/public/menus/red/section-3.jpg",
              "alt": "Fresh matcha preparation",
              "caption": "Freshly prepared matcha with premium ingredients"
            },
            "section4": {
              "order": 4,
              "html-type": "h2",
              "content": "Please select your Matcha menu"
            },
            "section5": {
              "order": 5,
              "html-type": "radio-group",
              "content": {
                "radio1": {
                  "label": "Matcha Ice Cream Only",
                  "description": "Full matcha ice cream selections",
                  "price": 50.00,
                  "price-basis": "Per guest",
                  "popup": {
                    "section1": {
                      "html-type": "image",
                      "src": "/public/menus/red/popup-radio-1.jpg",
                      "alt": "Matcha ice cream",
                      "caption": "Premium matcha ice cream selection"
                    },
                    "section2": {
                      "html-type": "p",
                      "content": "Matcha[a] (抹茶) /ˈmætʃə, ˈmɑːtʃə/ is a finely ground powder of green tea specially processed from shade-grown tea leaves."
                    },
                    "section3": {
                      "html-type": "unordered-list",
                      "content": [
                        "100% Organic", "Ceremonial Grade", "Direct from Japan"
                      ]
                    }
                  }
                },
                "radio2": {
                  "label": "Matcha and Specialty Drinks",
                  "description": "Full matcha ice cream & drinks selections",
                  "price": 75.00,
                  "price-basis": "Per guest"
                },
                "radio3": {
                  "label": "Specialty Drinks Only",
                  "description": "Matcha Drinks",
                  "price": 42.00,
                  "price-basis": "Per guest"
                }
              }
            },
            "section6": {
              "order": 6,
              "html-type": "product-group",
              "content": {
                "seasonal-offer": {
                  "label": "Seasonal Ice Cream",
                  "price": 17.00,
                  "price-basis": "Per guest"
                },
                "zero-sugar": {
                  "label": "Zero Sugar Ice Cream",
                  "price": 9.00,
                  "price-basis": "Per guest"
                }
              }
            },
            "section7": {
              "order": 7,
              "html-type": "h2",
              "content": "Select your upgrades below"
            },
            "section8": {
              "order": 8,
              "html-type": "checkbox-group",
              "content": {
                "checkbox1": {
                  "label": "Matcha Upgrade",
                  "price": 23.00,
                  "price-basis": "Per guest"
                },
                "checkbox2": {
                  "label": "Kids Menu",
                  "price": 15.00,
                  "price-basis": "Per guest"
                },
                "checkbox3": {
                  "label": "Non-Dairy options",
                  "price": 2.00,
                  "price-basis": "Per guest"
                },
                "checkbox4": {
                  "label": "Live DJ",
                  "price": 1500.00,
                  "price-basis": "Per day"
                }
              }
            }
          }
        }
      });

      console.log('✅✅✅ - [TEST ENDPOINT] Test menu created:', testMenu.id);

      return reply.send({
        success: true,
        message: 'Test menu created successfully',
        data: {
          id: testMenu.id,
          name: testMenu.name,
          theme: testMenu.theme
        }
      });

    } catch (error) {
      console.error('❌❌❌ - [TEST ENDPOINT] Failed to create test menu:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to create test menu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🟡🟡🟡 - [TEST ENDPOINT] Test endpoint to create sample order
  app.post('/test-order', async (_request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [TEST ENDPOINT] Creating test order');
    
    try {
      const testOrder = await prisma.kloiOrdersTable.create({
        data: {
          firstName: 'Test',
          lastName: 'User',
          phone: '+971501234567',
          email: 'test@example.com',
          location: {
            fullAddress: 'Test Address, Dubai, UAE',
            city: 'Dubai',
            country: 'UAE',
            latitude: 25.2048,
            longitude: 55.2708
          },
          eventDetails: {
            propertyType: 'APARTMENT',
            buildingName: 'Test Building',
            floorNumber: '5',
            unitNumber: '502',
            street: 'Test Street',
            additionalDirections: 'Test directions'
          },
          // 🟡🟡🟡 - [2025-01-05] Updated to use new eventDateTime JSONB structure
          eventDateTime: {
            events: [
              {
                date: '2025-01-10',
                startTime: '09:00',
                endTime: '17:00'
              }
            ],
            isMultiDay: false
          },
          status: OrderStatus.PENDING
        }
      });

      console.log('✅✅✅ - [TEST ENDPOINT] Test order created:', testOrder.id);
      console.log('✅✅✅ - [TEST ENDPOINT] Order number:', testOrder.orderNumber);

      return reply.send({
        success: true,
        message: 'Test order created successfully',
        data: {
          id: testOrder.id,
          orderNumber: testOrder.orderNumber,
          createdAt: testOrder.createdAt
        }
      });

    } catch (error) {
      console.error('❌❌❌ - [TEST ENDPOINT] Failed to create test order:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to create test order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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
      return reply.status(400).send({
        success: false,
        message: `Invalid wizard step: ${step}`,
        errors: { step: 'Invalid wizard step' }
      });
    }

    if (!request.session || !request.session.sessionId) {
      console.log('⚠️⚠️⚠️ - [API ROUTE] No session found');
      return reply.status(401).send({
        success: false,
        message: 'Session not found. Please start from the beginning.',
        errors: { session: 'Session not found' }
      });
    }

    try {
      const { sessionKey, redirectTo } = stepConfig[step];
      console.log(`🟡🟡🟡 - [API ROUTE] Using config: sessionKey=${sessionKey}, redirectTo=${redirectTo}`);

      // 🟡🟡🟡 - [VALIDATION] Validate the request data based on the step
      let validatedData;
      try {
        validatedData = validateStepData(step, request.body);
        console.log('✅✅✅ - [VALIDATION] Data validation successful for step:', step);
        console.log('✅✅✅ - [VALIDATION] Validated data:', JSON.stringify(validatedData, null, 2));
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          console.log('❗❗❗ - [VALIDATION] Validation failed for step:', step);
          console.log('❗❗❗ - [VALIDATION] Validation errors:', validationError.errors);
          
          const formattedErrors = formatValidationErrors(validationError);
          
          // 🟡🟡🟡 - [VALIDATION ERROR RESPONSE] Return validation errors to display in form
          return reply.status(400).send({
            success: false,
            message: 'Please correct the errors below and try again.',
            errors: formattedErrors,
            timestamp: new Date().toISOString()
          });
        } else {
          // Handle unexpected validation errors
          console.error('❌❌❌ - [VALIDATION] Unexpected validation error:', validationError);
          return reply.status(500).send({
            success: false,
            message: 'An unexpected error occurred during validation.',
            errors: { general: 'Validation error' }
          });
        }
      }

      // Store the validated data under the corresponding session key
      if (sessionKey) {
        const beforeUpdate = { ...request.session };
        console.log('🟡🟡🟡 - [API ROUTE] Session BEFORE update:', JSON.stringify(beforeUpdate, null, 2));
        
        // Use type assertion to safely assign dynamic properties
        (request.session as Record<string, any>)[sessionKey] = validatedData;
        
        console.log(`🟡🟡🟡 - [API ROUTE] Setting session[${sessionKey}] =`, JSON.stringify(validatedData, null, 2));
        console.log('🟡🟡🟡 - [API ROUTE] Session AFTER update:', JSON.stringify(request.session, null, 2));
      }

      // 🟡🟡🟡 - [DATABASE SAVE] Save to database for event-details step
      let savedOrder = null;
      if (step === 'event-details') {
        try {
          console.log('🟡🟡🟡 - [DATABASE SAVE] Starting database save for event-details');
          
          // Get location data from session
          const locationData = (request.session as any).locationData;
          if (!locationData) {
            console.log('⚠️⚠️⚠️ - [DATABASE SAVE] No location data found in session');
            return reply.status(400).send({
              success: false,
              message: 'Location data not found. Please select a location first.',
              errors: { location: 'Location data missing' }
            });
          }

          // 🟡🟡🟡 - [CUSTOMER CREATION] Create or update customer record
          let customer = null;
          if (validatedData.phone) {
            console.log('🟡🟡🟡 - [CUSTOMER CREATION] Creating/updating customer with phone:', validatedData.phone);
            
            // Try to find existing customer by phone
            customer = await prisma.customers.findUnique({
              where: { phone: validatedData.phone }
            });

            if (customer) {
              console.log('✅✅✅ - [CUSTOMER CREATION] Existing customer found, updating:', customer.id);
              // Update existing customer with new information
              customer = await prisma.customers.update({
                where: { id: customer.id },
                data: {
                  firstName: validatedData.firstName,
                  lastName: validatedData.lastName,
                  email: validatedData.email || null,
                }
              });
            } else {
              console.log('🟡🟡🟡 - [CUSTOMER CREATION] No existing customer found, creating new customer');
              // Create new customer
              customer = await prisma.customers.create({
                data: {
                  phone: validatedData.phone,
                  firstName: validatedData.firstName,
                  lastName: validatedData.lastName,
                  email: validatedData.email || null,
                }
              });
            }
            
            console.log('✅✅✅ - [CUSTOMER CREATION] Customer saved successfully:', customer.id);
          } else {
            console.log('🟡🟡🟡 - [CUSTOMER CREATION] No phone provided, creating order without customer link');
          }

          // Create order in database
          savedOrder = await prisma.kloiOrdersTable.create({
            data: {
              // Customer info
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              phone: validatedData.phone,
              email: validatedData.email || null,
              
              // Location data as JSONB
              location: locationData,
              
              // Event details as JSONB
              eventDetails: {
                propertyType: validatedData.propertyType,
                buildingName: validatedData.buildingName || null,
                houseNumber: validatedData.houseNumber || null,
                floorNumber: validatedData.floorNumber || null,
                unitNumber: validatedData.unitNumber || null,
                street: validatedData.street || null,
                additionalDirections: validatedData.additionalDirections || null,
              },
              
              // Link to customer if created
              userId: customer?.id || null,
              
              // Session reference
              sessionId: request.session.sessionId,
              
              // Status
              status: OrderStatus.PENDING
            }
          });

          console.log('✅✅✅ - [DATABASE SAVE] Order saved successfully:', savedOrder.id);
          console.log('✅✅✅ - [DATABASE SAVE] Order number:', savedOrder.orderNumber);
          if (customer) {
            console.log('✅✅✅ - [DATABASE SAVE] Order linked to customer:', customer.id);
          }
          
          // Store order ID and customer ID in session for future reference
          (request.session as any).orderId = savedOrder.id;
          (request.session as any).orderNumber = savedOrder.orderNumber;
          (request.session as any).customerId = customer?.id || null;
          
        } catch (dbError) {
          const prismaErr = dbError as any;
          const errorPayload = {
            message: prismaErr?.message,
            code: prismaErr?.code,
            meta: prismaErr?.meta,
            // Avoid logging PII; include only structural hints
            hasValidatedData: !!validatedData,
            hasSessionId: !!request.session?.sessionId,
            dbUrlConfigured: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV
          };
          console.error('❗❗❗ - [DATABASE SAVE] Prisma error details:', JSON.stringify(errorPayload, null, 2));
          console.error('❗❗❗ - [DATABASE SAVE] Failed to save order:', prismaErr);
          return reply.status(500).send({
            success: false,
            message: 'Failed to save order information. Please try again.',
            errors: { database: 'Database save failed' }
          });
        }
      }

      // 🟡🟡🟡 - [DATABASE UPDATE] Update database with date/time info for date step
      if (step === 'date') {
        try {
          console.log('🟡🟡🟡 - [DATABASE UPDATE] Starting database update for date step');
          
          // Parse date and time data from validatedData
          const { dates, startTime, endTime, isMultiDay } = validatedData;
          
          // 🟡🟡🟡 - [2025-01-05] Updated to use new eventDateTime JSONB structure
          const eventDateTime = {
            events: dates.map((date: string) => ({
              date: date,
              startTime: startTime,
              endTime: endTime
            })),
            isMultiDay: isMultiDay
          };

          // 🟡🟡🟡 - [UPSERT LOGIC] Use sessionId for accurate upserts to avoid mixups
          const sessionId = request.session.sessionId;
          if (!sessionId) {
            console.log('⚠️⚠️⚠️ - [DATABASE UPDATE] No session ID found');
            return reply.status(400).send({
              success: false,
              message: 'Session not found. Please start from the beginning.',
              errors: { session: 'Session ID missing' }
            });
          }

          // 🟡🟡🟡 - [UPSERT] Find existing order by sessionId and update, or create new one
          const existingOrder = await prisma.kloiOrdersTable.findFirst({
            where: { sessionId: sessionId }
          });

          if (existingOrder) {
            console.log('🟡🟡🟡 - [DATABASE UPDATE] Found existing order, updating:', existingOrder.id);
            
            // Update existing order with date/time information
            await prisma.kloiOrdersTable.update({
              where: { id: existingOrder.id },
              data: {
                eventDateTime: eventDateTime,
                // Store additional date info in eventSetup JSON for backward compatibility
                eventSetup: {
                  dates: dates,
                  startTime: startTime,
                  endTime: endTime,
                  isMultiDay: isMultiDay
                }
              }
            });

            console.log('✅✅✅ - [DATABASE UPDATE] Existing order updated with date/time info');
          } else {
            console.log('🟡🟡🟡 - [DATABASE UPDATE] No existing order found, creating new order with sessionId');
            
            // Get location data and event details from session for new order
            const locationData = (request.session as any).locationData;
            const eventDetails = (request.session as any).eventDetails;
            
            if (!locationData || !eventDetails) {
              console.log('⚠️⚠️⚠️ - [DATABASE UPDATE] Missing required session data for new order');
              return reply.status(400).send({
                success: false,
                message: 'Missing required information. Please complete previous steps first.',
                errors: { data: 'Incomplete session data' }
              });
            }

            // Create new order with all required data
            const newOrder = await prisma.kloiOrdersTable.create({
              data: {
                // Customer info from event details
                firstName: eventDetails.firstName,
                lastName: eventDetails.lastName,
                phone: eventDetails.phone,
                email: eventDetails.email || null,
                
                // Location data as JSONB
                location: locationData,
                
                // Event details as JSONB
                eventDetails: {
                  propertyType: eventDetails.propertyType,
                  buildingName: eventDetails.buildingName || null,
                  houseNumber: eventDetails.houseNumber || null,
                  floorNumber: eventDetails.floorNumber || null,
                  unitNumber: eventDetails.unitNumber || null,
                  street: eventDetails.street || null,
                  additionalDirections: eventDetails.additionalDirections || null,
                },
                
                // Date/time information
                eventDateTime: eventDateTime,
                eventSetup: {
                  dates: dates,
                  startTime: startTime,
                  endTime: endTime,
                  isMultiDay: isMultiDay
                },
                
                // Session reference
                sessionId: sessionId,
                
                // Status
                status: OrderStatus.PENDING
              }
            });

            console.log('✅✅✅ - [DATABASE UPDATE] New order created with date/time info:', newOrder.id);
            console.log('✅✅✅ - [DATABASE UPDATE] Order number:', newOrder.orderNumber);
            
            // Store order ID in session for future reference
            (request.session as any).orderId = newOrder.id;
            (request.session as any).orderNumber = newOrder.orderNumber;
          }

          console.log('✅✅✅ - [DATABASE UPDATE] Event dates:', dates);
          console.log('✅✅✅ - [DATABASE UPDATE] Start time:', startTime);
          console.log('✅✅✅ - [DATABASE UPDATE] End time:', endTime);
          console.log('✅✅✅ - [DATABASE UPDATE] Event DateTime JSON:', eventDateTime);
          
        } catch (dbError) {
          console.error('❌❌❌ - [DATABASE UPDATE] Failed to update order with date/time:', dbError);
          return reply.status(500).send({
            success: false,
            message: 'Failed to save date and time information. Please try again.',
            errors: { database: 'Database update failed' }
          });
        }
      }

      (request.session as any).lastVisited = new Date().toISOString();
      request.session.touch();
      
      // console.log(`✅✅✅ - [API ROUTE] ${step} data validated and saved to session [${sessionKey}] → ${redirectTo}`);
      // console.log('✅✅✅ - [API ROUTE] Final session state:', JSON.stringify(request.session, null, 2));

      // 🟡🟡🟡 - [SUCCESS RESPONSE] Return success response for AJAX handling
      return reply.send({
        success: true,
        message: 'Data saved successfully',
        nextStep: redirectTo,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      const error = err as Error;
      console.error(`❌❌❌ - [API ROUTE] Error saving ${step} data:`, error);
      console.error('❌❌❌ - [API ROUTE] Stack trace:', error.stack);
      
      return reply.status(500).send({
        success: false,
        message: `Error saving ${step} data. Please try again.`,
        errors: { general: 'Server error occurred' },
        timestamp: new Date().toISOString()
      });
    }
  });
}
