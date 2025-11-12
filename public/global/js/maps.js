// 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Google Maps Location Finder (autocomplete removed - location now comes from delivery-locations page)
(function(global) {
  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to load Google Maps API (places library no longer needed)
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

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to set text content
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || '';
  }

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to set input value
  function setInputValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value || '';
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

  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Main function to initialize location finder map
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
      initialLocationData = null // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Location data from session (set by delivery-locations page)
    } = options;

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] State management
    let form = {
      placeId: '',
      fullAddress: '',
      city: '',
      country: '',
      latitude: '',
      longitude: '',
    };
    let isValidUAE = false;
    let hasFullAddress = false;
    let map, marker, geocoder;
    
    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Geofence state: store last valid position and selected area info
    let lastValidPosition = null; // { lat, lng }
    let initialSelectedCenter = null; // { lat, lng } - the canonical center of the user's selected area
    let selectedDistrict = null;
    let selectedSublocality = null;
    let isValidationInProgress = false;
    let selectedAreaCircle = null; // Google Maps Circle overlay for visual boundary
    let selectedAreaBoundaryRadiusMeters = 1000; // Default boundary radius in meters
    let selectedAreaPolygon = null; // Google Maps Polygon overlay for exact boundary (if available)

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to sync form state to display and hidden fields
    function syncDisplay() {
      if (displayFields.city) setText(displayFields.city, form.city);
      if (displayFields.country) setText(displayFields.country, form.country);
      if (displayFields.latitude) setText(displayFields.latitude, form.latitude);
      if (displayFields.longitude) setText(displayFields.longitude, form.longitude);
      if (hiddenFields.placeId) setInputValue(hiddenFields.placeId, form.placeId);
      if (hiddenFields.fullAddress) setInputValue(hiddenFields.fullAddress, form.fullAddress);
      if (hiddenFields.city) setInputValue(hiddenFields.city, form.city);
      if (hiddenFields.country) setInputValue(hiddenFields.country, form.country);
      if (hiddenFields.latitude) setInputValue(hiddenFields.latitude, form.latitude);
      if (hiddenFields.longitude) setInputValue(hiddenFields.longitude, form.longitude);
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Update confirm button label and enabled state
      var confirmBtn = document.getElementById(confirmBtnId);
      var confirmLabel = document.getElementById('lf-confirm-label');
      if (confirmBtn && confirmLabel) {
        if (!form.fullAddress || !hasFullAddress) {
          confirmBtn.disabled = true;
          confirmBtn.classList.remove('btn-active');
          confirmLabel.innerHTML = 'KINDLY CHOOSE A LOCATION';
        } else {
          confirmBtn.disabled = !(form.latitude && form.longitude && isValidUAE && hasFullAddress);
          confirmBtn.classList.add('btn-active');
          confirmLabel.innerHTML = `<span>${form.fullAddress}</span><br><strong>CONFIRM</strong>`;
        }
      }
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to update location details from Google Places result
    function updateLocationDetails(place, compMap = {}, useMarker = false) {
      if (!Object.keys(compMap).length && place.address_components) {
        place.address_components.forEach(c => c.types.forEach(t => compMap[t] = c.long_name));
      }
      const street = compMap.route ? `${compMap.street_number || ''} ${compMap.route}`.trim() : '';
      const city = compMap.locality || compMap.postal_town || '';
      const country = compMap.country || '';
      const address = place.formatted_address || `${street}, ${city}, ${country}`.trim();
      let lat, lng;
      if (useMarker && marker && marker.getPosition()) {
        lat = marker.getPosition().lat();
        lng = marker.getPosition().lng();
      } else {
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
      }
      form = {
        placeId: place.place_id || '',
        fullAddress: address,
        city,
        country,
        latitude: lat.toString(),
        longitude: lng.toString(),
      };
      isValidUAE = isUAE(country);
      hasFullAddress = Boolean(address.trim());
      syncDisplay();
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to reverse geocode coordinates to address
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
          isValidUAE = isUAE(country);
          hasFullAddress = Boolean(fullAddress.trim());
          updateLocationDetails(place, compMap, true);
          logSuccess('Reverse geocoding successful', { fullAddress, country });
        } else {
          form.latitude = lat.toString();
          form.longitude = lng.toString();
          isValidUAE = false;
          hasFullAddress = false;
          syncDisplay();
          logError('Reverse geocoding failed', { status, lat, lng });
        }
      });
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to geocode address string to coordinates
    function geocodeAddress(address) {
      if (!geocoder) {
        logError('Geocoder not initialized');
        return Promise.reject(new Error('Geocoder not initialized'));
      }
      logInfo('Geocoding address', { address });
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address, componentRestrictions: { country: 'AE' } }, (results, status) => {
          if (status === 'OK' && results?.length) {
            const place = results[0];
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            logSuccess('Address geocoded successfully', { address, lat, lng });
            resolve({ place, lat, lng });
          } else {
            logError('Address geocoding failed', { status, address });
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
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
      setText(detectBtnId, 'Detecting...');
      logInfo('Detecting user location');
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const lat = coords.latitude;
          const lng = coords.longitude;
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validate detected location against selected area
          const validation = await validateCoordinatesAgainstArea(lat, lng);
          
          if (!validation.valid) {
            logWarn('Detected location outside selected area - recentering', { lat, lng });
            recenterToLastValidPosition();
            showBoundaryViolationPopup();
            setBtnDisabled(detectBtnId, false);
            setText(detectBtnId, 'Detect My Location');
            setError(errorMsgId, 'Detected location is outside your selected delivery area.');
            return;
          }
          
          // Valid location - update marker and store as last valid position
          form.latitude = lat.toString();
          form.longitude = lng.toString();
          marker.setPosition({ lat, lng });
          map.setCenter({ lat, lng });
          lastValidPosition = { lat, lng };
          reverseGeocodeAndUpdateForm(lat, lng);
          setBtnDisabled(detectBtnId, false);
          setText(detectBtnId, 'Detect My Location');
          logSuccess('User location detected', { lat, lng });
        },
        (err) => {
          setError(errorMsgId, 'Unable to retrieve your location.');
          setBtnDisabled(detectBtnId, false);
          setText(detectBtnId, 'Detect My Location');
          logError('Geolocation error', err);
        }
      );
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Function to validate coordinates against selected delivery area
    async function validateCoordinatesAgainstArea(lat, lng) {
      if (!selectedDistrict && !selectedSublocality) {
        logInfo('No selected area to validate against - allowing any location');
        return { valid: true };
      }

      if (isValidationInProgress) {
        logInfo('Validation already in progress - skipping');
        return { valid: true }; // Allow during validation to prevent blocking
      }

      isValidationInProgress = true;
      logInfo('Validating coordinates against selected area', { lat, lng, selectedDistrict, selectedSublocality });

      try {
        const response = await fetch(`/api/geo/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
        const data = await response.json();

        if (!data.success) {
          logError('Reverse geocoding failed during validation', data);
          isValidationInProgress = false;
          return { valid: true }; // Allow on API failure to prevent blocking
        }

        const actualDistrict = data.district || null;
        const actualSublocality = data.sublocality || null;

        logInfo('Validation result', { actualDistrict, actualSublocality, selectedDistrict, selectedSublocality });

        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] If we can't get district/sublocality from reverse geocoding, 
        // we can't validate, so we'll allow it (server will do final validation)
        // But if we have selected area and got null results, it's likely outside the area
        if ((selectedDistrict || selectedSublocality) && !actualDistrict && !actualSublocality) {
          logWarn('Reverse geocoding returned no district/sublocality - cannot validate client-side, will rely on server validation');
          isValidationInProgress = false;
          return { valid: true, actualDistrict: null, actualSublocality: null }; // Allow but server will validate
        }

        // Check if district and sublocality match
        const districtMatches = !selectedDistrict || (actualDistrict && actualDistrict.toLowerCase().trim() === selectedDistrict.toLowerCase().trim());
        const sublocalityMatches = !selectedSublocality || (actualSublocality && actualSublocality.toLowerCase().trim() === selectedSublocality.toLowerCase().trim());

        const isValid = districtMatches && sublocalityMatches;

        if (!isValid) {
          logWarn('Location validation failed - coordinates do not match selected area', {
            expectedDistrict: selectedDistrict,
            expectedSublocality: selectedSublocality,
            actualDistrict,
            actualSublocality
          });
        } else {
          logSuccess('Location validation passed - coordinates match selected area');
        }

        isValidationInProgress = false;
        return { valid: isValid, actualDistrict, actualSublocality };
      } catch (err) {
        logError('Error validating coordinates', err);
        isValidationInProgress = false;
        return { valid: true }; // Allow on error to prevent blocking
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Function to show boundary violation popup
    function showBoundaryViolationPopup() {
      const popup = document.getElementById('boundary-violation-popup');
      if (popup) {
        // Update selected area text
        const areaTextEl = document.getElementById('popup-selected-area');
        if (areaTextEl) {
          const areaParts = [];
          if (selectedSublocality) areaParts.push(selectedSublocality);
          if (selectedDistrict) areaParts.push(selectedDistrict);
          areaTextEl.textContent = areaParts.length > 0 ? areaParts.join(', ') : 'your selected area';
        }
        
        popup.style.display = 'block';
        logInfo('Boundary violation popup shown', { selectedDistrict, selectedSublocality });
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Emphasize boundary visually on violation
        setSelectedAreaBoundaryViolation(true);
        
        // Auto-dismiss after 10 seconds if user doesn't interact
        setTimeout(() => {
          if (popup.style.display === 'block') {
            popup.style.display = 'none';
            setSelectedAreaBoundaryViolation(false);
            logInfo('Boundary violation popup auto-dismissed');
          }
        }, 20000);
      } else {
        logError('Boundary violation popup element not found');
      }
    }
    
    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Function to setup popup button handlers
    function setupBoundaryPopupHandlers() {
      const reselectBtn = document.getElementById('boundary-popup-reselect-btn');
      const dismissBtn = document.getElementById('boundary-popup-dismiss-btn');
      const popup = document.getElementById('boundary-violation-popup');
      
      if (reselectBtn) {
        reselectBtn.addEventListener('click', () => {
          logInfo('User clicked "Change My Area" - redirecting to delivery-location');
          window.location.href = '/delivery-location';
        });
      }
      
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          if (popup) {
            // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] On dismiss, reset pin to the user's selected area (prefer initialSelectedCenter, fallback to last valid)
            recenterToSelectedArea();
            // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Reset boundary style to normal upon acknowledgement
            setSelectedAreaBoundaryViolation(false);
            popup.style.display = 'none';
            logInfo('User dismissed boundary violation popup');
          }
        });
      }
    }

    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Function to draw/update the visual boundary for the selected area
    function drawSelectedAreaBoundary() {
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Prefer canonical selected center; fallback to last valid position
      const center = initialSelectedCenter || lastValidPosition;
      if (!map || !center) {
        logWarn('Selected area boundary not drawn - map or center missing', { hasMap: !!map, hasCenter: !!center, initialSelectedCenter, lastValidPosition });
        return;
      }
      if (selectedAreaCircle) {
        selectedAreaCircle.setMap(null);
        selectedAreaCircle = null;
      }
      selectedAreaCircle = new window.google.maps.Circle({
        strokeColor: '#2E7D32',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#66BB6A',
        fillOpacity: 0.15,
        map,
        center: center,
        radius: Number(selectedAreaBoundaryRadiusMeters) || 1000,
        clickable: false
      });
      logSuccess('Selected area boundary drawn', { center, radiusMeters: selectedAreaBoundaryRadiusMeters });
    }

    // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Coordinate order configuration
    // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Set to 'lng-lat' if DB stores coordinates as [longitude, latitude] (e.g., [54.37, 24.46])
    // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Set to 'lat-lng' if DB stores coordinates as [latitude, longitude] (e.g., [24.46, 54.37])
    // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Set to 'auto' to auto-detect based on value ranges (default, most flexible)
    const POLYGON_COORDINATE_ORDER = 'auto'; // Options: 'lng-lat', 'lat-lng', 'auto'
    
    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Helper to normalize polygon paths from various formats
    function normalizePolygonPaths(raw) {
      if (!Array.isArray(raw)) {
        logWarn('Polygon data is not an array', { raw });
        return null;
      }
      if (raw.length < 3) {
        logWarn('Polygon has insufficient points', { count: raw.length });
        return null;
      }
      
      const points = [];
      raw.forEach((entry, index) => {
        if (Array.isArray(entry) && entry.length >= 2) {
          const first = Number(entry[0]);
          const second = Number(entry[1]);
          if (!Number.isFinite(first) || !Number.isFinite(second)) {
            logWarn('Skipped polygon entry with invalid numeric pair', { index, entry });
            return;
          }
          
          // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Normalize coordinate order based on configuration
          let lat, lng;
          
          if (POLYGON_COORDINATE_ORDER === 'lng-lat') {
            // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Force [lng, lat] interpretation: first is longitude, second is latitude
            lng = first;
            lat = second;
          } else if (POLYGON_COORDINATE_ORDER === 'lat-lng') {
            // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Force [lat, lng] interpretation: first is latitude, second is longitude
            lat = first;
            lng = second;
          } else {
            // 2025-11-12T00:00:00Z 🟡🟡🟡 - [maps.js] Auto-detect coordinate order: lat is -90 to 90, lng is -180 to 180
            // For UAE: lng ~54, lat ~24, so [lng, lat] format is [54, 24]
            if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
              // [lat, lng] format: first is lat (-90 to 90), second is lng (>90 for UAE)
              lat = first;
              lng = second;
            } else if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
              // [lng, lat] format: first is lng (>90 for UAE), second is lat (-90 to 90)
              lng = first;
              lat = second;
            } else {
              // Ambiguous - assume [lng, lat] for UAE coordinates (most common format)
              lng = first;
              lat = second;
              logInfo('Ambiguous coordinate order, assuming [lng, lat]', { first, second, index });
            }
          }
          
          points.push({ lat, lng });
          if (index < 3) {
            logInfo('Normalized polygon point', { index, original: entry, normalized: { lat, lng }, order: POLYGON_COORDINATE_ORDER });
          }
        } else if (entry && typeof entry === 'object') {
          const lat = Number(entry.lat ?? entry.latitude);
          const lng = Number(entry.lng ?? entry.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            points.push({ lat, lng });
            if (index < 3) {
              logInfo('Normalized polygon point from object', { index, normalized: { lat, lng } });
            }
          } else {
            logWarn('Skipped polygon entry with invalid lat/lng object', { index, entry });
          }
        } else {
          logWarn('Skipped polygon entry with unsupported format', { index, entry });
        }
      });
      
      if (points.length < 3) {
        logWarn('Polygon normalization resulted in insufficient points', { originalCount: raw.length, normalizedCount: points.length });
        return null;
      }
      
      logSuccess('Polygon paths normalized', { originalCount: raw.length, normalizedCount: points.length, firstPoint: points[0], lastPoint: points[points.length - 1], order: POLYGON_COORDINATE_ORDER });
      return points;
    }

    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Function to draw polygon boundary (if available)
    function drawSelectedAreaPolygon(paths) {
      try {
        if (!map) {
          logError('Cannot draw polygon - map not initialized');
          return;
        }
        if (!Array.isArray(paths) || paths.length < 3) {
          logError('Cannot draw polygon - invalid paths', { numPoints: Array.isArray(paths) ? paths.length : 0, paths });
          return;
        }
        
        logInfo('Drawing polygon with paths', { numPoints: paths.length, firstPath: paths[0], lastPath: paths[paths.length - 1] });
        
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Remove existing polygon if any
        if (selectedAreaPolygon) {
          selectedAreaPolygon.setMap(null);
          selectedAreaPolygon = null;
          logInfo('Removed existing polygon');
        }
        
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Convert paths to LatLng objects for Google Maps
        const googlePaths = paths.map(function(point) {
          return new window.google.maps.LatLng(point.lat, point.lng);
        });
        
        logInfo('Converted paths to Google Maps LatLng', { numPoints: googlePaths.length });
        
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Create polygon with visible styling
        selectedAreaPolygon = new window.google.maps.Polygon({
          paths: googlePaths,
          strokeColor: '#1565C0',
          strokeOpacity: 0.9,
          strokeWeight: 3,
          fillColor: '#42A5F5',
          fillOpacity: 0.25,
          map: map,
          clickable: false,
          zIndex: 1,
        });
        
        logSuccess('Polygon created and added to map', { 
          numPoints: paths.length,
          polygonExists: !!selectedAreaPolygon,
          polygonOnMap: selectedAreaPolygon.getMap() === map
        });
        
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Bounds fitting is handled by the caller (geocoding callback or idle listener)
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] This prevents conflicts when geocoding completes and recenters the map
        
      } catch (err) {
        logError('Failed to draw polygon', { error: err, message: err?.message, stack: err?.stack });
      }
    }

    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Helper: check if a lat/lng is within the polygon
    function isWithinSelectedPolygon(lat, lng) {
      try {
        if (!selectedAreaPolygon || !window.google?.maps?.geometry?.poly?.containsLocation) {
          return false;
        }
        const point = new window.google.maps.LatLng(lat, lng);
        const within = window.google.maps.geometry.poly.containsLocation(point, selectedAreaPolygon);
        logInfo('Polygon containsLocation check', { within });
        return within;
      } catch (err) {
        logError('Polygon containment check failed', err);
        return false;
      }
    }

    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Function to toggle boundary style when in violation
    function setSelectedAreaBoundaryViolation(isViolation) {
      if (selectedAreaCircle) {
        if (isViolation) {
          selectedAreaCircle.setOptions({
            strokeColor: '#C62828',
            fillColor: '#EF5350',
            fillOpacity: 0.2
          });
        } else {
          selectedAreaCircle.setOptions({
            strokeColor: '#2E7D32',
            fillColor: '#66BB6A',
            fillOpacity: 0.15
          });
        }
      }
      if (selectedAreaPolygon) {
        if (isViolation) {
          selectedAreaPolygon.setOptions({
            strokeColor: '#C62828',
            fillColor: '#EF5350',
            fillOpacity: 0.15
          });
        } else {
          selectedAreaPolygon.setOptions({
            strokeColor: '#1565C0',
            fillColor: '#42A5F5',
            fillOpacity: 0.12
          });
        }
      }
      logInfo(isViolation ? 'Boundary style set to violation state' : 'Boundary style reset to normal');
    }

    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Helper: check if a lat/lng is within the visual boundary circle
    function isWithinVisualBoundary(lat, lng) {
      try {
        if (!selectedAreaCircle || !window.google?.maps?.geometry?.spherical) {
          logWarn('Visual boundary check unavailable - circle or geometry library missing');
          return false;
        }
        const center = selectedAreaCircle.getCenter();
        const point = new window.google.maps.LatLng(lat, lng);
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(center, point);
        const within = distance <= selectedAreaCircle.getRadius();
        logInfo('Computed distance to boundary center', { distanceMeters: Math.round(distance), radiusMeters: selectedAreaCircle.getRadius(), within });
        return within;
      } catch (err) {
        logError('Failed to compute visual boundary distance', err);
        return false;
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Function to recenter marker to last valid position
    function recenterToLastValidPosition() {
      if (lastValidPosition) {
        logInfo('Recentering marker to last valid position', lastValidPosition);
        marker.setPosition(lastValidPosition);
        map.setCenter(lastValidPosition);
        reverseGeocodeAndUpdateForm(lastValidPosition.lat, lastValidPosition.lng);
      } else {
        logWarn('No last valid position to recenter to');
      }
    }

    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Function to recenter marker to the selected area's canonical center (fallback to last valid)
    function recenterToSelectedArea() {
      if (initialSelectedCenter) {
        logInfo('Recentering marker to initial selected area center', initialSelectedCenter);
        marker.setPosition(initialSelectedCenter);
        map.setCenter(initialSelectedCenter);
        reverseGeocodeAndUpdateForm(initialSelectedCenter.lat, initialSelectedCenter.lng);
      } else {
        logWarn('Initial selected area center not available, falling back to last valid position');
        recenterToLastValidPosition();
      }
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle map click
    async function handleMapClick(e) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validate coordinates before updating
      const validation = await validateCoordinatesAgainstArea(lat, lng);
      
      if (!validation.valid) {
        logWarn('Map click outside selected area - recentering', { lat, lng });
        recenterToLastValidPosition();
        showBoundaryViolationPopup();
        return;
      }
      
      // Valid (or tentatively valid) location - update marker and store as last valid position
      marker.setPosition({ lat, lng });
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Update lastValidPosition if:
      // - validation confirmed area match (district or sublocality present), OR
      // - there is no selected area, OR
      // - the point is within the visual boundary circle (tentative client acceptance; server remains final arbiter)
      if (
        (validation.actualDistrict || validation.actualSublocality) ||
        (!selectedDistrict && !selectedSublocality) ||
        isWithinSelectedPolygon(lat, lng) ||
        isWithinVisualBoundary(lat, lng)
      ) {
        lastValidPosition = { lat, lng };
        logSuccess('Updated last valid position from map click', lastValidPosition);
      } else {
        logWarn('Skipping update of last valid position due to uncertain validation result (null district/sublocality)');
      }
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Reset boundary styling on valid move
      setSelectedAreaBoundaryViolation(false);
      reverseGeocodeAndUpdateForm(lat, lng);
      logInfo('Map clicked', { lat, lng });
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle marker drag end
    async function handleMarkerDragEnd(e) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Validate coordinates before updating
      const validation = await validateCoordinatesAgainstArea(lat, lng);
      
      if (!validation.valid) {
        logWarn('Marker dragged outside selected area - recentering', { lat, lng });
        recenterToLastValidPosition();
        showBoundaryViolationPopup();
        return;
      }
      
      // Valid (or tentatively valid) location - update marker and store as last valid position
      marker.setPosition({ lat, lng });
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Update lastValidPosition if confirmed or within visual boundary
      if (
        (validation.actualDistrict || validation.actualSublocality) ||
        (!selectedDistrict && !selectedSublocality) ||
        isWithinSelectedPolygon(lat, lng) ||
        isWithinVisualBoundary(lat, lng)
      ) {
        lastValidPosition = { lat, lng };
        logSuccess('Updated last valid position from marker drag', lastValidPosition);
      } else {
        logWarn('Skipping update of last valid position due to uncertain validation result (null district/sublocality)');
      }
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Reset boundary styling on valid move
      setSelectedAreaBoundaryViolation(false);
      reverseGeocodeAndUpdateForm(lat, lng);
      logInfo('Marker dragged', { lat, lng });
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle form submission
    function handleFormSubmit(e) {
      e.preventDefault();
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Validate before submit
      if (!(form.latitude && form.longitude && isValidUAE && hasFullAddress)) {
        setError(errorMsgId, 'Please select a valid UAE location and address.');
        logError('Form validation failed', form);
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
            recenterToSelectedArea();
            showBoundaryViolationPopup();
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

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Load Google Maps and initialize
    loadGoogleMaps(apiKey).then(() => {
      geocoder = new window.google.maps.Geocoder();
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Determine initial center - use session data if available, otherwise use UAE default
      let initialCenter = { lat: 25.2048, lng: 55.2708 }; // Default to Dubai, UAE
      let initialZoom = 15;
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Initialize selected area from session data for geofence validation
      if (initialLocationData) {
        selectedDistrict = initialLocationData.components?.district || null;
        selectedSublocality = initialLocationData.components?.sublocality || null;
        // 2025-11-11T00:00:00Z ⚪⚪⚪ - [maps.js] Optional boundary radius configuration from session components
        if (initialLocationData.components?.boundaryRadiusMeters) {
          selectedAreaBoundaryRadiusMeters = Number(initialLocationData.components.boundaryRadiusMeters) || 1000;
          logInfo('Initialized boundary radius from session components', { boundaryRadiusMeters: selectedAreaBoundaryRadiusMeters });
        } else {
          logInfo('Using default boundary radius', { boundaryRadiusMeters: selectedAreaBoundaryRadiusMeters });
        }
        logInfo('Initialized geofence area from session', { selectedDistrict, selectedSublocality });
      }
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] If we have initial location data from session, geocode it to get coordinates
      if (initialLocationData && initialLocationData.fullAddress) {
        logInfo('Initializing map with session location data', {
          fullAddress: initialLocationData.fullAddress,
          city: initialLocationData.components?.city || initialLocationData.city
        });
        
        // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] If coordinates already exist in session, use them
        if (initialLocationData.latitude && initialLocationData.longitude) {
          initialCenter = {
            lat: Number(initialLocationData.latitude),
            lng: Number(initialLocationData.longitude)
          };
          logSuccess('Using coordinates from session', initialCenter);
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Store initial position as last valid position
          lastValidPosition = { lat: initialCenter.lat, lng: initialCenter.lng };
            // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Also store as initial selected center
            initialSelectedCenter = { lat: initialCenter.lat, lng: initialCenter.lng };
          
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Populate form with session data
          form = {
            placeId: initialLocationData.placeId || '',
            fullAddress: initialLocationData.fullAddress || '',
            city: initialLocationData.components?.city || initialLocationData.city || '',
            country: initialLocationData.components?.country || initialLocationData.country || 'United Arab Emirates',
            latitude: initialLocationData.latitude.toString(),
            longitude: initialLocationData.longitude.toString(),
          };
          isValidUAE = isUAE(form.country);
          hasFullAddress = Boolean(form.fullAddress.trim());
        } else {
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Geocode the address to get coordinates
          geocodeAddress(initialLocationData.fullAddress)
            .then(({ place, lat, lng }) => {
              initialCenter = { lat, lng };
              // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Store geocoded position as last valid position
              lastValidPosition = { lat, lng };
                // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Also store as initial selected center
                initialSelectedCenter = { lat, lng };
              // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Update marker position first
              marker.setPosition(initialCenter);
              updateLocationDetails(place, {}, false);
              logSuccess('Map centered on geocoded address', { address: initialLocationData.fullAddress, lat, lng });
              
              // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Now that we have coordinates, draw the boundary (polygon or circle)
              // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Reset flag to allow redrawing after geocoding
              boundaryDrawn = false;
              
              // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Draw boundary after a short delay to ensure map is ready
              setTimeout(function() {
                if (typeof drawBoundaryOnce === 'function') {
                  drawBoundaryOnce();
                  
                  // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] If polygon was drawn, fit bounds to it (this will also center the map)
                  if (selectedAreaPolygon && sessionPolygonPaths) {
                    try {
                      const bounds = new window.google.maps.LatLngBounds();
                      sessionPolygonPaths.forEach(function(point) {
                        bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
                      });
                      map.fitBounds(bounds);
                      logSuccess('Map bounds fitted to polygon after geocoding', { bounds: bounds.toJSON() });
                    } catch (boundsErr) {
                      logWarn('Failed to fit bounds to polygon after geocoding', boundsErr);
                      // Fallback to setting center if bounds fitting fails
                      map.setCenter(initialCenter);
                    }
                  } else {
                    // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] No polygon, just center on the geocoded location
                    map.setCenter(initialCenter);
                  }
                }
              }, 300);
            })
            .catch((err) => {
              logError('Failed to geocode initial address, using default center', err);
              // Will use default center set above
            });
        }
      } else {
        logInfo('No initial location data, using default center', initialCenter);
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
      var detectBtn = document.getElementById(detectBtnId);
      if (detectBtn) detectBtn.addEventListener('click', handleDetectLocation);
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Setup form submit handler
      var formEl = document.getElementById(formId);
      if (formEl) formEl.addEventListener('submit', handleFormSubmit);
      
      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Setup boundary violation popup handlers
      setupBoundaryPopupHandlers();
      
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Draw polygon from session components (if available) - only source of truth, no API fetch
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Store polygon paths for later drawing after geocoding completes
      const sessionPolygonPaths = normalizePolygonPaths(initialLocationData?.components?.polygon);
      let boundaryDrawn = false;
      
      const drawBoundaryOnce = () => {
        if (boundaryDrawn) {
          logInfo('Boundary already drawn, skipping');
          return;
        }
        
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Only draw if we have a center (coordinates available)
        if (!initialSelectedCenter && !lastValidPosition) {
          logInfo('Waiting for coordinates before drawing boundary');
          return;
        }
        
        boundaryDrawn = true;
        
        if (sessionPolygonPaths) {
          logInfo('Drawing polygon from session components', { points: sessionPolygonPaths.length });
          drawSelectedAreaPolygon(sessionPolygonPaths);
          
          // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Fit bounds to polygon if coordinates are already available (no geocoding pending)
          // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] If geocoding is pending, bounds will be fitted in the geocoding callback
          if (initialSelectedCenter && selectedAreaPolygon) {
            setTimeout(function() {
              try {
                if (!selectedAreaPolygon || !map) return;
                const bounds = new window.google.maps.LatLngBounds();
                sessionPolygonPaths.forEach(function(point) {
                  bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
                });
                map.fitBounds(bounds);
                logSuccess('Map bounds fitted to polygon (coordinates already available)', { bounds: bounds.toJSON() });
              } catch (boundsErr) {
                logWarn('Failed to fit bounds to polygon', boundsErr);
              }
            }, 200);
          }
        } else {
          // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Fallback to circle only if polygon is not available in session
          const center = initialSelectedCenter || lastValidPosition;
          if (center) {
            logInfo('Drawing circle fallback', { center });
            drawSelectedAreaBoundary();
          } else {
            logWarn('Selected area boundary not drawn - no center available and no polygon in session');
          }
        }
      };
      
      // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] Draw boundary after map is idle AND we have coordinates
      if (map) {
        var idleListener = null;
        var drawAfterIdle = function() {
          drawBoundaryOnce();
        };
        
        idleListener = map.addListener('idle', drawAfterIdle);
        
        // 2025-11-11T00:00:00Z 🟡🟡🟡 - [maps.js] If coordinates already exist, try drawing immediately
        if (initialSelectedCenter) {
          setTimeout(function() {
            drawBoundaryOnce();
          }, 200);
        }
      }
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Initial sync of display
      syncDisplay();
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] If we have initial location data with coordinates, reverse geocode to update form
      if (initialLocationData && initialLocationData.latitude && initialLocationData.longitude) {
        const lat = Number(initialLocationData.latitude);
        const lng = Number(initialLocationData.longitude);
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Ensure last valid position is set
        if (!lastValidPosition) {
          lastValidPosition = { lat, lng };
        }
        // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Reverse geocode to get full address details
        reverseGeocodeAndUpdateForm(lat, lng);
      } else if (initialLocationData && initialLocationData.fullAddress && !initialLocationData.latitude) {
        // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] If we have address but no coordinates, geocode it
        geocodeAddress(initialLocationData.fullAddress)
          .then(({ place, lat, lng }) => {
            // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [maps.js] Store geocoded position as last valid position
            if (!lastValidPosition) {
              lastValidPosition = { lat, lng };
            }
            updateLocationDetails(place, {}, false);
          })
          .catch((err) => {
            logError('Failed to geocode initial address', err);
          });
      }
      
      logSuccess('Map initialized successfully');
    }).catch(err => {
      setError(errorMsgId, err?.message || 'Google Maps failed to load');
      logError('Google Maps initialization failed', err);
    });
  }

  global.initLocationFinderMap = initLocationFinderMap;
})(window);
