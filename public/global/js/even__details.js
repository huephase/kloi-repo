// public/global/js/even__details.js

document.addEventListener('DOMContentLoaded', function() {
    
    const propertyTypeRadios = document.querySelectorAll('input[name="propertyType"]');
    const conditionalFields = document.querySelectorAll('.conditional-field');
    const unitNumberInput = document.getElementById('unitNumber');
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Function to update radio button styling
    function updateRadioStyling() {
        const allLabels = document.querySelectorAll('label.radio-option');
        allLabels.forEach(label => {
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
                }
            } else {
                field.style.display = 'none';
                field.style.opacity = '0';
                // Disable required validation for hidden fields
                const input = field.querySelector('input, textarea');
                if (input) {
                    input.removeAttribute('required');
                    input.value = ''; // Clear hidden field values
                }
            }
        });
        
        // 🟡🟡🟡 - [EVENT DETAILS JS] Special handling for unit number (optional for EVENT)
        if (selectedType === 'EVENT' && unitNumberInput) {
            unitNumberInput.removeAttribute('required');
        } else if (unitNumberInput && unitNumberInput.closest('.conditional-field').style.display !== 'none') {
            unitNumberInput.setAttribute('required', 'required');
        }
    }
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Add event listeners to radio buttons
    propertyTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateFieldVisibility(this.value);
            updateRadioStyling(); // Update styling when radio changes
        });
    });
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Set initial state on page load
    const checkedRadio = document.querySelector('input[name="propertyType"]:checked');
    if (checkedRadio) {
        updateFieldVisibility(checkedRadio.value);
    } else {
        // Fallback to APARTMENT if no radio is checked
        updateFieldVisibility('APARTMENT');
    }
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Set initial radio styling
    updateRadioStyling();
    
    // 🟡🟡🟡 - [EVENT DETAILS JS] Initialize field validation
    initializeFieldValidation();
});

// 🟡🟡🟡 - [EVENT DETAILS JS] Field validation functions
function initializeFieldValidation() {
    
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
    
    // Street validation
    const streetInput = document.getElementById('street');
    if (streetInput) {
        streetInput.addEventListener('input', function() {
            validateStreet(this);
        });
        streetInput.addEventListener('blur', function() {
            validateStreet(this);
        });
    }
    
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmail(this);
        });
        emailInput.addEventListener('blur', function() {
            validateEmail(this);
        });
    }
    
    // Additional Directions validation
    const additionalDirectionsInput = document.getElementById('additionalDirections');
    if (additionalDirectionsInput) {
        additionalDirectionsInput.addEventListener('input', function() {
            validateAdditionalDirections(this);
        });
        additionalDirectionsInput.addEventListener('blur', function() {
            validateAdditionalDirections(this);
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