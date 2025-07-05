// Google Maps + Autocomplete Location Finder (vanilla JS)
(function(global) {
// Clear (X) button logic for autocomplete input
  document.addEventListener('DOMContentLoaded', function() {
    var lfInput = document.getElementById('lf-autocomplete-input');
    var lfClearBtn = document.getElementById('lf-clear-btn');
    if (lfInput && lfClearBtn) {
      lfClearBtn.addEventListener('click', function() {
        lfInput.value = '';
        lfInput.focus();
        // Optionally, trigger input event for autocomplete to update suggestions
        var event = new Event('input', { bubbles: true });
        lfInput.dispatchEvent(event);
      });
    }
  });
    function loadGoogleMaps(apiKey, libraries = 'places') {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) return resolve(window.google.maps);
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}`;
        script.async = true;
        script.onerror = reject;
        script.onload = () => {
          if (window.google && window.google.maps) resolve(window.google.maps);
          else reject(new Error('Google Maps failed to load'));
        };
        document.head.appendChild(script);
      });
    }
  
    function getDefaultCenter() {
      return { lat: 25.2048, lng: 55.2708 };
    }
  
    function isUAE(country) {
      return country === 'United Arab Emirates';
    }
  
    function setText(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value || '';
    }
  
    function setInputValue(id, value) {
      var el = document.getElementById(id);
      if (el) el.value = value || '';
    }
  
    function setError(id, msg) {
      var el = document.getElementById(id);
      if (el) el.textContent = msg || '';
    }
  
    function setBtnDisabled(id, disabled) {
      var el = document.getElementById(id);
      if (el) el.disabled = !!disabled;
    }
  
    function initLocationFinderMap(options) {
      // Required options
      const {
        apiKey,
        containerId,
        autocompleteInputId,
        detectBtnId,
        formId,
        confirmBtnId,
        displayFields = {},
        hiddenFields = {},
        errorMsgId
      } = options;
      // State
      let form = {
        placeId: '', fullAddress: '', city: '', country: '',
        latitude: getDefaultCenter().lat.toString(),
        longitude: getDefaultCenter().lng.toString(),
      };
      let isValidUAE = false;
      let hasFullAddress = false;
      let map, marker, autocomplete, geocoder;
  
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
        // Update confirm button label and enabled state
        var confirmBtn = document.getElementById(confirmBtnId);
        var confirmLabel = document.getElementById('lf-confirm-label');
        if (confirmBtn && confirmLabel) {
          if (!form.fullAddress || !hasFullAddress) {
            confirmBtn.disabled = true;
            confirmBtn.classList.remove('btn-active'); // 🔵🔵🔵 Remove active class when no location selected
            confirmLabel.innerHTML = 'KINDLY CHOOSE A LOCATION';
          } else {
            confirmBtn.disabled = !(form.latitude && form.longitude && isValidUAE && hasFullAddress);
            confirmBtn.classList.add('btn-active'); // ✅✅✅ Add active class when location is populated
            confirmLabel.innerHTML = `<span>${form.fullAddress}</span><br><strong>CONFIRM</strong>`;
          }
        }
      }
  
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
  
      function reverseGeocodeAndUpdateForm(lat, lng) {
        if (!geocoder) return;
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
          } else {
            form.latitude = lat.toString();
            form.longitude = lng.toString();
            isValidUAE = false;
            hasFullAddress = false;
            syncDisplay();
          }
        });
      }
  
      function handleAutocompletePlaceChanged() {
        const place = autocomplete.getPlace();
        if (!place?.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        updateLocationDetails(place, {}, false);
        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
      }
  
      function handleDetectLocation() {
        setError(errorMsgId, '');
        if (!navigator.geolocation) return setError(errorMsgId, 'Geolocation is not supported by your browser.');
        setBtnDisabled(detectBtnId, true);
        setText(detectBtnId, 'Detecting...');
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            form.latitude = coords.latitude.toString();
            form.longitude = coords.longitude.toString();
            marker.setPosition({ lat: coords.latitude, lng: coords.longitude });
            map.setCenter({ lat: coords.latitude, lng: coords.longitude });
            reverseGeocodeAndUpdateForm(coords.latitude, coords.longitude);
            setBtnDisabled(detectBtnId, false);
            setText(detectBtnId, 'Detect My Location');
          },
          () => {
            setError(errorMsgId, 'Unable to retrieve your location.');
            setBtnDisabled(detectBtnId, false);
            setText(detectBtnId, 'Detect My Location');
          }
        );
      }
  
      function handleMapClick(e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        reverseGeocodeAndUpdateForm(lat, lng);
      }
  
      function handleMarkerDragEnd(e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        reverseGeocodeAndUpdateForm(lat, lng);
      }
  
      function handleFormSubmit(e) {
        // 🟡🟡🟡 - [LOCATION FORM] Always prevent default HTML submission
        e.preventDefault();
        
        // Validate before submit
        if (!(form.latitude && form.longitude && isValidUAE && hasFullAddress)) {
          setError(errorMsgId, 'Please select a valid UAE location and address.');
          return false;
        }
        setError(errorMsgId, '');
        
        // 🟡🟡🟡 - [LOCATION FORM] Use AJAX submission to handle redirect properly
        console.log('🟡🟡🟡 - [LOCATION FORM] Submitting location data via AJAX');
        
        // Get the form element and its action URL
        const formEl = document.getElementById(formId);
        const actionUrl = formEl.action;
        
        // Show loading state on confirm button
        const confirmBtn = document.getElementById(confirmBtnId);
        const confirmLabel = document.getElementById('lf-confirm-label');
        const originalBtnText = confirmLabel.innerHTML;
        
        confirmBtn.disabled = true;
        confirmLabel.innerHTML = 'Processing...';
        
        // Prepare form data
        const formData = {
          placeId: form.placeId,
          fullAddress: form.fullAddress,
          city: form.city,
          country: form.country,
          latitude: form.latitude,
          longitude: form.longitude
        };
        
        console.log('🟡🟡🟡 - [LOCATION FORM] Submitting data:', formData);
        
        // Make AJAX request
        fetch(actionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
          credentials: 'same-origin' // Include session cookies
        })
        .then(response => {
          console.log('🟡🟡🟡 - [LOCATION FORM] Server response status:', response.status);
          return response.json();
        })
        .then(result => {
          console.log('🟡🟡🟡 - [LOCATION FORM] Server response:', result);
          
          if (result.success) {
            console.log('✅✅✅ - [LOCATION FORM] Location submission successful');
            
            // Show success message briefly
            confirmLabel.innerHTML = 'Checking location, please wait...';
            
            // Redirect to next step after brief delay
            setTimeout(() => {
              console.log('✅✅✅ - [LOCATION FORM] Redirecting to:', result.nextStep);
              window.location.href = result.nextStep;
            }, 1000);
            
          } else {
            console.log('❗❗❗ - [LOCATION FORM] Location submission failed');
            
            // Reset button and show error
            confirmBtn.disabled = false;
            confirmLabel.innerHTML = originalBtnText;
            setError(errorMsgId, result.message || 'Failed to save location. Please try again.');
          }
        })
        .catch(error => {
          console.error('❌❌❌ - [LOCATION FORM] Network or parsing error:', error);
          
          // Reset button and show error
          confirmBtn.disabled = false;
          confirmLabel.innerHTML = originalBtnText;
          setError(errorMsgId, 'Network error occurred. Please check your connection and try again.');
        });
        
        return false;
      }
  
      // Load Google Maps and initialize
      loadGoogleMaps(apiKey).then(() => {
        geocoder = new window.google.maps.Geocoder();
        // Map
        map = new window.google.maps.Map(document.getElementById(containerId), {
          center: getDefaultCenter(),
          zoom: 15,
          streetViewControl: false,
          mapTypeControl: false
        });
        // Marker
        marker = new window.google.maps.Marker({
          position: getDefaultCenter(),
          map,
          draggable: true
        });
        marker.addListener('dragend', handleMarkerDragEnd);
        // Map click
        map.addListener('click', handleMapClick);
        // Autocomplete
        const input = document.getElementById(autocompleteInputId);
        autocomplete = new window.google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: 'AE' },
          fields: ['geometry', 'address_components', 'formatted_address', 'place_id']
        });
        autocomplete.addListener('place_changed', handleAutocompletePlaceChanged);
        // Detect location
        var detectBtn = document.getElementById(detectBtnId);
        if (detectBtn) detectBtn.addEventListener('click', handleDetectLocation);
        // Form submit
        var formEl = document.getElementById(formId);
        if (formEl) formEl.addEventListener('submit', handleFormSubmit);
        // Initial sync
        syncDisplay();
      }).catch(err => {
        setError(errorMsgId, err?.message || 'Google Maps failed to load');
      });
    }
  
    global.initLocationFinderMap = initLocationFinderMap;
  })(window);