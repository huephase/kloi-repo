// Global types and declarations
import { FastifyRequest, FastifyReply } from 'fastify';

// Define session data structure
export interface SessionData {
  sessionId: string;
  lastVisited: string;
  touch(): void;
  [key: string]: any; // Allow dynamic session keys
}

// Define wizard step configuration type
export interface WizardStepConfig {
  sessionKey: string;
  redirectTo: string;
}

// Extend FastifyRequest to include session
export interface RequestWithSession extends FastifyRequest {
  session: SessionData;
}

// Declare module to augment Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    session: SessionData;
  }
}

