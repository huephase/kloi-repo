// 2025-11-07T00:00:00Z 🟡🟡🟡 Client script for delivery locations page with city + sublocality workflow
(function () {
  const now = () => new Date().toISOString();
  const logInfo = (message, payload) => console.log(`🟡🟡🟡 - [delivery-location.js ${now()}] ${message}`, payload ?? '');
  const logSuccess = (message, payload) => console.log(`✅✅✅ - [delivery-location.js ${now()}] ${message}`, payload ?? '');
  const logWarn = (message, payload) => console.warn(`⚠️⚠️⚠️ - [delivery-location.js ${now()}] ${message}`, payload ?? '');
  const logError = (message, payload) => console.error(`❗❗❗ - [delivery-location.js ${now()}] ${message}`, payload ?? '');

  const cityButtons = Array.from(document.querySelectorAll('.city-option'));
  const searchInput = document.getElementById('sublocalitySearch');
  const sublocalitySelect = document.getElementById('sublocalitySelect');
  const confirmBtn = document.getElementById('confirmSelectionBtn');
  const selectionStatus = document.getElementById('selectionStatus');
  const detectBtn = document.getElementById('detectLocationBtn');
  const detectStatus = document.getElementById('detectStatus');
  const deliveryDataScript = document.getElementById('delivery-data');

  if (!deliveryDataScript) {
    logError('Missing delivery data payload; aborting initialization');
    return;
  }

  let parsedData = [];
  try {
    parsedData = JSON.parse(deliveryDataScript.textContent || '[]');
    logSuccess('Parsed delivery data payload', { cities: parsedData.length });
  } catch (err) {
    logError('Failed to parse delivery data payload', err);
    return;
  }

  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    logWarn('No delivery cities available to initialize workflow');
    return;
  }

  let selectedCity = null;
  let filteredOptions = [];
  let selectedOption = null;

  function updateCityButtons(activeCity) {
    cityButtons.forEach((btn) => {
      const isActive = btn.dataset.city === activeCity?.city && btn.dataset.country === activeCity?.country;
      btn.classList.toggle('is-active', Boolean(isActive));
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function getCityByButton(button) {
    return parsedData.find((city) => city.city === button.dataset.city && city.country === button.dataset.country) || null;
  }

  function refreshOptions(filterTerm) {
    if (!selectedCity) {
      sublocalitySelect.innerHTML = '';
      confirmBtn.disabled = true;
      return;
    }

    const normalizedFilter = (filterTerm || '').trim().toLowerCase();
    const allOptions = selectedCity.combinedSublocalities || [];
    filteredOptions = normalizedFilter
      ? allOptions.filter((entry) => `${entry.district} ${entry.name}`.toLowerCase().includes(normalizedFilter))
      : allOptions.slice();

    sublocalitySelect.innerHTML = '';
    filteredOptions.forEach((entry) => {
      const optionEl = document.createElement('option');
      optionEl.value = `${entry.district}::${entry.name}`;
      optionEl.textContent = entry.name;
      optionEl.dataset.district = entry.district;
      optionEl.dataset.surcharge = String(entry.surcharge ?? 0);
      sublocalitySelect.appendChild(optionEl);
    });

    if (filteredOptions.length > 0) {
      sublocalitySelect.selectedIndex = 0;
      selectedOption = filteredOptions[0];
      confirmBtn.disabled = false;
      selectionStatus.textContent = `${filteredOptions[0].name}, ${selectedCity.city}`;
      logInfo('Sublocality options refreshed', { city: selectedCity.city, count: filteredOptions.length });
    } else {
      selectedOption = null;
      confirmBtn.disabled = true;
      selectionStatus.textContent = '';
      logInfo('No sublocality matches for filter', { filter: normalizedFilter });
    }
  }

  cityButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const city = getCityByButton(button);
      if (!city) {
        logError('City button clicked but no matching city data found', { cityLabel: button.dataset.city });
        return;
      }

      selectedCity = city;
      selectedOption = null;
      searchInput.value = '';
      selectionStatus.textContent = '';
      updateCityButtons(city);
      refreshOptions('');
      logSuccess('City selection updated', { city: city.city, districts: city.districts.length });
    });
  });

  // 2025-11-07T00:00:00Z Auto select the first city to streamline UX
  if (cityButtons.length > 0) {
    cityButtons[0].click();
  }

  searchInput?.addEventListener('input', (event) => {
    refreshOptions(event.target.value || '');
  });

  sublocalitySelect?.addEventListener('change', (event) => {
    const value = event.target.value;
    selectedOption = filteredOptions.find((entry) => `${entry.district}::${entry.name}` === value) || null;
    if (selectedOption) {
      confirmBtn.disabled = false;
      selectionStatus.textContent = `${selectedOption.name}, ${selectedCity.city}`;
      logSuccess('User selected sublocality from dropdown', { name: selectedOption.name, district: selectedOption.district });
    } else {
      confirmBtn.disabled = true;
      selectionStatus.textContent = '';
    }
  });

  async function persistSelection(payload) {
    if (window.KloiWizardProgress && typeof window.KloiWizardProgress.saveWizardStep === 'function') {
      return window.KloiWizardProgress.saveWizardStep('location', payload);
    }

    logInfo('Fallback save invoked because KloiWizardProgress is unavailable');

    const response = await fetch('/api/session/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: response.ok, json: await response.json() };
  }

  confirmBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    if (!selectedCity || !selectedOption) {
      selectionStatus.textContent = '';
      confirmBtn.disabled = true;
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.classList.add('is-loading');
    selectionStatus.textContent = `${selectedOption.name}, ${selectedCity.city}`;

    const polygon = Array.isArray(selectedOption.polygon) ? selectedOption.polygon : null;
    const payload = {
      fullAddress: `${selectedOption.name}, ${selectedOption.district}, ${selectedCity.city}`,
      components: {
        city: selectedCity.city,
        country: selectedCity.country,
        district: selectedOption.district,
        sublocality: selectedOption.name,
        surcharge: String(selectedOption.surcharge ?? 0),
        selectionSource: 'manual-dropdown',
        polygon,
        polygonSource: polygon ? 'delivery-locations-db' : undefined,
      },
    };

    try {
      const result = await persistSelection(payload);
      if (result && result.ok) {
        selectionStatus.textContent = `${selectedOption.name}, ${selectedCity.city}`;
        logSuccess('Location selection saved to session', payload);
        setTimeout(() => {
          // 2025-11-07T00:00:00Z 🟡🟡🟡 - [delivery-location.js] Redirect to location finder page (session data will be used)
          const redirectUrl = `/location`;
          window.location.href = redirectUrl;
        }, 400);
      } else {
        confirmBtn.disabled = false;
        selectionStatus.textContent = `${selectedOption.name}, ${selectedCity.city}`;
        logError('Failed to persist location selection', result?.json || result?.error);
      }
    } catch (err) {
      confirmBtn.disabled = false;
      selectionStatus.textContent = `${selectedOption.name}, ${selectedCity.city}`;
      logError('Unexpected error while saving selection', err);
    } finally {
      confirmBtn.classList.remove('is-loading');
    }
  });

  function attemptAutoSelect(district, sublocality) {
    if (!district || !sublocality) {
      return false;
    }

    let matchedCity = null;
    parsedData.forEach((city) => {
      const match = city.combinedSublocalities.find((entry) => entry.district === district && entry.name.toLowerCase() === sublocality.toLowerCase());
      if (match) {
        matchedCity = { city, entry: match };
      }
    });

    if (!matchedCity) {
      return false;
    }

    selectedCity = matchedCity.city;
    updateCityButtons(selectedCity);
    searchInput.value = '';
    refreshOptions('');

    const optionKey = `${matchedCity.entry.district}::${matchedCity.entry.name}`;
    const targetIndex = filteredOptions.findIndex((entry) => `${entry.district}::${entry.name}` === optionKey);
    if (targetIndex >= 0) {
      sublocalitySelect.selectedIndex = targetIndex;
      selectedOption = filteredOptions[targetIndex];
      confirmBtn.disabled = false;
      selectionStatus.textContent = `${selectedOption.name}, ${selectedCity.city}`;
      logSuccess('Auto-selected location from geolocation match', { district, sublocality });
      return true;
    }

    return false;
  }

  detectBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      detectStatus.textContent = 'Geolocation is not supported by your browser.';
      logError('Geolocation API not available');
      return;
    }

    detectStatus.textContent = 'Detecting your location…';
    logInfo('Attempting geolocation lookup');
    navigator.geolocation.getCurrentPosition(onDetectSuccess, onDetectError, { enableHighAccuracy: true, timeout: 10000 });
  });

  function onDetectSuccess(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    logInfo('Coordinates detected', { lat, lng });

    fetch(`/api/geo/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`)
      .then((response) => response.json())
      .then((data) => {
        if (attemptAutoSelect(data?.district, data?.sublocality)) {
          detectStatus.textContent = `We found ${data.sublocality}. Review and confirm to continue.`;
        } else if (data?.district) {
          detectStatus.textContent = `We found your district (${data.district}). Please pick the exact sublocality.`;
          logInfo('Reverse geocode partial match', data);
        } else {
          detectStatus.textContent = 'We could not detect your location. Please select manually.';
          logError('Reverse geocode response missing district and sublocality', data);
        }
      })
      .catch((err) => {
        detectStatus.textContent = 'Failed to contact geocoding service. Please select manually.';
        logError('Reverse geocode request failed', err);
      });
  }

  function onDetectError(err) {
    detectStatus.textContent = 'Location detection failed. Please select manually.';
    logError('Geolocation error', err);
  }
})();
