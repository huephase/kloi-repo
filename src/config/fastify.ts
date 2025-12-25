import { FastifyServerOptions } from 'fastify';

export default function fastifyConfig(): FastifyServerOptions {
  console.log('🟡🟡🟡 - [fastifyConfig] called');
  const config: FastifyServerOptions = {
    logger: false,
    trustProxy: true,
    bodyLimit: 5242880, // 5MB - Increased for image uploads (JPG, PNG, SVG max 5MB)
    pluginTimeout: 10000,
    // Add more default options as needed
    // Note: Port should be set in your server bootstrap (e.g., app.ts) using fastify.listen(port)
    // See example usage below.

  };
  // console.log('🟡🟡🟡 - [fastifyConfig] return:', config);
  return config;
}