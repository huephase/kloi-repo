// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Centralized validation service for location finder map
// ⚠️⚠️⚠️ - [map-validation.js] Single source of truth for all validation logic - emits events, no direct UI updates
(function(global) {
  'use strict';

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Validation service implementation
  class ValidationService {
    constructor(eventBus, polygonManager) {
      this.eventBus = eventBus;
      this.polygonManager = polygonManager;
      this.isValidationInProgress = false;
      this.selectedArea = null; // {district, sublocality}
      
      const now = () => new Date().toISOString();
      this.logInfo = (message, payload) => console.log(`🟡🟡🟡 - [ValidationService ${now()}] ${message}`, payload ?? '');
      this.logSuccess = (message, payload) => console.log(`✅✅✅ - [ValidationService ${now()}] ${message}`, payload ?? '');
      this.logWarn = (message, payload) => console.warn(`⚠️⚠️⚠️ - [ValidationService ${now()}] ${message}`, payload ?? '');
      this.logError = (message, payload) => console.error(`❗❗❗ - [ValidationService ${now()}] ${message}`, payload ?? '');

      this.logInfo('ValidationService initialized');
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Set selected area for validation
    setSelectedArea(district, sublocality) {
      this.selectedArea = district || sublocality ? { district, sublocality } : null;
      this.logInfo('Selected area updated', this.selectedArea);
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Validate coordinates against selected delivery area
    // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: Polygon containment is primary check, reverse geocoding is secondary verification
    async validate(lat, lng) {
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] If no selected area, allow any location
      if (!this.selectedArea || (!this.selectedArea.district && !this.selectedArea.sublocality)) {
        this.logInfo('No selected area to validate against - allowing any location');
        const result = { valid: true };
        this.eventBus.emit('validation:complete', result);
        return result;
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Prevent concurrent validations
      if (this.isValidationInProgress) {
        this.logWarn('Validation already in progress - skipping duplicate request', { lat, lng });
        return null; // Return null to indicate validation was skipped
      }

      this.isValidationInProgress = true;
      this.logInfo('Validating coordinates against selected area', { 
        lat, 
        lng, 
        district: this.selectedArea.district, 
        sublocality: this.selectedArea.sublocality 
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Emit validation start event
      this.eventBus.emit('validation:start', { lat, lng });

      try {
        // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: Polygon containment check is primary - polygon from DB is source of truth
        let polygonCheckPassed = false;
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] CRITICAL: Check if polygon is ready and on the map
        if (this.polygonManager && this.polygonManager.isReady()) {
          const isInside = this.polygonManager.isPointInside(lat, lng);
          this.logInfo('Polygon containment check', { 
            isInside, 
            polygonReady: true, 
            lat, 
            lng 
          });
          
          if (!isInside) {
            this.logWarn('Location validation failed - coordinates outside polygon boundary', {
              district: this.selectedArea.district,
              sublocality: this.selectedArea.sublocality,
              lat,
              lng
            });
            
            this.isValidationInProgress = false;
            const result = { 
              valid: false, 
              error: 'Location is outside your selected delivery area', 
              actualDistrict: null, 
              actualSublocality: null 
            };
            
            // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Emit validation complete event
            this.eventBus.emit('validation:complete', result);
            return result;
          }
          
          polygonCheckPassed = true;
          this.logInfo('Polygon containment check passed - proceeding with reverse geocoding verification', { lat, lng });
        } else {
          this.logWarn('Polygon not ready for validation - falling back to reverse geocoding only', {
            district: this.selectedArea.district,
            sublocality: this.selectedArea.sublocality,
            lat,
            lng,
            polygonReady: this.polygonManager ? this.polygonManager.isReady() : false
          });
        }

        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Reverse geocoding as secondary verification
        const response = await fetch(`/api/geo/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
        const data = await response.json();

        if (!data.success) {
          this.logError('Reverse geocoding failed during validation', data);
          this.isValidationInProgress = false;
          
          // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: If polygon check passed, allow even if reverse geocoding fails (polygon is authoritative)
          if (polygonCheckPassed) {
            this.logInfo('Polygon check passed but reverse geocoding failed - allowing location (polygon is authoritative)');
            const result = { valid: true, actualDistrict: null, actualSublocality: null };
            this.eventBus.emit('validation:complete', result);
            return result;
          }
          
          // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: If polygon check didn't run, fail closed
          this.logWarn('Reverse geocoding failed and no polygon check - failing closed for security');
          const result = { 
            valid: false, 
            error: 'Validation failed - unable to verify location', 
            actualDistrict: null, 
            actualSublocality: null 
          };
          this.eventBus.emit('validation:complete', result);
          return result;
        }

        const actualDistrict = data.district || null;
        const actualSublocality = data.sublocality || null;

        this.logInfo('Validation result', { 
          actualDistrict, 
          actualSublocality, 
          expectedDistrict: this.selectedArea.district, 
          expectedSublocality: this.selectedArea.sublocality, 
          polygonCheckPassed 
        });

        // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: If polygon check passed, allow even if reverse geocoding returns null (polygon is authoritative)
        if (polygonCheckPassed && !actualDistrict && !actualSublocality) {
          this.logInfo('Polygon check passed but reverse geocoding returned no district/sublocality - allowing location (polygon is authoritative)');
          this.isValidationInProgress = false;
          const result = { valid: true, actualDistrict: null, actualSublocality: null };
          this.eventBus.emit('validation:complete', result);
          return result;
        }

        // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: If we can't get district/sublocality and polygon check didn't run, fail closed
        if (!polygonCheckPassed && (this.selectedArea.district || this.selectedArea.sublocality) && !actualDistrict && !actualSublocality) {
          this.logWarn('Reverse geocoding returned no district/sublocality and no polygon check - failing closed for security');
          this.isValidationInProgress = false;
          const result = { 
            valid: false, 
            actualDistrict: null, 
            actualSublocality: null, 
            error: 'Unable to verify location matches selected area' 
          };
          this.eventBus.emit('validation:complete', result);
          return result;
        }

        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Check if district and sublocality match
        const districtMatches = !this.selectedArea.district || 
          (actualDistrict && actualDistrict.toLowerCase().trim() === this.selectedArea.district.toLowerCase().trim());
        const sublocalityMatches = !this.selectedArea.sublocality || 
          (actualSublocality && actualSublocality.toLowerCase().trim() === this.selectedArea.sublocality.toLowerCase().trim());

        const isValid = districtMatches && sublocalityMatches;

        if (!isValid) {
          this.logWarn('Location validation failed - coordinates do not match selected area', {
            expectedDistrict: this.selectedArea.district,
            expectedSublocality: this.selectedArea.sublocality,
            actualDistrict,
            actualSublocality
          });
        } else {
          this.logSuccess('Location validation passed - coordinates match selected area');
        }

        this.isValidationInProgress = false;
        const result = { valid: isValid, actualDistrict, actualSublocality };
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Emit validation complete event
        this.eventBus.emit('validation:complete', result);
        return result;
      } catch (err) {
        this.logError('Error validating coordinates', err);
        this.isValidationInProgress = false;
        
        // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: If polygon check passed, allow even on error (polygon is authoritative)
        if (this.polygonManager && this.polygonManager.isReady()) {
          const isInside = this.polygonManager.isPointInside(lat, lng);
          if (isInside) {
            this.logInfo('Polygon check passed but validation error occurred - allowing location (polygon is authoritative)');
            const result = { valid: true, actualDistrict: null, actualSublocality: null };
            this.eventBus.emit('validation:complete', result);
            return result;
          }
        }
        
        // ⚠️⚠️⚠️ - [map-validation.js] SECURITY FIX: Fail closed - reject on error if polygon check didn't pass
        const result = { 
          valid: false, 
          error: 'Validation error - unable to verify location', 
          actualDistrict: null, 
          actualSublocality: null 
        };
        this.eventBus.emit('validation:complete', result);
        return result;
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-validation.js] Check if validation is in progress
    isInProgress() {
      return this.isValidationInProgress;
    }
  }

  // 2025-12-XXT00:00:00:00Z 🟡🟡🟡 - [map-validation.js] Export factory function
  global.createValidationService = function(eventBus, polygonManager) {
    return new ValidationService(eventBus, polygonManager);
  };
  
  console.log(`✅✅✅ - [map-validation.js ${new Date().toISOString()}] ValidationService module loaded`);
})(window);

