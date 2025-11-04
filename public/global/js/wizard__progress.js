// 2025-11-03T00:00:00Z 🟡🟡🟡 - [WIZARD PROGRESS] Centralized progress save utilities
;(function initKloiWizardProgress() {
  if (window.KloiWizardProgress) {
    console.log('🟡🟡🟡 - [WIZARD PROGRESS] Module already initialized');
    return;
  }

  /**
   * 2025-11-03T00:00:00Z - Save wizard step payload to session via generic endpoint
   */
  async function saveWizardStep(step, data, options) {
    // 2025-11-04T00:00:00Z 🟡🟡🟡 - [WIZARD PROGRESS] Support autosave mode for lenient server handling
    console.log('🟡🟡🟡 - [WIZARD PROGRESS] Saving step to session:', step, data);
    try {
      var isAutosave = options && options.autosave === true;
      var url = `/api/session/${step}` + (isAutosave ? '?autosave=1' : '');
      var headers = { 'Content-Type': 'application/json' };
      if (isAutosave) {
        headers['X-KLOI-AutoSave'] = '1';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json && json.success) {
        console.log('✅✅✅ - [WIZARD PROGRESS] Step saved successfully:', step);
        return { ok: true, json };
      }
      console.error('❗❗❗ - [WIZARD PROGRESS] Save failed:', step, json?.message);
      return { ok: false, json };
    } catch (err) {
      console.error('❌❌❌ - [WIZARD PROGRESS] Save error:', step, err);
      return { ok: false, error: err };
    }
  }

  /**
   * 2025-11-03T00:00:00Z - Intercept navigation, save, then proceed
   */
  function attachSaveBeforeNavigate(selector, step, payloadBuilder) {
    const target = document.querySelector(selector);
    if (!target) {
      console.log('🟡🟡🟡 - [WIZARD PROGRESS] No target found for selector:', selector);
      return;
    }

    target.addEventListener('click', async (e) => {
      e.preventDefault();
      const href = target.getAttribute('href') || target.dataset.href || '/';
      console.log('🟡🟡🟡 - [WIZARD PROGRESS] Intercept navigation ->', href);

      let payload = {};
      try {
        payload = payloadBuilder ? payloadBuilder() : {};
      } catch (err) {
        console.error('❗❗❗ - [WIZARD PROGRESS] Payload build failed:', err);
      }

      const result = await saveWizardStep(step, payload);
      if (!result.ok) {
        alert('⚠️⚠️⚠️ - Warning: Could not save your current progress. You can still proceed.');
      }
      window.location.href = href;
    });

    console.log('✅✅✅ - [WIZARD PROGRESS] Handler attached:', selector, '-> step:', step);
  }

  /**
   * 2025-11-03T00:05:00Z - Debounce utility
   */
  function debounce(fn, wait) {
    var timeoutId;
    return function() {
      var ctx = this, args = arguments;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(function() { fn.apply(ctx, args); }, wait);
    };
  }

  /**
   * 2025-11-03T00:05:00Z - Auto-save on input change with debounce
   * Ensures progress is continuously persisted and resilient to back-button/navigation
   */
  function enableAutoSaveOnChange(formEl, step, payloadBuilder, options) {
    if (!formEl) {
      console.log('🟡🟡🟡 - [WIZARD PROGRESS] No formEl provided for auto-save');
      return { detach: function() {} };
    }

    var cfg = options || {};
    var debounceMs = typeof cfg.debounceMs === 'number' ? cfg.debounceMs : 600;
    var inputsSelector = cfg.inputsSelector || 'input, select, textarea';
    var pending = false;

    var doSave = debounce(async function() {
      try {
        pending = true;
        var payload = payloadBuilder ? payloadBuilder() : {};
        var result = await saveWizardStep(step, payload, { autosave: true });
        if (!result.ok) {
          console.error('❗❗❗ - [WIZARD PROGRESS] Auto-save failed for step:', step);
        } else {
          console.log('✅✅✅ - [WIZARD PROGRESS] Auto-saved step:', step);
        }
      } finally {
        pending = false;
      }
    }, debounceMs);

    var onChange = function() { doSave(); };
    var inputs = formEl.querySelectorAll(inputsSelector);
    inputs.forEach(function(el) { el.addEventListener('change', onChange); el.addEventListener('input', onChange); });

    // Final flush on unload/back-button/tab close using sendBeacon for reliability
    var unloadHandler = function() {
      try {
        var payload = payloadBuilder ? payloadBuilder() : {};
        var data = JSON.stringify(payload);
        var blob = new Blob([data], { type: 'application/json' });
        // 2025-11-04T00:00:00Z 🟡🟡🟡 - [WIZARD PROGRESS] Mark unload flush as autosave via query for server-side leniency
        var url = '/api/session/' + step + '?autosave=1';
        var beaconOk = navigator.sendBeacon && navigator.sendBeacon(url, blob);
        if (!beaconOk) {
          // Fallback: synchronous fetch with keepalive (best-effort)
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-KLOI-AutoSave': '1' }, body: data, keepalive: true })
            .catch(function(err){ console.error('❗❗❗ - [WIZARD PROGRESS] keepalive save failed:', err); });
        }
        console.log('🟡🟡🟡 - [WIZARD PROGRESS] Unload flush attempted for step:', step);
      } catch (err) {
        console.error('❌❌❌ - [WIZARD PROGRESS] Unload flush error:', err);
      }
    };

    window.addEventListener('beforeunload', unloadHandler);
    window.addEventListener('pagehide', unloadHandler);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') unloadHandler();
    });

    console.log('✅✅✅ - [WIZARD PROGRESS] Auto-save enabled for step:', step);

    return {
      detach: function() {
        inputs.forEach(function(el) { el.removeEventListener('change', onChange); el.removeEventListener('input', onChange); });
        window.removeEventListener('beforeunload', unloadHandler);
        window.removeEventListener('pagehide', unloadHandler);
      }
    };
  }

  /**
   * 2025-11-03T00:00:00Z - Collect event-setup form data (radios, checkboxes, quantities)
   */
  function collectEventSetupFormData(formEl) {
    console.log('🟡🟡🟡 - [WIZARD PROGRESS] Collecting event-setup form data');
    const data = { radioSelections: {}, checkboxSelections: {}, productQuantities: {} };

    if (!formEl) {
      console.log('🟡🟡🟡 - [WIZARD PROGRESS] No form element provided for collection');
      return data;
    }

    formEl.querySelectorAll('input[type="radio"]:checked')
      .forEach(function(r) { data.radioSelections[r.name] = r.value; });

    formEl.querySelectorAll('input[type="checkbox"]:checked')
      .forEach(function(cb) { data.checkboxSelections[cb.name] = cb.value; });

    formEl.querySelectorAll('.quantity-input')
      .forEach(function(inp) {
        var qty = parseInt(inp.value) || 0;
        if (qty > 0) data.productQuantities[inp.name] = qty;
      });

    console.log('✅✅✅ - [WIZARD PROGRESS] Collected event-setup data:', data);
    return data;
  }

  window.KloiWizardProgress = {
    saveWizardStep: saveWizardStep,
    attachSaveBeforeNavigate: attachSaveBeforeNavigate,
    enableAutoSaveOnChange: enableAutoSaveOnChange,
    collectEventSetupFormData: collectEventSetupFormData
  };

  console.log('✅✅✅ - [WIZARD PROGRESS] Module initialized');
})();


