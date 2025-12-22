// 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Centralized calculator state restoration utilities
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Eliminates DRY violations across templates

(function() {
  'use strict';

  // 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Restore calculator state from calculator.getState() format
  // 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Handles radios, checkboxes, and products from calculator state
  function restoreFromCalculatorState(calculator, calcState) {
    if (!calculator || !calcState) {
      console.log('🟡🟡🟡 - [CALCULATOR STATE] No calculator or calculator state provided');
      return;
    }

    console.log('🟡🟡🟡 - [CALCULATOR STATE] Restoring from calculator state format');

    // 🟡🟡🟡 - [RADIO SELECTIONS] Restore radio selections from calculator state
    if (calcState.radios && typeof calcState.radios === 'object') {
      Object.entries(calcState.radios).forEach(([groupId, optionKey]) => {
        calculator.setRadio(groupId, optionKey);
        console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored radio:', groupId, '->', optionKey);
      });
    }

    // 🟡🟡🟡 - [CHECKBOX SELECTIONS] Restore checkbox selections from calculator state
    if (calcState.checkboxes && Array.isArray(calcState.checkboxes)) {
      calcState.checkboxes.forEach(optionKey => {
        calculator.setCheckbox(optionKey, true);
        console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored checkbox:', optionKey);
      });
    }

    // 🟡🟡🟡 - [PRODUCT QUANTITIES] Restore product quantities from calculator state
    if (calcState.products && typeof calcState.products === 'object') {
      Object.entries(calcState.products).forEach(([productKey, qty]) => {
        if (productKey !== 'guest-count') { // Guest count handled separately
          calculator.setProductQty(productKey, qty);
          console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored product:', productKey, '->', qty);
        }
      });
    }

    console.log('✅✅✅ - [CALCULATOR STATE] Calculator state restored');
  }

  // 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Restore calculator state from form data format
  // 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Handles radioSelections, checkboxSelections, and productQuantities
  function restoreFromFormData(calculator, eventSetup) {
    if (!calculator || !eventSetup) {
      console.log('🟡🟡🟡 - [CALCULATOR STATE] No calculator or eventSetup data provided');
      return;
    }

    console.log('🟡🟡🟡 - [CALCULATOR STATE] Restoring from form data format');

    // 🟡🟡🟡 - [RADIO SELECTIONS] Restore from radioSelections (form data format)
    if (eventSetup.radioSelections && typeof eventSetup.radioSelections === 'object') {
      Object.entries(eventSetup.radioSelections).forEach(([groupId, optionKey]) => {
        calculator.setRadio(groupId, optionKey);
        console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored radio from form data:', groupId, '->', optionKey);
      });
    }

    // 🟡🟡🟡 - [CHECKBOX SELECTIONS] Restore from checkboxSelections (form data format)
    if (eventSetup.checkboxSelections && typeof eventSetup.checkboxSelections === 'object') {
      Object.entries(eventSetup.checkboxSelections).forEach(([optionKey, value]) => {
        if (value) { // Only restore if value is truthy
          calculator.setCheckbox(optionKey, true);
          console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored checkbox from form data:', optionKey);
        }
      });
    }

    // 🟡🟡🟡 - [PRODUCT QUANTITIES] Restore from productQuantities (form data format)
    if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
      Object.entries(eventSetup.productQuantities).forEach(([productKey, qty]) => {
        if (productKey !== 'guest-count') { // Guest count handled separately
          calculator.setProductQty(productKey, qty);
          console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored product from form data:', productKey, '->', qty);
        }
      });
    }

    console.log('✅✅✅ - [CALCULATOR STATE] Form data restored to calculator');
  }

  // 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Main restoration function with fallback logic
  // 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Tries calculator state first, falls back to form data
  function restoreCalculatorState(calculator, eventSetupData, options) {
    if (!calculator) {
      console.error('❗❗❗ - [CALCULATOR STATE] Calculator not provided');
      return;
    }

    if (!eventSetupData) {
      console.log('🟡🟡🟡 - [CALCULATOR STATE] No eventSetup data provided');
      return;
    }

    options = options || {};
    const skipGuestCount = options.skipGuestCount === true;
    const skipProducts = options.skipProducts === true;

    console.log('🟡🟡🟡 - [CALCULATOR STATE] Starting calculator state restoration', { skipGuestCount, skipProducts });

    // 🟡🟡🟡 - [GUEST COUNT] Set guest count if not skipped
    if (!skipGuestCount) {
      let guestCount = null;
      
      // Try productQuantities first
      if (eventSetupData.productQuantities && typeof eventSetupData.productQuantities === 'object') {
        const guestCountValue = eventSetupData.productQuantities['guest-count'];
        if (typeof guestCountValue === 'number' && guestCountValue > 0) {
          guestCount = guestCountValue;
        }
      }
      
      // Fallback to calculator.guestCount
      if (guestCount === null && eventSetupData.calculator && typeof eventSetupData.calculator === 'object') {
        const calculatorGuestCount = eventSetupData.calculator.guestCount;
        if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
          guestCount = calculatorGuestCount;
        }
      }
      
      if (guestCount !== null && guestCount > 0) {
        calculator.setGuestCount(guestCount);
        console.log('✅✅✅ - [CALCULATOR STATE] Guest count set:', guestCount);
      }
    }

    // 🟡🟡🟡 - [RESTORE FROM CALCULATOR STATE] Try to restore from calculator.getState() format first
    if (eventSetupData.calculator && typeof eventSetupData.calculator === 'object') {
      const calcState = eventSetupData.calculator;
      
      // Restore radios, checkboxes, and products from calculator state
      restoreFromCalculatorState(calculator, calcState);
      
      // 🟡🟡🟡 - [FALLBACK] If calculator state exists, use it as primary source
      // Form data will only be used for missing values
      if (eventSetupData.radioSelections || eventSetupData.checkboxSelections || eventSetupData.productQuantities) {
        // Only restore form data if calculator state doesn't have the value
        if (eventSetupData.radioSelections && typeof eventSetupData.radioSelections === 'object') {
          Object.entries(eventSetupData.radioSelections).forEach(([groupId, optionKey]) => {
            if (!calcState.radios || !calcState.radios[groupId]) {
              calculator.setRadio(groupId, optionKey);
              console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored missing radio from form data:', groupId, '->', optionKey);
            }
          });
        }
        
        if (eventSetupData.checkboxSelections && typeof eventSetupData.checkboxSelections === 'object') {
          Object.entries(eventSetupData.checkboxSelections).forEach(([optionKey, value]) => {
            if (value && (!calcState.checkboxes || !calcState.checkboxes.includes(optionKey))) {
              calculator.setCheckbox(optionKey, true);
              console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored missing checkbox from form data:', optionKey);
            }
          });
        }
        
        if (!skipProducts && eventSetupData.productQuantities && typeof eventSetupData.productQuantities === 'object') {
          Object.entries(eventSetupData.productQuantities).forEach(([productKey, qty]) => {
            if (productKey !== 'guest-count' && (!calcState.products || !calcState.products[productKey])) {
              calculator.setProductQty(productKey, qty);
              console.log('🟡🟡🟡 - [CALCULATOR STATE] Restored missing product from form data:', productKey, '->', qty);
            }
          });
        }
      }
    } else {
      // 🟡🟡🟡 - [FALLBACK] No calculator state, use form data as primary source
      restoreFromFormData(calculator, eventSetupData);
    }

    console.log('✅✅✅ - [CALCULATOR STATE] Calculator state restoration complete');
  }

  // 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Export functions to global scope
  window.KloiCalculatorState = {
    restoreCalculatorState: restoreCalculatorState,
    restoreFromCalculatorState: restoreFromCalculatorState,
    restoreFromFormData: restoreFromFormData
  };

  console.log('✅✅✅ - [CALCULATOR STATE] Module loaded');
})();

