// 2025-11-05T00:00:00Z 🟡🟡🟡 - [MENU LABELS] Centralized key->label mapping utilities for menus
;(function initKloiMenuLabels() {
  if (window.KloiMenuLabels) {
    console.log('🟡🟡🟡 - [MENU LABELS] Module already initialized');
    return;
  }

  /**
   * 2025-11-05T00:00:00Z - Build label maps from menuSections JSON string or object
   */
  function initFromMenuSections(menuSectionsJsonOrObj) {
    console.log('🟡🟡🟡 - [MENU LABELS] Initializing from menu sections');
    var sections;
    try {
      sections = typeof menuSectionsJsonOrObj === 'string'
        ? JSON.parse(menuSectionsJsonOrObj)
        : (Array.isArray(menuSectionsJsonOrObj) ? menuSectionsJsonOrObj : []);
    } catch (e) {
      console.error('❗❗❗ - [MENU LABELS] Failed to parse sections:', e);
      sections = [];
    }

    var radioCheckboxMap = {}; // sectionId.optionKey -> label
    var checkboxFlatMap = {};  // optionKey -> label (for UIs that do not carry sectionId)
    var productMap = {};       // productKey -> label
    var divGroupMap = {};      // divGroupKey -> label

    sections.forEach(function(section) {
      var sectionId = section && section.id;
      var htmlType = section && section.htmlType;
      var content = section && section.content;
      if (!sectionId || !content || typeof content !== 'object') return;

      if (htmlType === 'radio-group' || htmlType === 'checkbox-group') {
        Object.keys(content).forEach(function(optionKey) {
          var option = content[optionKey] || {};
          var label = option.label || optionKey;
          radioCheckboxMap[sectionId + '.' + optionKey] = label;
          if (htmlType === 'checkbox-group') {
            checkboxFlatMap[optionKey] = label;
          }
        });
      }

      if (htmlType === 'product-group') {
        Object.keys(content).forEach(function(productKey) {
          var product = content[productKey] || {};
          var label = product.label || productKey;
          productMap[productKey] = label;
        });
      }

      if (htmlType === 'div-group') {
        Object.keys(content).forEach(function(key) {
          var item = content[key] || {};
          var label = item.label || key;
          divGroupMap[key] = label;
        });
      }
    });

    window.__kloiMenuLabelMaps = {
      radioCheckboxMap: radioCheckboxMap,
      checkboxFlatMap: checkboxFlatMap,
      productMap: productMap,
      divGroupMap: divGroupMap
    };

    console.log('✅✅✅ - [MENU LABELS] Maps initialized:', {
      radioCheckbox: Object.keys(radioCheckboxMap).length,
      product: Object.keys(productMap).length,
      divGroup: Object.keys(divGroupMap).length
    });

    return window.__kloiMenuLabelMaps;
  }

  /**
   * 2025-11-05T00:00:00Z - Get display label for radio/checkbox by sectionId and optionKey
   */
  function getOptionLabel(sectionId, optionKey) {
    try {
      var maps = window.__kloiMenuLabelMaps || {};
      // Prefer composite map when sectionId provided
      var fromComposite = sectionId && maps.radioCheckboxMap && maps.radioCheckboxMap[sectionId + '.' + optionKey];
      if (fromComposite) return fromComposite;
      // Fallback: flat checkbox map (useful for calculators storing checkbox keys only)
      var fromFlat = maps.checkboxFlatMap && maps.checkboxFlatMap[optionKey];
      if (fromFlat) return fromFlat;
      return optionKey;
    } catch (e) {
      return optionKey;
    }
  }

  /**
   * 2025-11-05T00:00:00Z - Get display label for products by key
   */
  function getProductLabel(productKey) {
    try {
      var maps = window.__kloiMenuLabelMaps || {};
      return (maps.productMap && maps.productMap[productKey]) || productKey;
    } catch (e) {
      return productKey;
    }
  }

  /**
   * 2025-11-05T00:00:00Z - Annotate inputs in DOM with data-label attributes for reuse
   */
  function annotateDomLabels(rootEl) {
    var root = rootEl || document;
    try {
      // Radios
      var radios = root.querySelectorAll('input[type="radio"]');
      radios.forEach(function(r) {
        var sectionEl = r.closest('.menu-section');
        var sectionId = sectionEl && sectionEl.getAttribute('data-section-id');
        var label = null;
        // Prefer the visible label text if present
        var labelStrong = r.closest('.radio-option') && r.closest('.radio-option').querySelector('strong');
        if (labelStrong) label = labelStrong.textContent.trim();
        // Fallback to map
        if (!label && sectionId) label = getOptionLabel(sectionId, r.value);
        if (label) r.setAttribute('data-label', label);
      });

      // Checkboxes
      var checkboxes = root.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(function(cb) {
        var sectionEl = cb.closest('.menu-section');
        var sectionId = sectionEl && sectionEl.getAttribute('data-section-id');
        var label = null;
        var labelStrong = cb.closest('.checkbox-option') && cb.closest('.checkbox-option').querySelector('strong');
        if (labelStrong) label = labelStrong.textContent.trim();
        if (!label && sectionId) label = getOptionLabel(sectionId, cb.value);
        if (label) cb.setAttribute('data-label', label);
      });

      // Product quantities
      var qtyInputs = root.querySelectorAll('.quantity-input');
      qtyInputs.forEach(function(inp) {
        var item = inp.closest('.product-item');
        var strong = item && item.querySelector('strong');
        var label = strong ? strong.textContent.trim() : getProductLabel(inp.name);
        if (label) inp.setAttribute('data-label', label);
      });

      console.log('✅✅✅ - [MENU LABELS] DOM annotated with data-label attributes');
    } catch (e) {
      console.error('❗❗❗ - [MENU LABELS] Failed to annotate DOM labels:', e);
    }
  }

  window.KloiMenuLabels = {
    initFromMenuSections: initFromMenuSections,
    getOptionLabel: getOptionLabel,
    getProductLabel: getProductLabel,
    annotateDomLabels: annotateDomLabels
  };

  console.log('✅✅✅ - [MENU LABELS] Module initialized');
})();


