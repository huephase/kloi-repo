// src/types/fastify-secure-session.d.ts
import '@fastify/secure-session';

declare module '@fastify/secure-session' {
  interface SessionData {
    wizardStarted?: boolean;
    lastVisited?: string;
  }
  
  interface Session {
    get<T = any>(key: keyof SessionData): T | undefined;
    set<K extends keyof SessionData>(key: K, value: SessionData[K]): void;
  }
}