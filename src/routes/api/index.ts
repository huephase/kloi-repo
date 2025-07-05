// src/routes/api/index.ts
// Aggregates API routes. All POST routes are handled here.
import { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';
import { WizardStepConfig } from '../../types';
import { prisma } from '../../lib/prisma';
import { eventDetailsSchema, locationDataSchema } from '../../schemas/wizard.schemas';
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
    
    default:
      // For other steps, return data as-is (no validation)
      console.log('🟡🟡🟡 - [VALIDATION] No specific validation for step:', step);
      return data;
  }
}

export default async function apiRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  
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
          status: 'pending'
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
              
              // Session reference
              sessionId: request.session.sessionId,
              
              // Status
              status: 'pending'
            }
          });

          console.log('✅✅✅ - [DATABASE SAVE] Order saved successfully:', savedOrder.id);
          console.log('✅✅✅ - [DATABASE SAVE] Order number:', savedOrder.orderNumber);
          
          // Store order ID in session for future reference
          (request.session as any).orderId = savedOrder.id;
          (request.session as any).orderNumber = savedOrder.orderNumber;
          
        } catch (dbError) {
          console.error('❌❌❌ - [DATABASE SAVE] Failed to save order:', dbError);
          return reply.status(500).send({
            success: false,
            message: 'Failed to save order information. Please try again.',
            errors: { database: 'Database save failed' }
          });
        }
      }

      (request.session as any).lastVisited = new Date().toISOString();
      request.session.touch();
      
      console.log(`✅✅✅ - [API ROUTE] ${step} data validated and saved to session [${sessionKey}] → ${redirectTo}`);
      console.log('✅✅✅ - [API ROUTE] Final session state:', JSON.stringify(request.session, null, 2));

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
