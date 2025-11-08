// 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Google Maps Location Finder (autocomplete removed - location now comes from delivery-locations page)
(function(global) {
  // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Helper function to load Google Maps API (places library no longer needed)
  function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve(window.google.maps);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
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
    function handleDetectLocation() {
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
        ({ coords }) => {
          form.latitude = coords.latitude.toString();
          form.longitude = coords.longitude.toString();
          marker.setPosition({ lat: coords.latitude, lng: coords.longitude });
          map.setCenter({ lat: coords.latitude, lng: coords.longitude });
          reverseGeocodeAndUpdateForm(coords.latitude, coords.longitude);
          setBtnDisabled(detectBtnId, false);
          setText(detectBtnId, 'Detect My Location');
          logSuccess('User location detected', { lat: coords.latitude, lng: coords.longitude });
        },
        (err) => {
          setError(errorMsgId, 'Unable to retrieve your location.');
          setBtnDisabled(detectBtnId, false);
          setText(detectBtnId, 'Detect My Location');
          logError('Geolocation error', err);
        }
      );
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle map click
    function handleMapClick(e) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      reverseGeocodeAndUpdateForm(lat, lng);
      logInfo('Map clicked', { lat, lng });
    }

    // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Function to handle marker drag end
    function handleMarkerDragEnd(e) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
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
              map.setCenter(initialCenter);
              marker.setPosition(initialCenter);
              updateLocationDetails(place, {}, false);
              logSuccess('Map centered on geocoded address', { address: initialLocationData.fullAddress, lat, lng });
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
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Initial sync of display
      syncDisplay();
      
      // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] If we have initial location data with coordinates, reverse geocode to update form
      if (initialLocationData && initialLocationData.latitude && initialLocationData.longitude) {
        const lat = Number(initialLocationData.latitude);
        const lng = Number(initialLocationData.longitude);
        // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] Reverse geocode to get full address details
        reverseGeocodeAndUpdateForm(lat, lng);
      } else if (initialLocationData && initialLocationData.fullAddress && !initialLocationData.latitude) {
        // 2025-11-07T00:00:00Z 🟡🟡🟡 - [maps.js] If we have address but no coordinates, geocode it
        geocodeAddress(initialLocationData.fullAddress)
          .then(({ place }) => {
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
