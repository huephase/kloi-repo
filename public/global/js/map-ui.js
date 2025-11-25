// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] UI management for location finder map
// ⚠️⚠️⚠️ - [map-ui.js] Handles all UI updates based on events - no business logic
(function(global) {
  'use strict';

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] UI manager implementation
  class UIManager {
    constructor(eventBus, stateManager, options) {
      this.eventBus = eventBus;
      this.stateManager = stateManager;
      this.options = options;
      this.popupShownAt = null; // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Track when popup was shown for minimum display time
      this.minPopupDisplayTime = 5000; // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Minimum time to show popup (2 seconds) to prevent flashing
      this.popupAutoHideTimer = null; // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Timer for auto-hiding popup
      
      const now = () => new Date().toISOString();
      this.logInfo = (message, payload) => console.log(`🟡🟡🟡 - [UIManager ${now()}] ${message}`, payload ?? '');
      this.logSuccess = (message, payload) => console.log(`✅✅✅ - [UIManager ${now()}] ${message}`, payload ?? '');
      this.logWarn = (message, payload) => console.warn(`⚠️⚠️⚠️ - [UIManager ${now()}] ${message}`, payload ?? '');
      this.logError = (message, payload) => console.error(`❗❗❗ - [UIManager ${now()}] ${message}`, payload ?? '');

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Setup event listeners
      this.setupEventListeners();
      
      this.logInfo('UIManager initialized', { options: this.options });
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Setup event listeners for UI updates
    setupEventListeners() {
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Listen to state changes to update UI
      this.eventBus.on('state:changed', (data) => {
        this.handleStateChange(data);
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Listen to validation complete to update button
      this.eventBus.on('validation:complete', (result) => {
        this.handleValidationComplete(result);
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Listen to coordinates changed to update form fields
      this.eventBus.on('coordinates:changed', (coords) => {
        this.handleCoordinatesChanged(coords);
      });
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Handle state changes
    handleStateChange(data) {
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update form fields if form data changed
      if (data.changes && data.changes.form) {
        this.updateFormFields();
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update confirm button if validation state changed
      if (data.property === 'isValid' || data.changes?.isValid) {
        this.updateConfirmButton();
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Handle validation complete event
    handleValidationComplete(result) {
      const state = this.stateManager.getState();
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update state with validation result
      this.stateManager.set('isValid', result.valid);
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update confirm button
      this.updateConfirmButton();
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Show popup if validation failed
      if (!result.valid && state.selectedArea) {
        this.showBoundaryViolationPopup(state.selectedArea);
      } else {
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] CRITICAL FIX: Only hide popup if minimum display time has passed
        // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [map-ui.js] This prevents popup from flashing when marker is auto-recentered
        if (this.popupShownAt) {
          const timeSinceShown = Date.now() - this.popupShownAt;
          if (timeSinceShown >= this.minPopupDisplayTime) {
            // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Minimum display time has passed - safe to hide
            this.hideBoundaryViolationPopup();
          } else {
            // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Popup was just shown - schedule hide after minimum display time
            const remainingTime = this.minPopupDisplayTime - timeSinceShown;
            this.logInfo('Popup shown recently - scheduling hide after minimum display time', { 
              timeSinceShown, 
              remainingTime 
            });
            setTimeout(() => {
              // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Check if validation is still valid before hiding
              const currentState = this.stateManager.getState();
              if (currentState.isValid) {
                this.hideBoundaryViolationPopup();
              }
            }, remainingTime);
          }
        } else {
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Popup was never shown - safe to hide (or do nothing)
          this.hideBoundaryViolationPopup();
        }
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Handle coordinates changed event
    handleCoordinatesChanged(coords) {
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update form fields with new coordinates
      this.updateFormFields();
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Helper: Set text content
    setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value || '';
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Helper: Set input value
    setInputValue(id, value) {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Helper: Set error message
    setError(id, msg) {
      const el = document.getElementById(id);
      if (el) el.textContent = msg || '';
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update form fields from state
    updateFormFields() {
      const state = this.stateManager.getState();
      const form = state.form;
      const displayFields = this.options.displayFields || {};
      const hiddenFields = this.options.hiddenFields || {};

      if (displayFields.city) this.setText(displayFields.city, form.city);
      if (displayFields.country) this.setText(displayFields.country, form.country);
      if (displayFields.latitude) this.setText(displayFields.latitude, form.latitude);
      if (displayFields.longitude) this.setText(displayFields.longitude, form.longitude);
      
      if (hiddenFields.placeId) this.setInputValue(hiddenFields.placeId, form.placeId);
      if (hiddenFields.fullAddress) this.setInputValue(hiddenFields.fullAddress, form.fullAddress);
      if (hiddenFields.city) this.setInputValue(hiddenFields.city, form.city);
      if (hiddenFields.country) this.setInputValue(hiddenFields.country, form.country);
      if (hiddenFields.latitude) this.setInputValue(hiddenFields.latitude, form.latitude);
      if (hiddenFields.longitude) this.setInputValue(hiddenFields.longitude, form.longitude);
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update confirm button based on state
    updateConfirmButton() {
      const state = this.stateManager.getState();
      const confirmBtnId = this.options.confirmBtnId;
      const confirmLabelId = 'lf-confirm-label';
      
      const confirmBtn = document.getElementById(confirmBtnId);
      const confirmLabel = document.getElementById(confirmLabelId);
      
      if (!confirmBtn || !confirmLabel) {
        return;
      }

      const form = state.form;
      const hasCoordinates = form.latitude && form.longitude;
      const needsValidation = hasCoordinates && state.selectedArea && (state.selectedArea.district || state.selectedArea.sublocality);
      
      if (!form.fullAddress || !state.hasFullAddress) {
        confirmBtn.disabled = true;
        confirmBtn.classList.remove('btn-active');
        confirmLabel.innerHTML = 'KINDLY CHOOSE A LOCATION';
      } else if (needsValidation && !state.isValid) {
        // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [map-ui.js] Location is outside selected boundary - disable confirm button
        confirmBtn.disabled = true;
        confirmBtn.classList.remove('btn-active');
        confirmLabel.innerHTML = 'LOCATION OUTSIDE SELECTED AREA';
      } else {
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Location is valid (either no boundary check needed or within boundary)
        confirmBtn.disabled = !(form.latitude && form.longitude && state.isValidUAE && state.hasFullAddress);
        confirmBtn.classList.add('btn-active');
        confirmLabel.innerHTML = `<span>${form.fullAddress}</span><br><strong>CONFIRM</strong>`;
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Show boundary violation popup
    showBoundaryViolationPopup(selectedArea) {
      const popup = document.getElementById('boundary-violation-popup');
      if (!popup) {
        this.logError('Boundary violation popup element not found');
        return;
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Clear any existing auto-hide timer
      if (this.popupAutoHideTimer) {
        clearTimeout(this.popupAutoHideTimer);
        this.popupAutoHideTimer = null;
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update selected area text
      const areaTextEl = document.getElementById('popup-selected-area');
      if (areaTextEl) {
        const areaParts = [];
        if (selectedArea.sublocality) areaParts.push(selectedArea.sublocality);
        if (selectedArea.district) areaParts.push(selectedArea.district);
        areaTextEl.textContent = areaParts.length > 0 ? areaParts.join(', ') : 'your selected area';
      }
      
      popup.style.display = 'block';
      this.popupShownAt = Date.now(); // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Track when popup was shown
      this.logInfo('Boundary violation popup shown', selectedArea);
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Emit event to update polygon styling
      this.eventBus.emit('boundary:violation', true);
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Auto-dismiss after 20 seconds if user doesn't interact
      this.popupAutoHideTimer = setTimeout(() => {
        if (popup.style.display === 'block') {
          this.hideBoundaryViolationPopup();
        }
      }, 20000);
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Hide boundary violation popup
    hideBoundaryViolationPopup() {
      const popup = document.getElementById('boundary-violation-popup');
      if (popup) {
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Clear auto-hide timer if it exists
        if (this.popupAutoHideTimer) {
          clearTimeout(this.popupAutoHideTimer);
          this.popupAutoHideTimer = null;
        }
        
        popup.style.display = 'none';
        this.popupShownAt = null; // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Reset popup shown timestamp
        this.logInfo('Boundary violation popup hidden');
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Emit event to reset polygon styling
        this.eventBus.emit('boundary:violation', false);
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Setup popup button handlers
    setupPopupHandlers(onReselect, onDismiss) {
      const reselectBtn = document.getElementById('boundary-popup-reselect-btn');
      const dismissBtn = document.getElementById('boundary-popup-dismiss-btn');
      
      if (reselectBtn) {
        reselectBtn.addEventListener('click', () => {
          this.logInfo('User clicked "Change My Area" - redirecting to delivery-location');
          if (onReselect) {
            onReselect();
          } else {
            window.location.href = '/delivery-location';
          }
        });
      }
      
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          this.logInfo('User dismissed boundary violation popup');
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] User explicitly dismissed - reset timestamp to allow immediate hide
          this.popupShownAt = null;
          this.hideBoundaryViolationPopup();
          if (onDismiss) {
            onDismiss();
          }
        });
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update button disabled state
    setButtonDisabled(buttonId, disabled) {
      const btn = document.getElementById(buttonId);
      if (btn) {
        btn.disabled = !!disabled;
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-ui.js] Update button text
    setButtonText(buttonId, text) {
      const btn = document.getElementById(buttonId);
      if (btn) {
        btn.textContent = text || '';
      }
    }
  }

  // 2025-12-XXT00:00:00:00Z 🟡🟡🟡 - [map-ui.js] Export factory function
  global.createUIManager = function(eventBus, stateManager, options) {
    return new UIManager(eventBus, stateManager, options);
  };
  
  console.log(`✅✅✅ - [map-ui.js ${new Date().toISOString()}] UIManager module loaded`);
})(window);

