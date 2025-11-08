// src/hooks/sessionHooks.ts
// Session validation hooks for wizard flow protection
import { FastifyRequest, FastifyReply } from 'fastify';

console.log('🟡🟡🟡 - [SESSION HOOKS] Loading session validation hooks');

/**
 * 🟡🟡🟡 Session validation hook for wizard routes
 * This hook ensures users cannot access wizard steps without first initializing their session at /delivery-location
 * Hook Logic: IF !request.session.wizardStarted → redirect to relative root /
 * Applied to all wizard page GET routes EXCEPT /location and /delivery-location
 */
export const validateWizardSession = async (request: FastifyRequest, reply: FastifyReply) => {
  console.log('🔵🔵🔵 - [SESSION HOOK] Validating wizard session for path:', request.url);

  // 2025-11-07T00:00:00Z 🟡🟡🟡 Allow select public routes to bootstrap sessions without redirect loops
  const publicRoutes = ['/', '/location', '/delivery-location'];
  const isPublicRoute = publicRoutes.some(route => request.url === route || request.url.startsWith(`${route}?`));

  if (!request.session || !request.session.sessionId) {
    if (isPublicRoute) {
      console.log('⚪⚪⚪ - [SESSION HOOK] Missing session allowed for public route:', request.url);
      return;
    }

    console.log('❗❗❗ - [SESSION HOOK] No session cookie detected, redirecting to splash');
    return reply.redirect('/');
  }

  // 🟡🟡🟡 Skip validation for non-wizard routes once session cookie is confirmed
  const wizardRoutes = ['/event-details', '/date-picker', '/event-setup', '/event-summary', '/final-confirmation', '/checkout'];
  const isWizardRoute = wizardRoutes.some(route => request.url.startsWith(route));

  if (!isWizardRoute) {
    console.log('🟡🟡🟡 - [SESSION HOOK] Session present, route does not require wizard validation');
    return;
  }

  if (!request.session.wizardStarted) {
    console.log('❗❗❗ - [SESSION HOOK] Wizard not started, redirecting to splash');
    console.log('🟡🟡🟡 - [SESSION HOOK] Session data:', JSON.stringify({
      sessionId: request.session.sessionId?.substring(0, 8),
      wizardStarted: request.session.wizardStarted,
      lastVisited: request.session.lastVisited
    }, null, 2));
    return reply.redirect('/');
  }

  // ✅✅✅ Session is valid, allow access to wizard route
  console.log('✅✅✅ - [SESSION HOOK] Session validated:', request.session.sessionId?.substring(0, 8));
  console.log('🟡🟡🟡 - [SESSION HOOK] Wizard session valid for:', request.url);
};

/**
 * 🟡🟡🟡 Optional: Log session activity for monitoring
 */
// 🟤🟤🟤 error TS6133: 'reply' is declared but its value is never read.
export const logSessionActivity = async (request: FastifyRequest, _reply: FastifyReply) => {
  if (request.url !== '/favicon.ico' && !request.url.startsWith('/public/')) {
    const sessionInfo = request.session ? {
      sessionId: request.session.sessionId?.substring(0, 8),
      wizardStarted: request.session.wizardStarted,
      url: request.url,
      timestamp: new Date().toISOString()
    } : { message: 'No session', url: request.url };
    
    console.log('⚪⚪⚪ - [SESSION ACTIVITY]', JSON.stringify(sessionInfo, null, 2));
  }
};

console.log('✅✅✅ - [SESSION HOOKS] Session validation hooks loaded successfully'); 