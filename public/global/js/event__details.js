// public/global/js/event__details.js

document.addEventListener('DOMContentLoaded', function() {
    
    const propertyTypeRadios = document.querySelectorAll('input[name="propertyType"]');
    const conditionalFields = document.querySelectorAll('.conditional-field');
    const unitNumberInput = document.getElementById('unitNumber');
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Function to update radio button styling
    function updateRadioStyling() {
        const allLabels = document.querySelectorAll('form.event-details-customer-info-form label.radio-option');
        
        allLabels.forEach((label, index) => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                label.classList.add('checked');
            } else {
                label.classList.remove('checked');
            }
        });
    }

    // 🟡🟡🟡 - [EVENT DETAILS JS] Function to show/hide fields based on property type
    function updateFieldVisibility(selectedType) {
        
        conditionalFields.forEach(field => {
            const showFor = field.getAttribute('data-show-for').split(',');
            const shouldShow = showFor.includes(selectedType);
            
            // Show/hide with smooth transition
            if (shouldShow) {
                field.style.display = 'block';
                field.style.opacity = '1';
                // Enable required validation for visible fields
                const input = field.querySelector('input, textarea');
                if (input && !input.hasAttribute('data-optional-for')) {
                    input.setAttribute('required', 'required');
                    // 🟡🟡🟡 - [CUSTOM VALIDATION] Apply custom validation message for newly visible required fields
                    applyCustomValidationMessage(input, selectedType);
                } else if (input && input.hasAttribute('data-optional-for') && input.getAttribute('data-optional-for').includes(selectedType)) {
                    // 🟡🟡🟡 - [CUSTOM VALIDATION] Field is optional for this property type
                    input.removeAttribute('required');
                    input.setCustomValidity(''); // Clear any validation message
                }
            } else {
                field.style.display = 'none';
                field.style.opacity = '0';
                // Disable required validation for hidden fields
                const input = field.querySelector('input, textarea');
                if (input) {
                    input.removeAttribute('required');
                    input.setCustomValidity(''); // Clear any validation message
                    input.value = ''; // Clear hidden field values
                }
            }
        });
        
        // 🟡🟡🟡 - [EVENT DETAILS JS] Special handling for unit number (optional for EVENT)
        if (selectedType === 'EVENT' && unitNumberInput) {
            unitNumberInput.removeAttribute('required');
            unitNumberInput.setCustomValidity(''); // Clear validation message since it's optional
        } else if (unitNumberInput && unitNumberInput.closest('.conditional-field').style.display !== 'none') {
            unitNumberInput.setAttribute('required', 'required');
            applyCustomValidationMessage(unitNumberInput, selectedType);
        }
    }
    
    // 🟡🟡🟡 - [CUSTOM VALIDATION] Function to apply custom validation messages based on field and property type
    function applyCustomValidationMessage(input, propertyType) {
        const fieldId = input.id;
        
        // 🟡🟡🟡 - [CUSTOM VALIDATION] Check if custom validation already applied to avoid duplicate listeners
        if (input.hasAttribute('data-custom-validation-applied')) {
            return;
        }
        
        let customMessage = '';
        
        switch(fieldId) {
            case 'buildingName':
                if (propertyType === 'APARTMENT') {
                    customMessage = '🏢 Please enter the apartment building name to continue';
                } else if (propertyType === 'OFFICE') {
                    customMessage = '🏢 Please enter the office building name to continue';
                } else if (propertyType === 'EVENT') {
                    customMessage = '📝 Please enter the event venue/building name to continue';
                }
                break;
                
            case 'houseNumber':
                customMessage = '🏠 Please enter your house number or MAKANI number to continue';
                break;
                
            case 'floorNumber':
                if (propertyType === 'APARTMENT') {
                    customMessage = '🏢 Please enter the apartment floor number (G, 1-170) to continue';
                } else if (propertyType === 'OFFICE') {
                    customMessage = '🏢 Please enter the office floor number (G, 1-170) to continue';
                } else if (propertyType === 'EVENT') {
                    customMessage = '📝 Please enter the event floor number (G, 1-170) to continue';
                }
                break;
                
            case 'unitNumber':
                if (propertyType === 'APARTMENT') {
                    customMessage = '🏢 Please enter the apartment unit number to continue';
                } else if (propertyType === 'OFFICE') {
                    customMessage = '🏢 Please enter the office unit number to continue';
                }
                // Note: EVENT doesn't need a message since it's optional
                break;
                
            case 'the-customer-phone':
                customMessage = '📞 Please enter your phone number to continue';
                break;
                
            default:
                customMessage = '📝 Please fill in this required field to continue';
        }
        
        // 🟡🟡🟡 - [CUSTOM VALIDATION] Set up custom validation message handling
        if (customMessage) {
            input.addEventListener('invalid', function() {
                this.setCustomValidity(customMessage);
            });
            
            input.addEventListener('input', function() {
                this.setCustomValidity(''); // Clear custom message when user starts typing
            });
            
            // 🟡🟡🟡 - [CUSTOM VALIDATION] Mark as having custom validation applied
            input.setAttribute('data-custom-validation-applied', 'true');
        }
    }
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Add event listeners to radio buttons
    propertyTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // 🟡🟡🟡 - [FORM RESET] Reset all form fields when property type changes
            resetFormFields();
            
            updateFieldVisibility(this.value);
            updateRadioStyling(); // Update styling when radio changes
            
            // Clear validation message when a radio is selected
            propertyTypeRadios.forEach(r => r.setCustomValidity(''));
            
            // 🟡🟡🟡 - [FORM RESET] Trigger form completeness check after reset
            setTimeout(() => {
                // Trigger input event to notify listeners that form has changed
                const phoneInput = document.getElementById('the-customer-phone');
                if (phoneInput) {
                    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 50);
        });
        
        // 🟡🟡🟡 - [CUSTOM VALIDATION] Add custom validation for property type radio buttons (only once)
        if (!radio.hasAttribute('data-custom-validation-applied')) {
            radio.addEventListener('invalid', function() {
                this.setCustomValidity('🏠 Please select a property type to continue');
            });
            
            radio.setAttribute('data-custom-validation-applied', 'true');
        }
    });
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Set initial state on page load
    const allRadios = document.querySelectorAll('input[name="propertyType"]');
    
    const checkedRadio = document.querySelector('input[name="propertyType"]:checked');
    if (checkedRadio) {
        updateFieldVisibility(checkedRadio.value);
        updateRadioStyling(); // Update styling immediately after finding checked radio
    } else {
        // Fallback to APARTMENT if no radio is checked
        const apartmentRadio = document.querySelector('input[name="propertyType"][value="APARTMENT"]');
        if (apartmentRadio) {
            apartmentRadio.checked = true;
            updateFieldVisibility('APARTMENT');
            updateRadioStyling(); // Update styling after setting default
        } else {
            console.error('❗❗❗ - [EVENT DETAILS JS] Could not find APARTMENT radio button');
        }
    }
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Ensure radio styling is applied with delay for browser rendering
    setTimeout(() => {
        updateRadioStyling();
    }, 100);
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Initialize field validation
    initializeFieldValidation();
    
    // 🟡🟡🟡 - [CUSTOM VALIDATION] Initialize form submission handling
    initializeFormValidation();
    
    // 🟡🟡🟡 - [SUBMIT BUTTON] Initialize dynamic submit button behavior
    initializeSubmitButtonBehavior();
});

// 🟡🟡🟡 - [CUSTOM VALIDATION] Form submission validation handler
function initializeFormValidation() {
    const form = document.querySelector('form.event-details-customer-info-form');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            
            // 🟡🟡🟡 - [FORM VALIDATION] Find the first invalid field and focus on it
            const firstInvalidField = form.querySelector(':invalid');
            if (firstInvalidField) {
                
                // Focus on the first invalid field to trigger validation message display
                firstInvalidField.focus();
                
                // If it's a hidden conditional field, make sure it's visible
                const conditionalParent = firstInvalidField.closest('.conditional-field');
                if (conditionalParent && conditionalParent.style.display === 'none') {
                    // This shouldn't happen due to our visibility logic, but just in case
                    event.preventDefault();
                    return false;
                }
            } else {
                console.log('✅✅✅ - [FORM VALIDATION] All fields valid, allowing form submission');
            }
        });
        
    } else {
        console.error('❗❗❗ - [FORM VALIDATION] Could not find event details form');
    }
}

// 🟡🟡🟡 - [SUBMIT BUTTON] Dynamic submit button behavior handler
function initializeSubmitButtonBehavior() {
    const submitButton = document.getElementById('event-details-submit');
    const form = document.querySelector('form.event-details-customer-info-form');
    
    if (!submitButton || !form) {
        return;
    }
    
    // 🟡🟡🟡 - [SUBMIT BUTTON] Set initial state (enabled so validation messages can show)
    submitButton.disabled = false;
    submitButton.textContent = 'Kindly fill in above details';
    submitButton.classList.remove('btn-active');
    
    // 🟡🟡🟡 - [SUBMIT BUTTON] Function to check if all required fields are filled
    function checkFormCompleteness() {
        
        // Get current property type
        const selectedPropertyType = document.querySelector('input[name="propertyType"]:checked');
        if (!selectedPropertyType) {
            updateSubmitButton(false, 'propertyType');
            return;
        }
        
        const propertyType = selectedPropertyType.value;
        
        // Check phone number (always required - minimum 9 digits)
        const phoneInput = document.getElementById('the-customer-phone');
        const phoneValue = phoneInput ? phoneInput.value.trim() : '';
        const phoneDigits = phoneValue.replace(/\D/g, ''); // Extract only digits
        if (!phoneInput || !phoneValue || phoneDigits.length < 9) {
            updateSubmitButton(false, getNextRequiredField(propertyType));
            return;
        }
        
        // Check conditional fields based on property type and get next required field
        const nextRequiredField = getNextRequiredField(propertyType);
        const allRequiredFieldsFilled = nextRequiredField === null;
        
        updateSubmitButton(allRequiredFieldsFilled, nextRequiredField);
    }
    
    // 🟡🟡🟡 - [SUBMIT BUTTON] Function to update submit button state with dynamic messaging
    function updateSubmitButton(isComplete, nextRequiredField = null) {
        if (isComplete) {
            // Check if email is empty and suggest it as optional
            const emailInput = document.getElementById('email');
            const emailValue = emailInput ? emailInput.value.trim() : '';
            
            if (!emailValue) {
                submitButton.disabled = false;
                submitButton.textContent = 'Skip adding email and continue';
                submitButton.classList.add('btn-active');
            } else {
                submitButton.disabled = false;
                submitButton.textContent = 'Continue';
                submitButton.classList.add('btn-active');
            }
        } else {
            submitButton.disabled = false; // Keep enabled so validation messages can show
            submitButton.classList.remove('btn-active');
            
            // Generate dynamic message based on next required field
            let dynamicMessage = getDynamicMessage(nextRequiredField);
            submitButton.textContent = dynamicMessage;
        }
    }
    
    // 🟡🟡🟡 - [SUBMIT BUTTON] Add event listeners to all relevant form fields
    const allInputs = form.querySelectorAll('input, textarea');
    allInputs.forEach(input => {
        // Skip the search box for country picker
        if (input.id === 'searchCountry') return;
        
        input.addEventListener('input', checkFormCompleteness);
        input.addEventListener('change', checkFormCompleteness);
    });
    
    // 🟡🟡🟡 - [SUBMIT BUTTON] Add special listener for radio buttons
    const propertyTypeRadios = document.querySelectorAll('input[name="propertyType"]');
    propertyTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Small delay to allow field visibility updates to complete
            setTimeout(checkFormCompleteness, 50);
        });
    });
    
    // 🟡🟡🟡 - [SUBMIT BUTTON] Initial check
    setTimeout(checkFormCompleteness, 100);
    
}

// 🟡🟡🟡 - [FORM RESET] Function to reset all form fields when property type changes
function resetFormFields() {
    const form = document.querySelector('form.event-details-customer-info-form');
    if (!form) {
        console.error('❗❗❗ - [FORM RESET] Could not find form to reset');
        return;
    }
    
    // 🟡🟡🟡 - [FORM RESET] Clear all input fields except radio buttons and country code
    const fieldsToReset = [
        'buildingName',
        'houseNumber', 
        'floorNumber',
        'unitNumber',
        'street',
        'the-customer-phone',
        'email',
        'additionalDirections'
    ];
    
    fieldsToReset.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            // Clear any custom validation messages
            field.setCustomValidity('');
            // Remove any validation styling classes
            field.classList.remove('invalid-email');
        }
    });
    
    // 🟡🟡🟡 - [FORM RESET] Clear any form error messages
    const errorDivs = form.querySelectorAll('.form-error');
    errorDivs.forEach(errorDiv => {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    });
    
    // 🟡🟡🟡 - [FORM RESET] Reset submit button to initial state
    const submitButton = document.getElementById('event-details-submit');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Kindly fill in above details';
        submitButton.classList.remove('btn-active');
    }
}

// 🟡🟡🟡 - [SUBMIT BUTTON] Function to determine the next required field based on property type
function getNextRequiredField(propertyType) {
    
    // Define field order based on property type
    let fieldOrder = [];
    
    if (propertyType === 'HOUSE') {
        fieldOrder = ['houseNumber', 'the-customer-phone'];
    } else if (propertyType === 'APARTMENT' || propertyType === 'OFFICE') {
        fieldOrder = ['buildingName', 'floorNumber', 'unitNumber', 'the-customer-phone'];
    } else if (propertyType === 'EVENT') {
        fieldOrder = ['buildingName', 'floorNumber', 'the-customer-phone']; // unitNumber is optional for EVENT
    } else {
        fieldOrder = ['the-customer-phone'];
    }
    
    // Check each field in order to find the first empty required field
    for (let fieldId of fieldOrder) {
        const input = document.getElementById(fieldId);
        if (!input) {
            continue;
        }
        
        let isFieldValid = false;
        
        if (fieldId === 'the-customer-phone') {
            // Special validation for phone - needs minimum 9 digits
            const phoneValue = input.value.trim();
            const phoneDigits = phoneValue.replace(/\D/g, '');
            isFieldValid = phoneValue && phoneDigits.length >= 9;
        } else {
            // Standard validation - just check if field has content
            isFieldValid = input.value.trim() !== '';
        }
        
        if (!isFieldValid) {
            return fieldId;
        }
    }
    
    return null; // All required fields are filled
}

// 🟡🟡🟡 - [SUBMIT BUTTON] Function to generate dynamic message based on next required field
function getDynamicMessage(nextRequiredField) {
    if (!nextRequiredField) {
        return 'Kindly fill in above details';
    }
    
    const messages = {
        'propertyType': 'Kindly select a property type',
        'buildingName': 'Kindly fill in your building name',
        'houseNumber': 'Kindly fill in your house number',
        'floorNumber': 'Kindly fill in your floor number',
        'unitNumber': 'Kindly fill in your unit number',
        'the-customer-phone': 'Kindly fill in your phone number (minimum 9 digits)'
    };
    
    const message = messages[nextRequiredField] || 'Kindly fill in above details';
    return message;
}

// 🟡🟡🟡 - [EVENT DETAILS JS] Field validation functions
function initializeFieldValidation() {
    console.log('🟡🟡🟡 - [EVENT DETAILS JS] Initializing field validation with custom messages');
    
    // 🟡🟡🟡 - [CUSTOM VALIDATION] Initialize custom validation for all always-visible required fields
    
    // Street field validation (always visible, but not required - no custom message needed)
    const streetInput = document.getElementById('street');
    if (streetInput) {
        streetInput.addEventListener('input', function() {
            validateStreet(this);
        });
        streetInput.addEventListener('blur', function() {
            validateStreet(this);
        });
    }
    
    // Phone field validation (always visible and required)
    const phoneInput = document.getElementById('the-customer-phone');
    if (phoneInput && !phoneInput.hasAttribute('data-custom-validation-applied')) {
        phoneInput.addEventListener('invalid', function() {
            this.setCustomValidity('📞 Please enter your phone number to continue');
        });
        
        phoneInput.addEventListener('input', function() {
            this.setCustomValidity(''); // Clear custom message when user starts typing
        });
        
        phoneInput.setAttribute('data-custom-validation-applied', 'true');
    }
    
    // Email field validation (always visible, optional but needs format validation)
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmail(this);
        });
        emailInput.addEventListener('blur', function() {
            validateEmail(this);
        });
        
        // 🟡🟡🟡 - [CUSTOM VALIDATION] Custom validation for email format (only once)
        if (!emailInput.hasAttribute('data-custom-validation-applied')) {
            emailInput.addEventListener('invalid', function() {
                if (this.validity.typeMismatch) {
                    this.setCustomValidity('📧 Please enter a valid email address (example@domain.com)');
                }
            });
            
            emailInput.addEventListener('input', function() {
                if (this.validity.valid) {
                    this.setCustomValidity(''); // Clear custom message when email becomes valid
                }
            });
            
            emailInput.setAttribute('data-custom-validation-applied', 'true');
        }
    }
    
    // Additional Directions validation (optional field - no custom validation message needed)
    const additionalDirectionsInput = document.getElementById('additionalDirections');
    if (additionalDirectionsInput) {
        additionalDirectionsInput.addEventListener('input', function() {
            validateAdditionalDirections(this);
        });
        additionalDirectionsInput.addEventListener('blur', function() {
            validateAdditionalDirections(this);
        });
    }
    
    // 🟡🟡🟡 - [CUSTOM VALIDATION] Initialize validation for conditional fields
    // Note: Custom validation messages for conditional fields are applied in updateFieldVisibility()
    
    // Building Name validation
    const buildingNameInput = document.getElementById('buildingName');
    if (buildingNameInput) {
        buildingNameInput.addEventListener('input', function() {
            validateBuildingName(this);
        });
        buildingNameInput.addEventListener('blur', function() {
            validateBuildingName(this);
        });
    }
    
    // House Number validation
    const houseNumberInput = document.getElementById('houseNumber');
    if (houseNumberInput) {
        houseNumberInput.addEventListener('input', function() {
            validateHouseNumber(this);
        });
        houseNumberInput.addEventListener('blur', function() {
            validateHouseNumber(this);
        });
    }
    
    // Floor Number validation
    const floorNumberInput = document.getElementById('floorNumber');
    if (floorNumberInput) {
        floorNumberInput.addEventListener('input', function() {
            validateFloorNumber(this);
        });
        floorNumberInput.addEventListener('blur', function() {
            validateFloorNumber(this);
        });
    }
    
    // Unit Number validation
    const unitNumberInput = document.getElementById('unitNumber');
    if (unitNumberInput) {
        unitNumberInput.addEventListener('input', function() {
            validateUnitNumber(this);
        });
        unitNumberInput.addEventListener('blur', function() {
            validateUnitNumber(this);
        });
    }
    
}

// 🟡🟡🟡 - [VALIDATION] Building Name: Max 30 chars, letters, numbers, hyphen, comma, space only
function validateBuildingName(input) {
    let value = input.value;
    // Remove invalid characters
    value = value.replace(/[^a-zA-Z0-9\-,\s]/g, '');
    // Trim to max 30 characters
    if (value.length > 30) {
        value = value.substring(0, 30);
    }
    input.value = value;
}

// 🟡🟡🟡 - [VALIDATION] House Number: Max 12 digits, numbers, hyphen, space only
function validateHouseNumber(input) {
    let value = input.value;
    // Remove invalid characters
    value = value.replace(/[^0-9\-\s]/g, '');
    // Trim to max 12 characters
    if (value.length > 12) {
        value = value.substring(0, 12);
    }
    input.value = value;
}

// 🟡🟡🟡 - [VALIDATION] Floor Number: Max 3 digits up to 170, or G, GF, M, MF only
function validateFloorNumber(input) {
    let value = input.value.toUpperCase().trim();
    
    // Check if it's one of the allowed letter combinations
    if (['G', 'GF', 'M', 'MF'].includes(value)) {
        input.value = value;
        return;
    }
    
    // Handle numeric values
    if (/^\d+$/.test(value)) {
        let numValue = parseInt(value, 10);
        
        // If 0, convert to 'G'
        if (numValue === 0) {
            input.value = 'G';
            return;
        }
        
        // If greater than 170, cap at 170
        if (numValue > 170) {
            numValue = 170;
        }
        
        // Ensure max 3 digits
        input.value = numValue.toString();
        return;
    }
    
    // If it contains letters but not valid combinations, default to 'G'
    if (/[a-zA-Z]/.test(value)) {
        input.value = 'G';
        return;
    }
    
    // Remove any other invalid characters
    value = value.replace(/[^0-9]/g, '');
    if (value.length > 3) {
        value = value.substring(0, 3);
    }
    
    if (value === '') {
        input.value = '';
    } else {
        let numValue = parseInt(value, 10);
        if (numValue > 170) {
            numValue = 170;
        }
        input.value = numValue.toString();
    }
}

// 🟡🟡🟡 - [VALIDATION] Unit Number: Max 4 digits, cap at 9999
function validateUnitNumber(input) {
    let value = input.value;
    // Remove non-digits
    value = value.replace(/[^0-9]/g, '');
    
    if (value !== '') {
        let numValue = parseInt(value, 10);
        // Cap at 9999
        if (numValue > 9999) {
            numValue = 9999;
        }
        input.value = numValue.toString();
    } else {
        input.value = '';
    }
}

// 🟡🟡🟡 - [VALIDATION] Street: Max 30 chars, letters, numbers, hyphen, comma, space only
function validateStreet(input) {
    let value = input.value;
    // Remove invalid characters
    value = value.replace(/[^a-zA-Z0-9\-,\s]/g, '');
    // Trim to max 30 characters
    if (value.length > 30) {
        value = value.substring(0, 30);
    }
    input.value = value;
}

// 🟡🟡🟡 - [VALIDATION] Email: Standard email validation
function validateEmail(input) {
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Remove validation styling first
    input.classList.remove('invalid-email');
    
    if (value !== '' && !emailRegex.test(value)) {
        input.classList.add('invalid-email');
    }
}

// 🟡🟡🟡 - [VALIDATION] Additional Directions: Max 100 chars, letters, numbers, hyphen, comma, space only
function validateAdditionalDirections(input) {
    let value = input.value;
    // Remove invalid characters
    value = value.replace(/[^a-zA-Z0-9\-,\s]/g, '');
    // Trim to max 100 characters
    if (value.length > 100) {
        value = value.substring(0, 100);
    }
    input.value = value;
}