// 2025-12-30T20:00:00Z 🟡🟡🟡 - [THEME DETECTOR] Middleware for subdomain-based theming
import { FastifyRequest, FastifyReply } from 'fastify';

export function getThemeFromHost(hostname: string): string {
  console.log('🟡🟡🟡 - [getThemeFromHost] Extracting theme from hostname:', hostname);
  
  if (!hostname || hostname.trim() === '') {
    const defaultTheme = process.env.THEME_DEFAULT || 'default';
    console.log('⚠️⚠️⚠️ - [getThemeFromHost] Empty hostname, using default theme:', defaultTheme);
    return defaultTheme;
  }
  
  // Remove port if present (e.g., "admin.example.com:3000" -> "admin.example.com")
  const hostnameWithoutPort = hostname.split(':')[0];
  console.log('🟡🟡🟡 - [getThemeFromHost] Hostname without port:', hostnameWithoutPort);
  
  // Split by dots and get first part (subdomain)
  const parts = hostnameWithoutPort.split('.');
  console.log('🟡🟡🟡 - [getThemeFromHost] Hostname parts:', parts);
  
  const subdomain = parts[0] || '';
  const theme = subdomain || process.env.THEME_DEFAULT || 'default';
  
  console.log('✅✅✅ - [getThemeFromHost] Extracted subdomain:', subdomain, '-> theme:', theme);
  return theme;
}

// 2025-12-30T20:00:00Z 🟡🟡🟡 - [THEME DETECTOR] Detect theme from subdomain with comprehensive header checking
export async function detectThemeFromSubdomain(request: FastifyRequest, _reply: FastifyReply) {
  console.log('🟡🟡🟡 - [detectThemeFromSubdomain] Starting theme detection for path:', request.url);
  
  // 2025-12-30T20:00:00Z 🟡🟡🟡 - [THEME DETECTOR] Check multiple sources for hostname (proxy support)
  // Priority: request.hostname (Fastify parsed) > X-Forwarded-Host > Host header
  // Note: Headers can be string or string[], so we need to handle both cases
  const xForwardedHost = request.headers['x-forwarded-host'];
  const forwardedHost = Array.isArray(xForwardedHost) ? xForwardedHost[0] : xForwardedHost;
  const hostHeader = request.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  
  const hostname = request.hostname || forwardedHost || host || '';
  
  console.log('🟡🟡🟡 - [detectThemeFromSubdomain] Hostname sources:');
  console.log('  - request.hostname:', request.hostname);
  console.log('  - X-Forwarded-Host (raw):', request.headers['x-forwarded-host']);
  console.log('  - X-Forwarded-Host (parsed):', forwardedHost);
  console.log('  - Host header (raw):', request.headers.host);
  console.log('  - Host header (parsed):', host);
  console.log('  - Selected hostname:', hostname);
  
  // Log all headers for debugging (only in development or when debugging)
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_THEME === 'true') {
    console.log('🟡🟡🟡 - [detectThemeFromSubdomain] All relevant headers:', {
      host: request.headers.host,
      'x-forwarded-host': request.headers['x-forwarded-host'],
      'x-forwarded-proto': request.headers['x-forwarded-proto'],
      'x-real-ip': request.headers['x-real-ip'],
      'x-forwarded-for': request.headers['x-forwarded-for']
    });
  }
  
  const theme = getThemeFromHost(hostname);
  
  // Attach theme to request for downstream handlers
  (request as any).theme = theme;
  
  console.log('✅✅✅ - [detectThemeFromSubdomain] Theme detected and set:', theme, 'for path:', request.url);
}
