// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Event-driven communication system for map components
// ⚠️⚠️⚠️ - [map-events.js] Simple pub/sub pattern for decoupled component communication
(function(global) {
  'use strict';

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Event bus implementation
  class EventBus {
    constructor() {
      this.listeners = {};
      this.logEvents = true; // Enable logging for debugging
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Subscribe to an event
    on(event, handler) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(handler);
      
      if (this.logEvents) {
        console.log(`🟡🟡🟡 - [EventBus ${new Date().toISOString()}] Subscribed to event: ${event}`);
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Unsubscribe from an event
    off(event, handler) {
      if (!this.listeners[event]) return;
      
      const index = this.listeners[event].indexOf(handler);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
      
      if (this.logEvents) {
        console.log(`🟡🟡🟡 - [EventBus ${new Date().toISOString()}] Unsubscribed from event: ${event}`);
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Emit an event to all subscribers
    emit(event, data) {
      if (this.logEvents) {
        console.log(`🟡🟡🟡 - [EventBus ${new Date().toISOString()}] Emitting event: ${event}`, data || '');
      }

      if (!this.listeners[event]) {
        return;
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Call all handlers for this event
      this.listeners[event].forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`❗❗❗ - [EventBus ${new Date().toISOString()}] Error in event handler for ${event}:`, err);
        }
      });
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Remove all listeners for an event (or all events if no event specified)
    removeAllListeners(event) {
      if (event) {
        delete this.listeners[event];
      } else {
        this.listeners = {};
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-events.js] Get count of listeners for an event
    listenerCount(event) {
      return this.listeners[event] ? this.listeners[event].length : 0;
    }
  }

  // 2025-12-XXT00:00:00:00Z 🟡🟡🟡 - [map-events.js] Create singleton instance
  global.MapEventBus = new EventBus();
  
  console.log(`✅✅✅ - [map-events.js ${new Date().toISOString()}] EventBus initialized`);
})(window);

