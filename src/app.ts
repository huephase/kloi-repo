import dotenv from 'dotenv';
dotenv.config();

// src/app.ts Starts server, registers static and view handlers
// Fastify server initialization and config
import fastify, { FastifyInstance } from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import formbody from '@fastify/formbody';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { fastifyConfig } from './config';
import { detectThemeFromSubdomain } from './lib/themeDetector';
import { createRedisStore } from './lib/session-store';
import routes from './routes';
import pino from 'pino';

// console.log('🟡🟡🟡 - [app.ts] Starting Fastify app setup');

const logger = pino();
// NOTE TO FIX: fix properly 'logger' is declared but its value is never read.
// BELOW IS JUST TO SILENCE NODEMON ERROR
logger.info('Hello, world! logger is declared but its value is never read.');
const app: FastifyInstance = fastify(fastifyConfig());
app.log.info('Hello, world! logger is declared but its value is never read.');

// console.log('🟡🟡🟡 - [app.ts] Registering view engine');

// ⚠️⚠️⚠️ 2024-12-19 - Register custom Handlebars helpers before view engine registration
// console.log('🟡🟡🟡 - [app.ts] Registering custom Handlebars helpers');
handlebars.registerHelper('eq', function(a: any, b: any) {
  // console.log('🔵🔵🔵 - [HANDLEBARS eq HELPER] Comparing:', a, '===', b, 'Result:', a === b);
  return a === b;
});

// ⚠️⚠️⚠️ 2024-12-19 - Additional useful helpers for templates
handlebars.registerHelper('ne', function(a: any, b: any) {
  // console.log('🔵🔵🔵 - [HANDLEBARS ne HELPER] Comparing:', a, '!==', b, 'Result:', a !== b);
  return a !== b;
});

handlebars.registerHelper('gt', function(a: any, b: any) {
  // console.log('🔵🔵🔵 - [HANDLEBARS gt HELPER] Comparing:', a, '>', b, 'Result:', a > b);
  return a > b;
});

handlebars.registerHelper('lt', function(a: any, b: any) {
  // console.log('🔵🔵🔵 - [HANDLEBARS lt HELPER] Comparing:', a, '<', b, 'Result:', a < b);
  return a < b;
});

// console.log('✅✅✅ - [app.ts] Custom Handlebars helpers registered successfully');

app.register(fastifyView, {
  engine: {
    handlebars,
  },
  root: path.join(__dirname, 'views'),
  layout: 'layouts/default.hbs',
  includeViewExtension: true,
});

// console.log('🟡🟡🟡 - [app.ts] Registering static assets');
app.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/',
});

// Register formbody to parse application/x-www-form-urlencoded (HTML forms)
app.register(formbody);

// Register cookie plugin - required by the session plugin
// console.log('🟡🟡🟡 - [app.ts] Registering cookie plugin');
app.register(fastifyCookie);

// Configure session
// console.log('⚪⚪⚪ - [app.ts] Registering session with Redis storage');
const sessionTTL = parseInt(process.env.REDIS_SESSION_TTL || '86400', 10); // 24 hours in seconds

// Register fastify session with Redis store
app.register(fastifySession, {
  secret: process.env.REDIS_SESSION_SECRET || 'keyboardcatkeyboardcatkeyboardcatkeyboardcat',
  cookieName: process.env.SESSION_COOKIE_NAME || 'kloi_sessionId',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: sessionTTL * 1000 // milliseconds
  },
  // Use connect-redis store implementation
  store: createRedisStore(sessionTTL),
  saveUninitialized: false,
  rolling: true
});

// Add a hook to check if session is working
app.addHook('onRequest', (req, _reply, done) => {
  if (req.url !== '/favicon.ico' && !req.url.startsWith('/public/')) {
    // console.log('🔵🔵🔵 Request received, path:', req.url, 'session available:', req.session !== undefined, 
    //   req.session?.sessionId ? `sessionId: ${req.session.sessionId.substring(0, 8)}...` : '');
  }
  done();
});

// NOTE: TEMPORARY CHECK PLUGIN LOADED
// app.addHook('onReady', () => console.log('✅✅✅✅ Redis session loaded'));
// console.log('🟡🟡🟡 - [app.ts] Session cookie name:', process.env.SESSION_COOKIE_NAME || 'kloi_sessionId');

// console.log('🟡🟡🟡 - [app.ts] Registering theme detector middleware');
app.addHook('preHandler', detectThemeFromSubdomain);

// 👉🏻👉🏻👉🏻 HIGH-PRIORITY SPLASH SCREEN ROUTE FOR ROOT PATH
app.get('/', async (request, reply) => {
  let theme: string | undefined;
  let isApexDomain = false;
  if (typeof request.hostname === 'string') {
    const hostParts = request.hostname.split('.');
    // Detect apex domain (e.g., specialtyservices.ae or www.specialtyservices.ae)
    if (hostParts.length === 2 || (hostParts.length === 3 && hostParts[0] === 'www')) {
      isApexDomain = true;
    } else if (hostParts.length > 2) {
      theme = hostParts[0];
    }
  }
  if (isApexDomain) {
    const landingPath = path.join(__dirname, '../public/kloi_landing.html');
    if (fs.existsSync(landingPath)) {
      return reply.type('text/html').send(fs.readFileSync(landingPath, 'utf-8'));
    } else {
      return reply.status(404).send('Landing page not found');
    }
  }
  if (!theme && (request as any).theme) theme = (request as any).theme;
  if (!theme) theme = 'default'; // fallback
  const splashPath = path.join(__dirname, `../public/themes/${theme}/${theme}_splash.html`);
  if (fs.existsSync(splashPath)) {
    return reply.type('text/html').send(fs.readFileSync(splashPath, 'utf-8'));
  }
  return reply.redirect('/');
});

// console.log('🟡🟡🟡 - [app.ts] Registering health check route (before protected routes)');
// 👍👍👍👍👍👍 - 2024-12-28 - Register health check route directly to avoid session validation hooks
import healthCheckRoutes from './routes/healthCheck';
app.register(healthCheckRoutes);

// console.log('🟡🟡🟡 - [app.ts] Registering routes');
// FE: Register all app routes
app.register(routes);

// console.log('🟡🟡🟡 - [app.ts] Registering global error handler');

// NOTE TO FIX: fix properly 'request' is declared but its value is never read.
app.setErrorHandler((error, _request, reply) => {
  console.error('❗❗❗ - [app.ts] Global error handler:', error);
  reply.status(500).send({ error: 'Internal Server Error', message: error.message });
});

// Start server if run directly
// Start server if run directly
if (require.main === module) {
  // Read host and port from environment, fallback to '0.0.0.0' and 3000
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || '0.0.0.0';
  app.listen({ port, host }, (err, address) => {
    if (err) {
      console.error('❗❗❗ - [app.ts] Fastify failed to start:', err);
      process.exit(1);
    }
    console.log('🟡🟡🟡 - [app.ts] Fastify server listening on', address);
  });
}


export default app;
