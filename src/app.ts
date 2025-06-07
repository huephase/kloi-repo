import dotenv from 'dotenv';
dotenv.config();

// src/app.ts Starts server, registers static and view handlers
// Fastify server initialization and config
import Fastify from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import secureSession from '@fastify/secure-session';
import formbody from '@fastify/formbody';
import path from 'path';
import fs from 'fs';
import { fastifyConfig } from './config';
import { detectThemeFromSubdomain } from './lib/themeDetector';
// FE: Aggregated routes
import routes from './routes';
import pino from 'pino';

console.log('🟡🟡🟡 - [app.ts] Starting Fastify app setup');

const logger = pino();
// NOTE TO FIX: fix properly 'logger' is declared but its value is never read.
// BELOW IS JUST TO SILENCE NODEMON ERROR
logger.info('Hello, world! logger is declared but its value is never read.');
const app = Fastify({
  ...fastifyConfig(),
  logger: { level: 'info' },
});

console.log('🟡🟡🟡 - [app.ts] Registering view engine');
app.register(fastifyView, {
  engine: {
    handlebars: require('handlebars'),
  },
  root: path.join(__dirname, 'views'),
  layout: 'layouts/default.hbs',
  includeViewExtension: true,
});

console.log('🟡🟡🟡 - [app.ts] Registering static assets');
app.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/',
});

console.log('🟡🟡🟡 - [app.ts] Registering secure session');
const sessionKey = (process.env.REDIS_SESSION_SECRET || 'keyboardcatkeyboardcatkeyboardcatkeyboardcat').slice(0, 32);
// Register formbody to parse application/x-www-form-urlencoded (HTML forms)
app.register(formbody);
console.log('🟡🟡🟡 - [app.ts] secureSession key length:', sessionKey.length);
app.register(secureSession, {
  key: Buffer.from(sessionKey),
  sessionName: process.env.SESSION_COOKIE_NAME || 'kloi_sessionId',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: process.env.SESSION_COOKIE_SAMESITE === 'true',
    maxAge: parseInt(process.env.REDIS_SESSION_TTL || '86400', 10),
  },
});
console.log('🟡🟡🟡 - [app.ts] secureSession sessionName:', process.env.SESSION_COOKIE_NAME || 'kloi_sessionId');

console.log('🟡🟡🟡 - [app.ts] Registering theme detector middleware');
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

console.log('🟡🟡🟡 - [app.ts] Registering routes');
// FE: Register all app routes
app.register(routes);

console.log('🟡🟡🟡 - [app.ts] Registering global error handler');

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
