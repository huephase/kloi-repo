// src/app.ts Starts server, registers static and view handlers
// Fastify server initialization and config
import Fastify from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import secureSession from '@fastify/secure-session';
import path from 'path';
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
console.log('🟡🟡🟡 - [app.ts] secureSession key length:', sessionKey.length);
app.register(secureSession, {
  key: Buffer.from(sessionKey),
  sessionName: process.env.SESSION_COOKIE_NAME || 'sessionId',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: true,
    maxAge: parseInt(process.env.REDIS_SESSION_TTL || '86400', 10),
  },
});
console.log('🟡🟡🟡 - [app.ts] secureSession sessionName:', process.env.SESSION_COOKIE_NAME || 'sessionId');

console.log('🟡🟡🟡 - [app.ts] Registering theme detector middleware');
app.addHook('preHandler', detectThemeFromSubdomain);

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
