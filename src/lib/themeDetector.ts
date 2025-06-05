// Middleware for subdomain-based theming
import { FastifyRequest, FastifyReply } from 'fastify';

export function getThemeFromHost(hostname: string): string {
  console.log('🟡🟡🟡 - [getThemeFromHost] called:', hostname);
  const subdomain = hostname.split('.')[0];
  const theme = subdomain || process.env.THEME_DEFAULT || 'default';
  console.log('🟡🟡🟡 - [getThemeFromHost] return:', theme);
  return theme;
}

// NOTE TO FIX: fix properly 'reply' is declared but its value is never read.
export async function detectThemeFromSubdomain(request: FastifyRequest, _reply: FastifyReply) {
  console.log('🟡🟡🟡 - [detectThemeFromSubdomain] called');
  const hostname = request.hostname || request.headers.host || '';
  const theme = getThemeFromHost(hostname);
  // Attach theme to request for downstream handlers
  (request as any).theme = theme;
  // Optionally set in reply.locals or decorate fastify instance
  console.log('🟡🟡🟡 - [detectThemeFromSubdomain] theme set:', theme);
}
