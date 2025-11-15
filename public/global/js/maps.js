// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Google Maps Location Finder - Event-Driven Architecture
// ⚠️⚠️⚠️ - [maps.js] REFACTORED: Now uses modular event-driven architecture for reliability and maintainability
(function(global) {
  'use strict';

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to load Google Maps API
  function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve(window.google.maps);
      const script = document.createElement('script');
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Include geometry library for distance and point-in-geometry calculations
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.onerror = reject;
      script.onload = () => {
        if (window.google && window.google.maps) resolve(window.google.maps);
        else reject(new Error('Google Maps failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to check if country is UAE
  function isUAE(country) {
    return country === 'United Arab Emirates';
  }

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to set error message
  function setError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg || '';
  }

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to set button disabled state
  function setBtnDisabled(id, disabled) {
    var el = document.getElementById(id);
    if (el) el.disabled = !!disabled;
  }

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to set button text
  function setBtnText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Main function to initialize location finder map
  // ⚠️⚠️⚠️ - [maps.js] REFACTORED: Now uses event-driven architecture with modular components
  function initLocationFinderMap(options) {
    const now = () => new Date().toISOString();
    const logInfo = (message, payload) => console.log(`🟡🟡🟡 - [maps.js ${now()}] ${message}`, payload ?? '');
    const logSuccess = (message, payload) => console.log(`✅✅✅ - [maps.js ${now()}] ${message}`, payload ?? '');
    const logWarn = (message, payload) => console.warn(`⚠️⚠️⚠️ - [maps.js ${now()}] ${message}`, payload ?? '');
    const logError = (message, payload) => console.error(`❗❗❗ - [maps.js ${now()}] ${message}`, payload ?? '');

    // Required options
    const {
      apiKey,
      containerId,
      detectBtnId,
      formId,
      confirmBtnId,
      displayFields = {},
      hiddenFields = {},
      errorMsgId,
      initialLocationData = null, // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Location data from session (set by delivery-locations page)
      polygonCoordinateOrder = 'lng-lat' // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Coordinate order from MAP_POLYGON env variable
    } = options;

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Initialize event-driven modules
    const eventBus = window.MapEventBus;
    if (!eventBus) {
      logError('EventBus not available - ensure map-events.js is loaded first');
      return;
    }

    const stateManager = window.createStateManager(eventBus);
    const polygonManager = window.createPolygonManager(eventBus, polygonCoordinateOrder);
    const validationService = window.createValidationService(eventBus, polygonManager);
    const uiManager = window.createUIManager(eventBus, stateManager, {
      confirmBtnId,
      displayFields,
      hiddenFields,
      errorMsgId
    });

    logInfo('Event-driven modules initialized', {
      hasEventBus: !!eventBus,
      hasStateManager: !!stateManager,
      hasPolygonManager: !!polygonManager,
      hasValidationService: !!validationService,
      hasUIManager: !!uiManager
    });

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Map and marker instances
    let map, marker, geocoder;
    let dragDebounceTimer = null; // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Debounce timer for drag events

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Function to reverse geocode coordinates to address
    function reverseGeocodeAndUpdateForm(lat, lng) {
      if (!geocoder) return;
      logInfo('Reverse geocoding coordinates', { lat, lng });
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.length) {
          const place = results[0];
          const compMap = {};
          place.address_components?.forEach(c => c.types.forEach(t => compMap[t] = c.long_name));
          const country = compMap.country || '';
          const fullAddress = place.formatted_address || Object.values(compMap).join(', ');
          const city = compMap.locality || compMap.postal_town || '';
          const isValidUAE = isUAE(country);
          const hasFullAddress = Boolean(fullAddress.trim());
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Update state with reverse geocoded data
          stateManager.setFormData({
            placeId: place.place_id || '',
            fullAddress: fullAddress,
            city: city,
            country: country,
            latitude: lat.toString(),
            longitude: lng.toString(),
            isValidUAE: isValidUAE,
            hasFullAddress: hasFullAddress
          });
          
          logSuccess('Reverse geocoding successful', { fullAddress, country });
        } else {
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Update state with coordinates only
          stateManager.setFormData({
            latitude: lat.toString(),
            longitude: lng.toString(),
            isValidUAE: false,
            hasFullAddress: false
          });
          logError('Reverse geocoding failed', { status, lat, lng });
        }
      });
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle detect location button click
    async function handleDetectLocation() {
      setError(errorMsgId, '');
      if (!navigator.geolocation) {
        setError(errorMsgId, 'Geolocation is not supported by your browser.');
        logError('Geolocation not supported');
        return;
      }
      setBtnDisabled(detectBtnId, true);
      setBtnText(detectBtnId, 'Detecting...');
      logInfo('Detecting user location');
      
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const lat = coords.latitude;
          const lng = coords.longitude;
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validate detected location against selected area
          const validation = await validationService.validate(lat, lng);
          
          if (!validation || !validation.valid) {
            logWarn('Detected location outside selected area - recentering', { lat, lng });
            const state = stateManager.getState();
            const lastValid = state.lastValidPosition || state.initialSelectedCenter;
            if (lastValid) {
              marker.setPosition(lastValid);
              map.setCenter(lastValid);
              stateManager.setCoordinates(lastValid.lat, lastValid.lng);
            }
            setBtnDisabled(detectBtnId, false);
            setBtnText(detectBtnId, 'Detect My Location');
            setError(errorMsgId, 'Detected location is outside your selected delivery area.');
            return;
          }
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Valid location - update marker and state
          marker.setPosition({ lat, lng });
          map.setCenter({ lat, lng });
          stateManager.setCoordinates(lat, lng);
          stateManager.set('lastValidPosition', { lat, lng });
          reverseGeocodeAndUpdateForm(lat, lng);
          setBtnDisabled(detectBtnId, false);
          setBtnText(detectBtnId, 'Detect My Location');
          logSuccess('User location detected', { lat, lng });
        },
        (err) => {
          setError(errorMsgId, 'Unable to retrieve your location.');
          setBtnDisabled(detectBtnId, false);
          setBtnText(detectBtnId, 'Detect My Location');
          logError('Geolocation error', err);
        }
      );
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle map click
    async function handleMapClick(e) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validate coordinates before updating
      const validation = await validationService.validate(lat, lng);
      
      if (!validation || !validation.valid) {
        logWarn('Map click outside selected area - recentering', { lat, lng });
        const state = stateManager.getState();
        const lastValid = state.lastValidPosition || state.initialSelectedCenter;
        if (lastValid) {
          marker.setPosition(lastValid);
          map.setCenter(lastValid);
          stateManager.setCoordinates(lastValid.lat, lastValid.lng);
        }
        return;
      }
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validation confirmed - update marker and state
      marker.setPosition({ lat, lng });
      stateManager.setCoordinates(lat, lng);
      stateManager.set('lastValidPosition', { lat, lng });
      logSuccess('Updated last valid position from map click', { lat, lng });
      reverseGeocodeAndUpdateForm(lat, lng);
      logInfo('Map clicked', { lat, lng });
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle marker drag end
    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] SECURITY FIX: Added debouncing to prevent excessive API calls
    async function handleMarkerDragEnd(e) {
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Debounce drag validation to prevent excessive API calls
      if (dragDebounceTimer) {
        clearTimeout(dragDebounceTimer);
      }
      
      dragDebounceTimer = setTimeout(async () => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validate coordinates before updating
        const validation = await validationService.validate(lat, lng);
        
        if (!validation || !validation.valid) {
          logWarn('Marker dragged outside selected area - recentering', { lat, lng });
          const state = stateManager.getState();
          const lastValid = state.lastValidPosition || state.initialSelectedCenter;
          if (lastValid) {
            marker.setPosition(lastValid);
            map.setCenter(lastValid);
            stateManager.setCoordinates(lastValid.lat, lastValid.lng);
          }
          return;
        }
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validation confirmed - update marker and state
        marker.setPosition({ lat, lng });
        stateManager.setCoordinates(lat, lng);
        stateManager.set('lastValidPosition', { lat, lng });
        logSuccess('Updated last valid position from marker drag', { lat, lng });
        reverseGeocodeAndUpdateForm(lat, lng);
        logInfo('Marker dragged', { lat, lng });
      }, 400); // 400ms debounce delay
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle form submission
    function handleFormSubmit(e) {
      e.preventDefault();
      
      const state = stateManager.getState();
      const form = state.form;
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Validate before submit
      if (!(form.latitude && form.longitude && state.isValidUAE && state.hasFullAddress)) {
        setError(errorMsgId, 'Please select a valid UAE location and address.');
        logError('Form validation failed', form);
        return false;
      }
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Check boundary validation
      if (state.selectedArea && !state.isValid) {
        setError(errorMsgId, 'Location is outside your selected delivery area.');
        logError('Form submission blocked - location outside boundary');
        return false;
      }
      
      setError(errorMsgId, '');
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Use AJAX submission to handle redirect properly
      logInfo('Submitting location data via AJAX');
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Get the form element and its action URL
      const formEl = document.getElementById(formId);
      const actionUrl = formEl.action;
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Show loading state on confirm button
      const confirmBtn = document.getElementById(confirmBtnId);
      const confirmLabel = document.getElementById('lf-confirm-label');
      const originalBtnText = confirmLabel.innerHTML;
      
      confirmBtn.disabled = true;
      confirmLabel.innerHTML = 'Processing...';
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Prepare form data
      const formData = {
        placeId: form.placeId,
        fullAddress: form.fullAddress,
        city: form.city,
        country: form.country,
        latitude: form.latitude,
        longitude: form.longitude
      };
      
      logInfo('Submitting data', formData);
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Make AJAX request
      fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'same-origin'
      })
      .then(response => {
        logInfo('Server response status', { status: response.status });
        return response.json();
      })
      .then(result => {
        logInfo('Server response', result);
        
        if (result.success) {
          logSuccess('Location submission successful');
          
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Show success message briefly
          confirmLabel.innerHTML = 'Checking location, please wait...';
          
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Redirect to next step after brief delay
          setTimeout(() => {
            logSuccess('Redirecting to next step', { nextStep: result.nextStep });
            window.location.href = result.nextStep;
          }, 1000);
          
        } else {
          logError('Location submission failed', result);
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Check if this is a boundary validation error
          const isBoundaryError = result.message && (
            result.message.includes('outside your selected delivery area') ||
            result.message.includes('Failed to validate location') ||
            result.validationDetails
          );
          
          if (isBoundaryError) {
            // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Recenter to selected area center (fallback to last valid) and show popup
            logWarn('Server validation failed - location outside selected area');
            const state = stateManager.getState();
            const center = state.initialSelectedCenter || state.lastValidPosition;
            if (center) {
              marker.setPosition(center);
              map.setCenter(center);
              stateManager.setCoordinates(center.lat, center.lng);
            }
          }
          
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Reset button and show error
          confirmBtn.disabled = false;
          confirmLabel.innerHTML = originalBtnText;
          setError(errorMsgId, result.message || 'Failed to save location. Please try again.');
        }
      })
      .catch(error => {
        logError('Network or parsing error', error);
        
        // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Reset button and show error
        confirmBtn.disabled = false;
        confirmLabel.innerHTML = originalBtnText;
        setError(errorMsgId, 'Network error occurred. Please check your connection and try again.');
      });
      
      return false;
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Setup event listeners for event-driven coordination
    function setupEventListeners() {
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] When polygon is ready, calculate center and set initial position
      eventBus.on('polygon:ready', (data) => {
        logInfo('Polygon ready event received', data);
        stateManager.set('polygonReady', true);
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Calculate polygon center if not already calculated
        if (!polygonManager.getCenter() && polygonManager.getPaths()) {
          const center = polygonManager.calculateCenter(polygonManager.getPaths());
          if (center) {
            logInfo('Polygon center calculated from ready event', center);
          }
        }
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] When polygon center is calculated, set marker to center (CRITICAL FIX)
      eventBus.on('polygon:center:calculated', (center) => {
        logInfo('Polygon center calculated event received', center);
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] CRITICAL FIX: Set initial marker position to polygon center (guaranteed to be within polygon)
        if (marker && map) {
          marker.setPosition(center);
          map.setCenter(center);
          stateManager.setCoordinates(center.lat, center.lng);
          stateManager.set('lastValidPosition', center);
          stateManager.set('initialSelectedCenter', center);
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Fit bounds to polygon
          polygonManager.fitBounds(map);
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Reverse geocode center for address display
          reverseGeocodeAndUpdateForm(center.lat, center.lng);
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validate center coordinates (should always pass)
          validationService.validate(center.lat, center.lng);
          
          logSuccess('Marker set to polygon center', center);
        }
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] When coordinates change, trigger validation
      eventBus.on('coordinates:changed', (coords) => {
        logInfo('Coordinates changed event received', coords);
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Only validate if we have a selected area
        const state = stateManager.getState();
        if (state.selectedArea && (state.selectedArea.district || state.selectedArea.sublocality)) {
          validationService.validate(coords.lat, coords.lng);
        }
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] When validation completes, update state
      eventBus.on('validation:complete', (result) => {
        logInfo('Validation complete event received', result);
        stateManager.set('isValid', result.valid);
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Update polygon styling based on validation result
        if (result.valid) {
          polygonManager.setViolationStyle(false);
        } else {
          polygonManager.setViolationStyle(true);
        }
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Handle boundary violation styling
      eventBus.on('boundary:violation', (isViolation) => {
        polygonManager.setViolationStyle(isViolation);
      });
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Setup popup handlers
    function setupPopupHandlers() {
      uiManager.setupPopupHandlers(
        () => {
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] On reselect, redirect to delivery-location
          logInfo('User clicked "Change My Area" - redirecting to delivery-location');
          window.location.href = '/delivery-location';
        },
        () => {
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] On dismiss, recenter to selected area
          const state = stateManager.getState();
          const center = state.initialSelectedCenter || state.lastValidPosition;
          if (center && marker && map) {
            marker.setPosition(center);
            map.setCenter(center);
            stateManager.setCoordinates(center.lat, center.lng);
            logInfo('User dismissed boundary violation popup - recentered to selected area');
          }
        }
      );
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Load Google Maps and initialize
    loadGoogleMaps(apiKey).then(() => {
      geocoder = new window.google.maps.Geocoder();
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Initialize selected area from session data
      if (initialLocationData) {
        const district = initialLocationData.components?.district || null;
        const sublocality = initialLocationData.components?.sublocality || null;
        stateManager.setSelectedArea(district, sublocality);
        validationService.setSelectedArea(district, sublocality);
        logInfo('Initialized selected area from session', { district, sublocality });
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Determine initial center - will be overridden by polygon center if available
      let initialCenter = { lat: 25.2048, lng: 55.2708 }; // Default to Dubai, UAE
      let initialZoom = 15;

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] CRITICAL FIX: Load and normalize polygon first, then calculate center
      let sessionPolygonPaths = null;
      if (initialLocationData?.components?.polygon) {
        sessionPolygonPaths = polygonManager.normalizePaths(initialLocationData.components.polygon);
        if (sessionPolygonPaths) {
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Calculate polygon center for initial positioning
          const center = polygonManager.calculateCenter(sessionPolygonPaths);
          if (center) {
            initialCenter = center;
            logSuccess('Using polygon center for initial position', center);
          }
        }
      }

      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Initialize map
      map = new window.google.maps.Map(document.getElementById(containerId), {
        center: initialCenter,
        zoom: initialZoom,
        streetViewControl: false,
        mapTypeControl: false
      });
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Initialize marker
      marker = new window.google.maps.Marker({
        position: initialCenter,
        map,
        draggable: true
      });
      marker.addListener('dragend', handleMarkerDragEnd);
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Add map click listener
      map.addListener('click', handleMapClick);
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Setup detect location button
      const detectBtn = document.getElementById(detectBtnId);
      if (detectBtn) detectBtn.addEventListener('click', handleDetectLocation);
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Setup form submit handler
      const formEl = document.getElementById(formId);
      if (formEl) formEl.addEventListener('submit', handleFormSubmit);
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Setup event listeners for coordination
      setupEventListeners();
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Setup popup handlers
      setupPopupHandlers();

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Draw polygon if available
      if (sessionPolygonPaths) {
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Draw polygon after map is ready
        map.addListener('idle', () => {
          if (sessionPolygonPaths && !polygonManager.getPolygon()) {
            polygonManager.drawPolygon(sessionPolygonPaths, map);
          }
        });
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Also try drawing immediately
        setTimeout(() => {
          if (sessionPolygonPaths && !polygonManager.getPolygon()) {
            polygonManager.drawPolygon(sessionPolygonPaths, map);
          }
        }, 200);
      } else {
        logWarn('No polygon data available in session', {
          hasInitialLocationData: !!initialLocationData,
          hasComponents: !!initialLocationData?.components,
          hasPolygon: !!initialLocationData?.components?.polygon
        });
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] If we have coordinates from session, update state
      if (initialLocationData && initialLocationData.latitude && initialLocationData.longitude) {
        const lat = Number(initialLocationData.latitude);
        const lng = Number(initialLocationData.longitude);
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Only use session coordinates if polygon center is not available
        // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [maps.js] CRITICAL: Polygon center takes precedence for initial positioning
        if (!sessionPolygonPaths || !polygonManager.getCenter()) {
          stateManager.setCoordinates(lat, lng);
          stateManager.set('lastValidPosition', { lat, lng });
          stateManager.set('initialSelectedCenter', { lat, lng });
          
          stateManager.setFormData({
            placeId: initialLocationData.placeId || '',
            fullAddress: initialLocationData.fullAddress || '',
            city: initialLocationData.components?.city || initialLocationData.city || '',
            country: initialLocationData.components?.country || initialLocationData.country || 'United Arab Emirates',
            latitude: initialLocationData.latitude.toString(),
            longitude: initialLocationData.longitude.toString(),
            isValidUAE: isUAE(initialLocationData.components?.country || initialLocationData.country || 'United Arab Emirates'),
            hasFullAddress: Boolean((initialLocationData.fullAddress || '').trim())
          });
          
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Reverse geocode to get full address details
          reverseGeocodeAndUpdateForm(lat, lng);
        }
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Mark as initialized
      stateManager.set('isInitialized', true);
      
      logSuccess('Map initialized successfully with event-driven architecture');
    }).catch(err => {
      setError(errorMsgId, err?.message || 'Google Maps failed to load');
      logError('Google Maps initialization failed', err);
    });
  }

  global.initLocationFinderMap = initLocationFinderMap;
})(window);
