// 2025-11-06 🟡🟡🟡 Client script for delivery locations page
(function(){
  const btn = document.getElementById('detectLocationBtn');
  const statusEl = document.getElementById('detectStatus');

  function log(msg) {
    const ts = new Date().toISOString();
    console.log(`🟡🟡🟡 - [delivery-location.js ${ts}] ${msg}`);
  }

  if (!btn) return;

  btn.addEventListener('click', function(){
    if (!navigator.geolocation) {
      statusEl.textContent = 'Geolocation is not supported by your browser.';
      console.error('❗❗❗ - [delivery-location.js] Geolocation not supported');
      return;
    }

    statusEl.textContent = 'Detecting your location…';
    log('Attempting geolocation');
    navigator.geolocation.getCurrentPosition(onDetectSuccess, onDetectError, { enableHighAccuracy: true, timeout: 10000 });
  });

  function onDetectSuccess(position){
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    log(`Coordinates detected: ${lat}, ${lng}`);
    fetch(`/api/geo/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.district && data.sublocality) {
          log(`Reverse geocode match: ${data.district} / ${data.sublocality}`);
          window.location.href = `/location?district=${encodeURIComponent(data.district)}&sublocality=${encodeURIComponent(data.sublocality)}`;
        } else if (data && data.district) {
          log(`Reverse geocode partial match: ${data.district}`);
          statusEl.textContent = 'We found your district. Please select a sublocality below.';
          // Optionally expand the matching district section
          const details = Array.from(document.querySelectorAll('details.district'));
          const match = details.find(d => d.querySelector('summary')?.textContent === data.district);
          if (match) match.open = true;
        } else {
          statusEl.textContent = 'Could not determine your location. Please select manually.';
          console.error('❗❗❗ - [delivery-location.js] Reverse geocode returned no match');
        }
      })
      .catch(err => {
        statusEl.textContent = 'Failed to contact geocoding service.';
        console.error('❗❗❗ - [delivery-location.js] Reverse geocode error:', err);
      });
  }

  function onDetectError(err){
    statusEl.textContent = 'Location detection failed. Please select manually.';
    console.error('❗❗❗ - [delivery-location.js] Geolocation error:', err);
  }
})();


