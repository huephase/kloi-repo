import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { customerInfoSchema } from '../schemas/wizard.schemas';
import { getWizardState, updateWizardState } from '../services/wizardStateService';

export default async function customerInfoRoutes(fastify: FastifyInstance) {
  // Use the session cookie name from .env (SESSION_COOKIE_NAME), default is 'kloi_sessionId'
  const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'kloi_sessionId';

  fastify.get('/customer-info', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.cookies[sessionCookieName];
    if (!sessionId) {
      return reply.status(400).send('Session not found');
    }
    let wizardState = await getWizardState(sessionId);
    const customerInfo = wizardState?.customerInfo || {};
    const location = wizardState?.location;
    return reply.view('wizard/customer-info.hbs', {
      customerInfo,
      location,
      errors: null,
    });
  });

  //POST: Validates input using customerInfoSchema. If valid, updates wizard state and redirects to /date-picker.
  // If invalid, re-renders the form with error messages and previous input.
  fastify.post('/customer-info', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.cookies[sessionCookieName];
    if (!sessionId) {
    // FE: GUARD CLAUSE Handle missing session (e.g., redirect, show error, or return 400)
      return reply.status(400).send('Session not found');
    }
    let wizardState = await getWizardState(sessionId);
    const body = request.body as any;
    const parseResult = customerInfoSchema.safeParse(body);
    if (!parseResult.success) {
      // Prepare error messages
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach(issue => {
        errors[issue.path[0]] = issue.message;
      });
      return reply.view('wizard/customer-info.hbs', {
        customerInfo: body,
        location: wizardState?.location,
        errors,
      });
    }
    // Valid: update wizard state
    await updateWizardState(sessionId, { customerInfo: parseResult.data });
    return reply.redirect('/date-picker');
  });
}

