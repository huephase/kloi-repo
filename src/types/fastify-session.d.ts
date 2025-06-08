import '@fastify/session';
import 'fastify';

declare module 'fastify' {
  interface Session {
    sessionId: string;
    touch(): void;
    regenerate(): Promise<void>;
    reload(): Promise<void>;
    destroy(): Promise<void>;
    // Add custom session data properties
    wizardStarted?: boolean;
    lastVisited?: string;
    locationData?: {
      placeId: string;
      fullAddress: string;
      city: string;
      country: string;
      latitude: number;
      longitude: number;
    };
    // Add other wizard state data properties as needed
    customerInfo?: {
      name: string;
      email: string;
      phone: string;
    };
    eventSetup?: {
      date: string;
      guestCount: number;
      venue: string;
      menuSelections: Array<string>;
    };
  }

  interface FastifyRequest {
    session: Session;
  }
}

// Make sure @fastify/session works with our custom Session interface
declare module '@fastify/session' {
  interface SessionData {
    wizardStarted?: boolean;
    lastVisited?: string;
    locationData?: {
      placeId: string;
      fullAddress: string;
      city: string;
      country: string;
      latitude: number;
      longitude: number;
    };
    // Add other wizard state data properties as needed
    customerInfo?: {
      name: string;
      email: string;
      phone: string;
    };
    eventSetup?: {
      date: string;
      guestCount: number;
      venue: string;
      menuSelections: Array<string>;
    };
  }
}
