// 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] CSRF protection utility module
// Centralized CSRF token generation and validation helpers

import { FastifyReply } from 'fastify';

/**
 * 🟡🟡🟡 - [CSRF] Generate CSRF token for forms
 * This function generates a CSRF token that should be included in all forms
 * to protect against Cross-Site Request Forgery attacks
 * 
 * @param reply - Fastify reply object with CSRF protection plugin
 * @returns CSRF token string
 */
export async function generateCsrfToken(reply: FastifyReply): Promise<string> {
  try {
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate token using Fastify CSRF protection plugin
    const token = await reply.generateCsrf();
    console.log('✅✅✅ - [CSRF] CSRF token generated successfully');
    return token;
  } catch (error) {
    console.error('❗❗❗ - [CSRF] Error generating CSRF token:', error);
    throw error;
  }
}

/**
 * 🟡🟡🟡 - [CSRF] Get CSRF token from request (for AJAX requests)
 * Extracts CSRF token from request headers or body
 * 
 * @param request - Fastify request object
 * @returns CSRF token string or null
 */
export function getCsrfTokenFromRequest(request: any): string | null {
  // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Check for token in headers (for AJAX) or body (for forms)
  const token = request.headers['x-csrf-token'] || 
                request.headers['csrf-token'] ||
                (request.body && request.body._csrf) ||
                (request.query && request.query._csrf);
  
  return token || null;
}
