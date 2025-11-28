// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Centralized state management for location finder map
// ⚠️⚠️⚠️ - [map-state.js] Single source of truth for all map-related state
(function(global) {
  'use strict';

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] State manager implementation
  class StateManager {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.state = {
        isInitialized: false,
        polygonReady: false,
        currentCoordinates: null, // {lat, lng}
        isValid: false,
        validationInProgress: false,
        selectedArea: null, // {district, sublocality}
        lastValidPosition: null, // {lat, lng}
        initialSelectedCenter: null, // {lat, lng}
        form: {
          placeId: '',
          fullAddress: '',
          city: '',
          country: '',
          latitude: '',
          longitude: ''
        },
        isValidUAE: false,
        hasFullAddress: false
      };
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Get current state (returns copy to prevent direct mutation)
    getState() {
      return JSON.parse(JSON.stringify(this.state));
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Get specific state property
    get(property) {
      return this.state[property];
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Set state property and emit change event
    set(property, value) {
      const oldValue = this.state[property];
      this.state[property] = value;
      
      // console.log(`🟡🟡🟡 - [StateManager ${new Date().toISOString()}] State changed: ${property}`, {
      //   oldValue,
      //   newValue: value
      // });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Emit state change event
      this.eventBus.emit('state:changed', {
        property,
        oldValue,
        newValue: value,
        state: this.getState()
      });
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Set multiple state properties at once
    setState(updates) {
      const changed = {};
      
      Object.keys(updates).forEach(key => {
        if (this.state[key] !== updates[key]) {
          changed[key] = {
            oldValue: this.state[key],
            newValue: updates[key]
          };
          this.state[key] = updates[key];
        }
      });

      if (Object.keys(changed).length > 0) {
        // console.log(`🟡🟡🟡 - [StateManager ${new Date().toISOString()}] Multiple state changes:`, changed);
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Emit state change event
        this.eventBus.emit('state:changed', {
          changes: changed,
          state: this.getState()
        });
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Set current coordinates (convenience method)
    setCoordinates(lat, lng) {
      const coords = { lat, lng };
      this.set('currentCoordinates', coords);
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Also emit coordinates changed event
      this.eventBus.emit('coordinates:changed', coords);
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Set form data (convenience method)
    setFormData(formData) {
      this.setState({
        form: { ...this.state.form, ...formData },
        isValidUAE: formData.isValidUAE !== undefined ? formData.isValidUAE : this.state.isValidUAE,
        hasFullAddress: formData.hasFullAddress !== undefined ? formData.hasFullAddress : this.state.hasFullAddress
      });
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Set selected area (convenience method)
    setSelectedArea(district, sublocality) {
      this.set('selectedArea', district || sublocality ? { district, sublocality } : null);
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-state.js] Reset state to initial values
    reset() {
      const initialState = {
        isInitialized: false,
        polygonReady: false,
        currentCoordinates: null,
        isValid: false,
        validationInProgress: false,
        selectedArea: null,
        lastValidPosition: null,
        initialSelectedCenter: null,
        form: {
          placeId: '',
          fullAddress: '',
          city: '',
          country: '',
          latitude: '',
          longitude: ''
        },
        isValidUAE: false,
        hasFullAddress: false
      };
      
      this.setState(initialState);
      // console.log(`🟡🟡🟡 - [StateManager ${new Date().toISOString()}] State reset to initial values`);
    }
  }

  // 2025-12-XXT00:00:00:00Z 🟡🟡🟡 - [map-state.js] Export factory function (requires EventBus)
  global.createStateManager = function(eventBus) {
    return new StateManager(eventBus);
  };
  
  // console.log(`✅✅✅ - [map-state.js ${new Date().toISOString()}] StateManager module loaded`);
})(window);

