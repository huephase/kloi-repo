# KLOI Application Changelog

⚠️⚠️⚠️ **IMPORTANT**: This document tracks all breaking changes, major changes, and directional changes in the KLOI application. Refer to this document when planning migrations, updates, or when understanding historical changes.

---

## Change Categories

- **🔴 BREAKING CHANGE**: Changes that require immediate attention and may break existing functionality
- **🟠 MAJOR CHANGE**: Significant feature additions or modifications that may require code updates
- **🟢 DIRECTION CHANGE**: Strategic shifts in application architecture, patterns, or business logic
- **🔵 MIGRATION REQUIRED**: Database or schema changes that need migration scripts
- **🟡 DEPRECATED**: Features or APIs that are being phased out

---

### January 8, 2026 @ 20:04 - Admin Menu Editor UX Improvements & Email Validation Fix

**Type**: 🟢 DIRECTION CHANGE

**Summary**: Improved admin menu editor user experience by preventing accidental data loss, simplifying item creation workflow, and fixing email validation behavior. All modals now only close via explicit Cancel or Save buttons (removed close buttons and click-outside handlers). Item keys are now auto-generated and hidden from users. Price basis validation now defaults to "Per guest" and prevents empty values. Fixed email validation in event details form to properly update when invalid emails are corrected.

#### Major Changes

- **Modal Closing Behavior Fix** (`public/global/js/admin-menu-editor.js`):
  - **Removed Close Buttons and Click-Outside Handlers** (8 modals affected):
    - **Root Cause**: Modals were closing when clicking outside or using the × button, causing users to lose their work
    - **Fix Applied**: Removed all close buttons and click-outside event handlers from all modals
    - **Modals Updated**:
      1. **Add New Section Modal** (Lines 788-825):
         - Removed: `<button class="admin-modal-close">&times;</button>` (Line 760)
         - Removed: `modal.querySelector('.admin-modal-close').addEventListener('click', closeModal)` (Line 783)
         - Removed: `modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); })` (Lines 791-794)
         - **Impact**: Users can only close via Cancel or Add Section buttons
      2. **Add New Nested Item Modal** (Lines 877-954):
         - Removed: Close button from header (Line 860)
         - Removed: Close button event listener (Line 904)
         - Removed: Click-outside handler (Lines 922-924)
         - **Impact**: Users can only close via Cancel or Add Item buttons
      3. **Edit Section Modal** (Lines 1066-1184):
         - Removed: Close button from header (Line 1107)
         - Removed: Close button event listener (Line 1125)
         - Removed: Click-outside handler (Lines 1154-1156)
         - **Impact**: Users can only close via Cancel or Save Changes buttons
      4. **Edit Radio Option Modal** (Lines 1234-1303):
         - Removed: Close button from header (Line 1215)
         - Removed: Close button event listener (Line 1253)
         - Removed: Click-outside handler (Lines 1275-1277)
         - **Impact**: Users can only close via Cancel or Save Changes buttons
      5. **Edit Checkbox Item Modal** (Lines 1328-1388):
         - Removed: Close button from header (Line 1311)
         - Removed: Close button event listener (Line 1345)
         - Removed: Click-outside handler (Lines 1362-1364)
         - **Impact**: Users can only close via Cancel or Save Changes buttons
      6. **Edit Div Item Modal** (Lines 1413-1473):
         - Removed: Close button from header (Line 1398)
         - Removed: Close button event listener (Line 1432)
         - Removed: Click-outside handler (Lines 1449-1451)
         - **Impact**: Users can only close via Cancel or Save Changes buttons
      7. **Edit Addon Item Modal** (Lines 1498-1558):
         - Removed: Close button from header (Line 1485)
         - Removed: Close button event listener (Line 1519)
         - Removed: Click-outside handler (Lines 1536-1538)
         - **Impact**: Users can only close via Cancel or Save Changes buttons
      8. **Edit Popup Section Modal** (Lines 1587-1695):
         - Removed: Close button from header (Line 1628)
         - Removed: Close button event listener (Line 1646)
         - Removed: Click-outside handler (Lines 1675-1677)
         - **Impact**: Users can only close via Cancel or Save Changes buttons
    - **Code Pattern Applied**:
      ```javascript
      // Before
      <button class="admin-modal-close">&times;</button>
      modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      
      // After
      // Close button removed from HTML
      // Only Cancel and Confirm buttons remain
      modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
      modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
        // Save logic here
        closeModal();
      });
      ```
    - **Impact**: Prevents accidental data loss when users click outside modals or accidentally click close buttons

- **User-Friendly Modal Headers** (`public/global/js/admin-menu-editor.js`):
  - **Removed Item Keys from Edit Modal Headers**:
    - **Root Cause**: Headers showed technical keys like "Edit Checkbox Item: checkbox3" which were not user-friendly
    - **Fix Applied**: Removed item key display from all edit modal headers
    - **Modals Updated**:
      1. **Edit Radio Option Modal** (Line 1242):
         - **Before**: `<h3>Edit Radio Option: ${radioKey}</h3>`
         - **After**: `<h3>Edit Radio Option</h3>`
      2. **Edit Checkbox Item Modal** (Line 1336):
         - **Before**: `<h3>Edit Checkbox Item: ${checkboxKey}</h3>`
         - **After**: `<h3>Edit Checkbox Item</h3>`
      3. **Edit Div Item Modal** (Line 1421):
         - **Before**: `<h3>Edit Div Item: ${divKey}</h3>`
         - **After**: `<h3>Edit Div Item</h3>`
      4. **Edit Addon Item Modal** (Line 1506):
         - **Before**: `<h3>Edit Addon Item: ${addonKey}</h3>`
         - **After**: `<h3>Edit Addon Item</h3>`
    - **Impact**: Cleaner, more user-friendly modal headers without technical identifiers

- **Auto-Generated Item Keys** (`public/global/js/admin-menu-editor.js`):
  - **Removed Manual Item Key Input Field**:
    - **Root Cause**: Users had to manually enter item keys (e.g., "checkbox1", "radio2") which was error-prone and not user-friendly
    - **Fix Applied**: Item keys are now auto-generated behind the scenes
    - **Add New Nested Item Modal** (Lines 877-954):
      - **Removed**: Item Key input field and label (Lines 860-863):
        ```html
        <!-- Removed -->
        <div class="admin-form-group">
          <label>Item Key (identifier):</label>
          <input type="text" id="new-nested-item-key" class="admin-form-input" placeholder="e.g., option1, item1">
        </div>
        ```
      - **Added**: Auto-generation logic (Lines 942-944):
        ```javascript
        // 🟡🟡🟡 2025-01-08 - [AUTO-GENERATE KEY] Generate unique item key automatically
        const itemKey = generateNextNestedItemKey(sectionKey, itemType);
        console.log('✅✅✅ - [ADMIN MENU EDITOR] Auto-generated item key:', itemKey);
        ```
      - **Updated Validation**: Changed from checking item key to checking label (Lines 946-949):
        ```javascript
        // Before
        if (!itemKey) {
          alert('Please enter an item key');
          return;
        }
        
        // After
        if (!label) {
          alert('Please enter a label');
          return;
        }
        ```
    - **New Helper Function** (Lines 92-124):
      - **Function**: `generateNextNestedItemKey(sectionKey, itemType)`
      - **Purpose**: Automatically generates unique item keys like `radio1`, `radio2`, `checkbox1`, etc.
      - **Logic**:
        - Finds all existing keys for the item type in the section
        - Extracts numeric suffixes (handles typos like "checbox3")
        - Finds the highest number and increments it
        - Returns new unique key (e.g., if `radio1`, `radio2` exist, returns `radio3`)
      - **Code Added**:
        ```javascript
        function generateNextNestedItemKey(sectionKey, itemType) {
          const section = currentMenuState[sectionKey];
          if (!section) {
            return `${itemType}1`;
          }
          
          let existingKeys = [];
          if (itemType === 'addon') {
            existingKeys = section['addon-items'] ? Object.keys(section['addon-items']) : [];
          } else {
            existingKeys = section.content ? Object.keys(section.content) : [];
          }
          
          const numbers = existingKeys
            .map(key => {
              const match = key.match(new RegExp(`^${itemType}(\\d+)$`, 'i'));
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => num > 0);
          
          const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
          return `${itemType}${maxNum + 1}`;
        }
        ```
      - **Updated**: `createNewNestedItem` function (Line 981):
        - **Before**: `'price-basis': itemData['price-basis'] || ''`
        - **After**: `'price-basis': itemData['price-basis'] || 'Per guest'`
    - **Impact**: Simplified user workflow - users no longer need to think about technical keys, system handles it automatically

- **Price Basis Validation Fix** (`public/global/js/admin-menu-editor.js`):
  - **Removed Empty "Select price basis" Option**:
    - **Root Cause**: Empty price basis values were causing issues as the app doesn't handle empty price basis
    - **Fix Applied**: Removed empty option and set "Per guest" as default
    - **Modals Updated** (5 modals):
      1. **Add New Nested Item Modal** (Lines 903-911):
         - **Before**: 
           ```html
           <option value="">Select price basis</option>
           <option value="Per day">Per day</option>
           <option value="Per event">Per event</option>
           <option value="Per guest">Per guest</option>
           ```
         - **After**:
           ```html
           <option value="Per day">Per day</option>
           <option value="Per event">Per event</option>
           <option value="Per guest" selected>Per guest</option>
           ```
      2. **Edit Radio Option Modal** (Lines 1253-1261):
         - Removed empty option
         - Added default selection logic: `${radio['price-basis'] === 'Per guest' || !radio['price-basis'] ? ' selected' : ''}`
      3. **Edit Checkbox Item Modal** (Lines 1347-1355):
         - Removed empty option
         - Added default selection logic: `${checkbox['price-basis'] === 'Per guest' || !checkbox['price-basis'] ? ' selected' : ''}`
      4. **Edit Div Item Modal** (Lines 1432-1440):
         - Removed empty option
         - Added default selection logic: `${div['price-basis'] === 'Per guest' || !div['price-basis'] ? ' selected' : ''}`
      5. **Edit Addon Item Modal** (Lines 1517-1525):
         - Removed empty option
         - Added default selection logic: `${addon['price-basis'] === 'Per guest' || !addon['price-basis'] ? ' selected' : ''}`
    - **Save Logic Updates** (5 save handlers):
      1. **Add New Nested Item** (Line 939):
         - **Before**: `const priceBasis = document.getElementById('new-nested-item-price-basis').value.trim();`
         - **After**: `const priceBasis = document.getElementById('new-nested-item-price-basis').value.trim() || 'Per guest';`
      2. **Edit Radio Option** (Line 1292):
         - **Before**: `if (priceBasisInput) radio['price-basis'] = priceBasisInput.value.trim();`
         - **After**: `if (priceBasisInput) radio['price-basis'] = priceBasisInput.value.trim() || 'Per guest';`
      3. **Edit Checkbox Item** (Line 1381):
         - **Before**: `if (priceBasisInput) checkbox['price-basis'] = priceBasisInput.value.trim();`
         - **After**: `if (priceBasisInput) checkbox['price-basis'] = priceBasisInput.value.trim() || 'Per guest';`
      4. **Edit Div Item** (Line 1466):
         - **Before**: `if (priceBasisInput) div['price-basis'] = priceBasisInput.value.trim();`
         - **After**: `if (priceBasisInput) div['price-basis'] = priceBasisInput.value.trim() || 'Per guest';`
      5. **Edit Addon Item** (Line 1551):
         - **Before**: `if (priceBasisInput) addon['price-basis'] = priceBasisInput.value.trim();`
         - **After**: `if (priceBasisInput) addon['price-basis'] = priceBasisInput.value.trim() || 'Per guest';`
    - **Impact**: Prevents invalid empty price basis values, ensures all items have a valid price basis (defaults to "Per guest")

- **Email Validation Fix** (`public/global/js/event__details.js`):
  - **Fixed Email Validation State Update**:
    - **Root Cause**: When an invalid email was entered, validation correctly blocked submission. However, when the email was corrected, the HTML5 validation state wasn't being updated, causing the form to remain blocked even with a valid email.
    - **Fix Applied**: Updated email validation to properly clear HTML5 validation state when email is corrected
    - **Email Input Event Listener** (Lines 511-530):
      - **Added**: Immediate custom validity clearing on input (Line 519):
        ```javascript
        // ⚠️⚠️⚠️ 2025-01-08 - [EMAIL VALIDATION] Always clear custom validity on input
        this.setCustomValidity('');
        ```
      - **Added**: Real-time validation check (Lines 525-528):
        ```javascript
        // ⚠️⚠️⚠️ 2025-01-08 - [EMAIL VALIDATION] If email is empty or valid, ensure no validation blocks submission
        if (value === '' || emailRegex.test(value)) {
          this.setCustomValidity('');
        }
        ```
      - **Impact**: Validation state updates immediately when user types, allowing form submission once email becomes valid
    - **Updated validateEmail Function** (Lines 729-750):
      - **Added**: Custom validity clearing for valid/empty emails (Lines 741-743):
        ```javascript
        // ⚠️⚠️⚠️ 2025-01-08 - [EMAIL VALIDATION] Clear custom validity when email is empty or valid
        if (value === '' || emailRegex.test(value)) {
          input.setCustomValidity(''); // Clear custom validity message
        }
        ```
      - **Updated**: Only set custom validity if email has value and is invalid (Lines 744-750):
        ```javascript
        } else {
          // Email has value but is invalid format
          input.classList.add('invalid-email');
          // Only set custom validity if the browser's native validation also considers it invalid
          if (input.validity.typeMismatch) {
            input.setCustomValidity('📧 Please enter a valid email address (example@domain.com)');
          }
        }
        ```
      - **Impact**: Prevents validation state from getting stuck, ensures form can be submitted when email is corrected
    - **Updated Invalid Event Listener** (Lines 533-543):
      - **Added**: Check for empty email (Line 537):
        ```javascript
        if (this.validity.typeMismatch && this.value.trim() !== '') {
          this.setCustomValidity('📧 Please enter a valid email address (example@domain.com)');
        } else {
          // If empty, don't block - email is optional
          this.setCustomValidity('');
        }
        ```
      - **Impact**: Empty emails don't block submission (email is optional field)
    - **Code Pattern Applied**:
      ```javascript
      // Before
      emailInput.addEventListener('input', function() {
        validateEmail(this);
        if (this.validity.valid) {
          this.setCustomValidity(''); // Only cleared if already valid
        }
      });
      
      // After
      emailInput.addEventListener('input', function() {
        const value = this.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Always clear custom validity on input
        this.setCustomValidity('');
        
        validateEmail(this);
        
        // If email is empty or valid, ensure no validation blocks submission
        if (value === '' || emailRegex.test(value)) {
          this.setCustomValidity('');
        }
      });
      ```
    - **Impact**: Email validation now properly updates when invalid emails are corrected, allowing form submission once email becomes valid

#### Files Modified

1. **`public/global/js/admin-menu-editor.js`**:
   - Lines 754-795: Add New Section Modal (removed close button and click-outside handler)
   - Lines 877-954: Add New Nested Item Modal (removed close button, click-outside handler, and item key input field)
   - Lines 92-124: Added `generateNextNestedItemKey()` helper function
   - Lines 1066-1184: Edit Section Modal (removed close button and click-outside handler)
   - Lines 1234-1303: Edit Radio Option Modal (removed close button, click-outside handler, and item key from header)
   - Lines 1328-1388: Edit Checkbox Item Modal (removed close button, click-outside handler, and item key from header)
   - Lines 1413-1473: Edit Div Item Modal (removed close button, click-outside handler, and item key from header)
   - Lines 1498-1558: Edit Addon Item Modal (removed close button, click-outside handler, and item key from header)
   - Lines 1587-1695: Edit Popup Section Modal (removed close button and click-outside handler)
   - Lines 903-911, 1253-1261, 1347-1355, 1432-1440, 1517-1525: Price basis select dropdowns (removed empty option, set "Per guest" as default)
   - Lines 939, 1292, 1381, 1466, 1551: Save handlers (added default "Per guest" fallback)
   - Line 981: `createNewNestedItem` function (changed default price-basis from empty string to "Per guest")

2. **`public/global/js/event__details.js`**:
   - Lines 511-543: Email input event listeners (updated to properly clear validation state)
   - Lines 729-750: `validateEmail()` function (updated to clear custom validity for valid/empty emails)

#### Testing Recommendations

1. **Modal Closing Behavior**:
   - Test that clicking outside modals does not close them
   - Test that all modals only close via Cancel or Save/Add buttons
   - Verify no data loss occurs when accidentally clicking outside

2. **Item Key Auto-Generation**:
   - Test creating new radio, checkbox, div, and addon items
   - Verify keys are auto-generated correctly (radio1, radio2, checkbox1, etc.)
   - Verify no duplicate keys are created

3. **Price Basis Validation**:
   - Test that new items default to "Per guest"
   - Test that editing items with empty price basis defaults to "Per guest"
   - Verify no empty price basis values can be saved

4. **Email Validation**:
   - Test entering invalid email → form should block submission
   - Test correcting invalid email to valid → form should allow submission
   - Test leaving email empty → form should allow submission (email is optional)

---

### December 23, 2025 @ 00:05 - Stripe Payment Integration: Migration to Payment Element + Appearance API

**Type**: 🟠 MAJOR CHANGE

**Summary**: Migrated checkout page from legacy Stripe Card Element to modern Payment Element with Appearance API integration. This upgrade provides improved accessibility, better user experience with larger fonts, support for multiple payment methods (Apple Pay, Google Pay, etc.), and proper handling of deferred payments and 3D Secure authentication. Fixed critical payment flow errors including missing `return_url`, missing `elements.submit()` call, and added comprehensive 3D Secure return handling.

#### Major Changes

- **Stripe Payment Element Migration** (`src/views/wizard/checkout.hbs`):
  - **HTML Structure Updates** (Lines 90-96):
    - **Changed mount point** from `card-element` to `payment-element`:
      ```html
      <!-- Before -->
      <div id="card-element" class="stripe-element">
      
      <!-- After -->
      <div id="payment-element" class="stripe-element">
      ```
    - **Removed unnecessary label** (Line 92):
      - Removed `<label for="payment-element">Payment Details</label>` as Payment Element handles its own internal labeling and accessibility
      - The `for` attribute was non-functional since it pointed to a `div` element, not a form control
      - Section heading `<h2>Payment Information</h2>` provides sufficient context
    - **Impact**: Cleaner HTML structure, Payment Element manages its own labels and accessibility features

  - **Stripe Elements Initialization** (Lines 165-187):
    - **Added Appearance API Configuration** (Lines 165-181):
      - Configured larger, accessible typography (18px base font, 16px labels)
      - Set system font family for better cross-platform consistency
      - **Code Added**:
        ```javascript
        const appearance = {
          theme: 'stripe',
          variables: {
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSizeBase: '18px', // Make everything larger for accessibility
            colorText: '#1f2933',
          },
          rules: {
            '.Input': {
              fontSize: '18px',
            },
            '.Label': {
              fontSize: '16px',
            },
          },
        };
        ```
      - **Impact**: Improved accessibility with larger fonts, better readability for all users

    - **Updated Elements Initialization** (Lines 183-187):
      - Changed from `stripe.elements()` to `stripe.elements({ clientSecret, appearance })`
      - Payment Element requires `clientSecret` during initialization (unlike Card Element)
      - **Code Changed**:
        ```javascript
        // Before
        const elements = stripe.elements();
        const cardElement = elements.create('card', { style: {...} });
        
        // After
        const elements = stripe.elements({
          clientSecret: clientSecret,
          appearance: appearance,
        });
        const paymentElement = elements.create('payment', {
          layout: 'tabs', // or 'accordion', 'accordion_preselected'
        });
        ```
      - **Impact**: Modern Payment Element supports multiple payment methods (cards, Apple Pay, Google Pay, etc.) and better UX

  - **Payment Confirmation API Update** (Lines 251-264):
    - **Changed from `confirmCardPayment` to `confirmPayment`**:
      - **Before** (Lines 197-204):
        ```javascript
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: cardholderName || undefined },
          },
        });
        ```
      - **After** (Lines 251-264):
        ```javascript
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret: clientSecret,
          redirect: 'if_required',
          confirmParams: {
            return_url: returnUrl,
            payment_method_data: {
              billing_details: { name: cardholderName || undefined },
            },
          },
        });
        ```
      - **Impact**: Uses modern Payment Element API, supports deferred payments, handles 3D Secure properly

  - **3D Secure Return Handling** (Lines 140-163):
    - **Added detection and handling of 3D Secure redirects**:
      - Detects return from 3D Secure authentication via URL parameters
      - Retrieves payment intent status using `stripe.retrievePaymentIntent()`
      - Redirects to confirmation page on success, shows error on failure
      - **Code Added**:
        ```javascript
        const urlParams = new URLSearchParams(window.location.search);
        const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
        if (paymentIntentClientSecret) {
          stripe.retrievePaymentIntent(paymentIntentClientSecret).then(function({ paymentIntent }) {
            if (paymentIntent && paymentIntent.status === 'succeeded') {
              window.location.href = '/final-confirmation?order=' + orderId;
            } else {
              // Show error message
            }
          });
          return; // Exit early if handling 3D Secure return
        }
        ```
      - **Impact**: Properly handles 3D Secure authentication flow, users are redirected back correctly after authentication

  - **Deferred Payment Support** (Lines 228-243):
    - **Added `elements.submit()` call before `confirmPayment()`**:
      - Required by Stripe for deferred payment integration
      - Triggers form validation and wallet collection (Apple Pay, Google Pay, etc.)
      - Must be called before any asynchronous work
      - **Code Added**:
        ```javascript
        // Submit elements first to trigger validation and wallet collection
        const { error: submitError } = await elements.submit();
        
        if (submitError) {
          // Handle validation errors
          paymentError.textContent = submitError.message || 'Please check your payment details.';
          paymentError.style.display = 'block';
          submitButton.disabled = false;
          return;
        }
        
        // Then proceed with confirmPayment()
        const { error, paymentIntent } = await stripe.confirmPayment({...});
        ```
      - **Impact**: Fixes IntegrationError, enables proper deferred payment handling, supports wallet payment methods

  - **Payment Confirmation Parameters** (Lines 248-263):
    - **Added `redirect: 'if_required'`** (Line 255):
      - Only redirects if 3D Secure authentication is required
      - Otherwise completes payment on the same page
      - **Impact**: Better UX - no unnecessary redirects for simple card payments

    - **Added `return_url` to `confirmParams`** (Line 257):
      - Required by Stripe for 3D Secure redirects
      - Points back to checkout page with order ID for proper return handling
      - **Code Added**:
        ```javascript
        const returnUrl = window.location.origin + window.location.pathname + '?order=' + orderId;
        confirmParams: {
          return_url: returnUrl,
          // ...
        }
        ```
      - **Impact**: Fixes IntegrationError about missing `return_url`, enables 3D Secure flow

  - **UI Improvements** (Line 74):
    - **Changed "Total" to "Grand Total"** in price breakdown section:
      - More descriptive label for final payment amount
      - **Code Changed**:
        ```html
        <!-- Before -->
        <span><strong>Total:</strong></span>
        
        <!-- After -->
        <span><strong>Grand Total:</strong></span>
        ```
      - **Impact**: Clearer labeling for users

#### Files Modified

- `src/views/wizard/checkout.hbs`:
  - **Lines 1**: Updated comment to reflect Payment Element + Appearance API
  - **Lines 90-96**: Changed HTML mount point, removed unnecessary label
  - **Lines 74**: Changed "Total" to "Grand Total"
  - **Lines 121**: Updated script comment
  - **Lines 123**: Updated initialization log message
  - **Lines 140-163**: Added 3D Secure return handling
  - **Lines 165-181**: Added Appearance API configuration
  - **Lines 183-187**: Updated Elements initialization with clientSecret and appearance
  - **Lines 189-194**: Changed from cardElement to paymentElement with tabs layout
  - **Lines 196-206**: Updated change event handler for paymentElement
  - **Lines 228-243**: Added elements.submit() call with error handling
  - **Lines 245-264**: Updated confirmPayment API call with redirect and return_url
  - **Lines 310**: Updated success log message

#### Error Fixes

1. **IntegrationError: `confirmParams.return_url` required**:
   - **Error**: `stripe.confirmPayment(): the confirmParams.return_url argument is required unless passing redirect: 'if_required'`
   - **Fix**: Added both `redirect: 'if_required'` and `return_url` to confirmParams
   - **Lines**: 255, 257

2. **IntegrationError: `elements.submit()` must be called**:
   - **Error**: `elements.submit() must be called before stripe.confirmPayment(). Call elements.submit() as soon as your customer presses pay, prior to any asynchronous work.`
   - **Fix**: Added `await elements.submit()` call before `confirmPayment()` with proper error handling
   - **Lines**: 228-243

#### Technical Details

- **Payment Element Benefits**:
  - Supports multiple payment methods (cards, digital wallets)
  - Better accessibility with larger fonts
  - Improved mobile experience
  - Automatic validation and error handling
  - Better 3D Secure integration

- **Appearance API Benefits**:
  - Customizable typography (18px base font for accessibility)
  - Consistent styling across platforms
  - Better user experience with larger, readable text

- **Deferred Payment Pattern**:
  - `elements.submit()` collects payment method and validates form
  - `confirmPayment()` processes the payment
  - Proper error handling at each step

- **3D Secure Flow**:
  - User submits payment → `elements.submit()` → `confirmPayment()`
  - If 3D Secure required → redirect to Stripe hosted page
  - User authenticates → redirect back to `return_url`
  - Check payment status → redirect to confirmation page

#### Migration Notes

- **Breaking Changes**: None - this is a drop-in replacement
- **Backward Compatibility**: Fully compatible with existing payment flow
- **Testing Required**: 
  - Test standard card payments
  - Test 3D Secure authentication flow
  - Test wallet payments (if enabled)
  - Test error handling scenarios

#### References

- Stripe Payment Element Documentation: https://stripe.com/docs/payments/payment-element
- Stripe Appearance API: https://stripe.com/docs/elements/appearance-api
- Stripe Deferred Payments: https://stripe.com/docs/payments/accept-a-payment-deferred

---

### December 22, 2025 @ 19:31 - Checkout Route Fix: Order Data Source Priority and Calculator Totals Persistence

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical issue where checkout route was sending zero amounts to Stripe payment processor, causing "minimum charge amount" errors. The checkout route now prioritizes order's persisted data over session data, intelligently falls back to session data when order's eventSetup lacks calculator totals, and ensures calculator totals are saved to session before navigating from event-summary to checkout. This ensures accurate payment amounts are calculated and sent to Stripe, preventing payment failures.

#### Major Changes

- **Checkout Route Data Source Priority** (`src/routes/checkout.ts`):
  - **Order Data as Primary Source** (Lines 63-73):
    - Changed checkout route to use order's persisted `eventSetup` and `location` JSON fields as primary data source
    - Order's data is more reliable than session data which may be stale or incomplete
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [DATA SOURCE] Use order's persisted data instead of session data (more reliable)
      // ⚠️⚠️⚠️ - [DATA SOURCE] Order's eventSetup and location are the source of truth, session may be stale
      const orderEventSetup = (order.eventSetup as any) || null;
      const orderLocation = (order.location as any) || null;
      ```
    - **Impact**: Checkout route now uses persisted order data instead of potentially stale session data

  - **Smart Calculator Totals Detection** (Lines 71-73):
    - Added logic to check if order's `eventSetup` contains calculator totals
    - Falls back to session's `eventSetup` if order's doesn't have calculator totals
    - Handles case where order's `eventSetup` only contains date/time info (from date step), not calculator totals (from event step)
    - **Code Added**:
      ```typescript
      // ⚠️⚠️⚠️ - [DATA SOURCE] Only use order's eventSetup if it has calculator totals, otherwise use session's eventSetup
      // Order's eventSetup might only contain date/time info (from date step), not calculator totals (from event step)
      const orderHasCalculatorTotals = orderEventSetup?.calculator?.totals?.total || orderEventSetup?.calculator?.totals?.subtotal;
      const eventSetupForCalculation = (orderHasCalculatorTotals && orderEventSetup) ? orderEventSetup : eventSetup;
      const locationForCalculation = orderLocation || locationData;
      ```
    - **Impact**: Checkout route correctly identifies which data source has calculator totals and uses it

  - **Enhanced Logging for Data Source Selection** (Lines 75-81):
    - Added comprehensive logging to show which data source is being used (order vs session)
    - Logs whether calculator totals are found in order or session
    - **Code Added**:
      ```typescript
      console.log('🟡🟡🟡 - [CHECKOUT] Data source selection:', {
        orderHasCalculatorTotals: !!orderHasCalculatorTotals,
        usingOrderEventSetup: orderHasCalculatorTotals && !!orderEventSetup,
        usingSessionEventSetup: !orderHasCalculatorTotals || !orderEventSetup,
        orderEventSetupKeys: orderEventSetup ? Object.keys(orderEventSetup) : [],
        sessionEventSetupHasCalculator: !!(eventSetup?.calculator?.totals)
      });
      ```
    - **Impact**: Better debugging visibility into data source selection logic

  - **Order TotalAmount Fallback** (Lines 95-107):
    - Added logic to use order's `totalAmount` field if it exists and is valid
    - Handles both Prisma Decimal type (with `toNumber()` method) and number type
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [TOTAL] Calculate final total (subtotal + surcharge)
      // ⚠️⚠️⚠️ - [TOTAL] If order.totalAmount exists and is valid, prefer it over calculated total
      let total = subtotal + surcharge;
      if (order.totalAmount && typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount) {
        const orderTotalAmount = (order.totalAmount as any).toNumber();
        if (orderTotalAmount > 0 && isFinite(orderTotalAmount)) {
          console.log('🟡🟡🟡 - [CHECKOUT] Using order.totalAmount from database:', orderTotalAmount);
          total = orderTotalAmount;
        }
      } else if (order.totalAmount && typeof order.totalAmount === 'number' && order.totalAmount > 0) {
        console.log('🟡🟡🟡 - [CHECKOUT] Using order.totalAmount from database:', order.totalAmount);
        total = order.totalAmount;
      }
      ```
    - **Impact**: Provides additional fallback to use stored total amount if available

  - **Enhanced Error Logging** (Lines 118-131):
    - Added comprehensive error logging when total is invalid (0 or missing)
    - Logs both order and session eventSetup data for debugging
    - Redirects to event-summary if totals are missing (allows calculator to recalculate)
    - **Code Added**:
      ```typescript
      // ⚠️⚠️⚠️ - [VALIDATION] Ensure total is greater than 0 before proceeding
      if (!total || total <= 0 || !isFinite(total)) {
        console.error('❌❌❌ - [CHECKOUT] Invalid total amount calculated:', total);
        console.error('❌❌❌ - [CHECKOUT] Order eventSetup:', JSON.stringify(orderEventSetup, null, 2));
        console.error('❌❌❌ - [CHECKOUT] Order location:', JSON.stringify(orderLocation, null, 2));
        console.error('❌❌❌ - [CHECKOUT] Session eventSetup calculator totals:', eventSetup?.calculator?.totals);
        console.error('❌❌❌ - [CHECKOUT] EventSetup used for calculation:', eventSetupForCalculation === orderEventSetup ? 'ORDER' : 'SESSION');
        console.error('❌❌❌ - [CHECKOUT] Subtotal calculated:', subtotal, 'Surcharge:', surcharge);
        
        // 🟡🟡🟡 - [FALLBACK] If calculator totals are missing, redirect to event-summary to recalculate
        console.log('🟡🟡🟡 - [CHECKOUT] Calculator totals missing, redirecting to event-summary to recalculate');
        return reply.redirect('/event-summary?recalculate=true');
      }
      ```
    - **Impact**: Better error visibility and graceful fallback when totals are missing

  - **Payment Intent Creation Updates** (Lines 146-189):
    - Updated all payment intent creation calls to use `eventSetupForCalculation` and `locationForCalculation` instead of session data
    - Ensures payment intents are created with correct data source
    - **Code Updated**:
      ```typescript
      // BEFORE: eventSetup, locationData, eventDetails (from session)
      // AFTER:
      eventSetup: eventSetupForCalculation,
      locationData: locationForCalculation,
      eventDetails: (order.eventDetails as any) || eventDetails
      ```
    - **Impact**: Payment intents are created with correct amounts from the right data source

  - **Template Data Updates** (Lines 208-231):
    - Updated template data to prefer order's persisted data over session data
    - Falls back to session data if order data is unavailable
    - **Code Updated**:
      ```typescript
      locationData: locationForCalculation || locationData, // Use order's location, fallback to session
      eventDetails: (order.eventDetails as any) || eventDetails, // Use order's eventDetails, fallback to session
      eventSetup: eventSetupForCalculation || eventSetup, // Use order's eventSetup, fallback to session
      ```
    - **Impact**: Template displays data from the most reliable source

- **Event-Summary Checkout Button Enhancement** (`src/views/wizard/event-summary.hbs`):
  - **Calculator Totals Persistence** (Lines 203-284):
    - Modified checkout button to save calculator totals to session before navigating to checkout
    - Prevents default link navigation and handles it programmatically
    - **Code Added**:
      ```javascript
      const checkoutBtn = document.getElementById('checkoutBtn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function(e) {
          e.preventDefault(); // Prevent default navigation
          console.log('🟡🟡🟡 - [EVENT SUMMARY VIEW] Proceed to checkout clicked');
          
          // 🟡🟡🟡 - [CALCULATOR TOTALS] Save calculator totals to session before navigating to checkout
          // ⚠️⚠️⚠️ - [CALCULATOR TOTALS] This ensures checkout route has access to calculator totals
          try {
            const calc = window.__kloiCalc || (window.KloiCalculator && window.KloiCalculator.current);
            if (calc && typeof calc.getQuote === 'function' && typeof calc.getState === 'function') {
              const quote = calc.getQuote();
              const state = calc.getState();
              
              if (quote && quote.total > 0) {
                // ... save logic
              }
            }
          } catch (error) {
            // Error handling
          }
        });
      }
      ```
    - **Impact**: Calculator totals are saved to session before checkout navigation, ensuring checkout route has access to them

  - **Calculator Quote Collection** (Lines 212-248):
    - Gets calculator quote using `calc.getQuote()` and state using `calc.getState()`
    - Reads existing eventSetup from server data attribute
    - Builds payload with calculator totals (subtotal, total, minimumOrderTotal, breakdown)
    - **Code Added**:
      ```javascript
      const quote = calc.getQuote();
      const state = calc.getState();
      
      // Read existing eventSetup from session
      const summaryServerData = document.getElementById('summaryServerData');
      const eventSetupJson = summaryServerData?.dataset.eventSetup;
      let eventSetupData = null;
      
      if (eventSetupJson && eventSetupJson !== 'null') {
        eventSetupData = JSON.parse(eventSetupJson);
      }
      
      // Build payload with calculator totals
      const payload = eventSetupData || {};
      payload.calculator = {
        guestCount: quote.guestCount || state?.guestCount || 0,
        numberOfDays: quote.numberOfDays || state?.numberOfDays || 1,
        totals: {
          subtotal: quote.subtotal || 0,
          total: quote.total || 0,
          minimumOrderTotal: quote.minimumOrderTotal || 0
        },
        breakdown: quote.breakdown || [],
        minimumOrderBreakdown: quote.minimumOrderBreakdown || []
      };
      ```
    - **Impact**: Calculator totals are properly collected and structured for saving

  - **Session Save via API** (Lines 250-269):
    - Saves calculator totals to session via `/api/session/event` endpoint
    - Navigates to checkout only after successful save
    - Handles errors gracefully (still navigates if save fails)
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [SAVE TO SESSION] Save calculator totals to session via API
      const response = await fetch('/api/session/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('✅✅✅ - [EVENT SUMMARY VIEW] Calculator totals saved to session:', payload.calculator.totals.total);
        window.location.href = '/checkout';
      } else {
        // Error handling - still navigate
        window.location.href = '/checkout';
      }
      ```
    - **Impact**: Calculator totals are persisted to session before checkout, ensuring checkout route can access them

#### Files Modified

1. **`src/routes/checkout.ts`** (MODIFIED):
   - Lines 63-73: Added order data extraction and smart data source selection logic
   - Lines 75-81: Added comprehensive logging for data source selection
   - Lines 83-107: Updated subtotal, surcharge, and total calculation with order data priority and fallback logic
   - Lines 109-116: Enhanced amount breakdown logging
   - Lines 118-131: Added validation and redirect logic for missing totals
   - Lines 146-189: Updated all payment intent creation calls to use correct data sources
   - Lines 208-231: Updated template data to prefer order's persisted data
   - Total: ~130 lines modified, ~50 lines added

2. **`src/views/wizard/event-summary.hbs`** (MODIFIED):
   - Lines 203-284: Replaced simple checkout button handler with async handler that saves calculator totals
   - Lines 205-207: Added preventDefault() and async function
   - Lines 209-211: Added calculator totals save logic comments
   - Lines 212-248: Added calculator quote/state collection and payload building
   - Lines 250-269: Added session save via API call
   - Lines 270-282: Added error handling with graceful fallback
   - Total: ~80 lines modified, ~75 lines added

#### Technical Details

- **Data Source Priority**:
  1. Order's `eventSetup` (if it has calculator totals) → Most reliable (persisted in database)
  2. Session's `eventSetup` (if order's doesn't have calculator totals) → Fallback
  3. Order's `totalAmount` field (if available and valid) → Additional fallback
  4. Calculated from subtotal + surcharge → Final fallback

- **Calculator Totals Structure**:
  - `calculator.totals.total`: Final total including all modifiers
  - `calculator.totals.subtotal`: Base subtotal before modifiers
  - `calculator.totals.minimumOrderTotal`: Minimum order requirement
  - Checkout route checks both `total` and `subtotal` fields for maximum compatibility

- **Order EventSetup vs Session EventSetup**:
  - Order's `eventSetup` may only contain date/time info (saved from date step)
  - Calculator totals are saved separately (from event-setup step)
  - Checkout route intelligently detects which source has calculator totals

- **Error Handling Flow**:
  1. If total is 0 or invalid → Log comprehensive error details
  2. Redirect to `/event-summary?recalculate=true` → Allows calculator to recalculate
  3. Event-summary calculator recalculates → Shows correct total
  4. User clicks checkout → Totals are saved before navigation
  5. Checkout route reads saved totals → Creates payment intent with correct amount

- **Payment Intent Creation**:
  - All payment intent creation calls now use `eventSetupForCalculation` and `locationForCalculation`
  - Ensures payment intents are created with correct amounts from the right data source
  - Handles both new payment intent creation and existing payment intent reuse

#### Impact

- **User Experience**:
  - Users can now complete checkout without "minimum charge amount" errors
  - Payment amounts are correctly calculated and sent to Stripe
  - Graceful fallback if totals are missing (redirects to event-summary to recalculate)
  - Calculator totals are automatically saved when proceeding to checkout

- **Payment Processing**:
  - Stripe payment intents are created with correct amounts (not zero)
  - Prevents "amount must be greater than or equal to minimum charge amount" errors
  - Payment processing works correctly for all order sizes

- **Data Integrity**:
  - Checkout route prioritizes persisted order data over session data
  - Calculator totals are saved to session before checkout navigation
  - Multiple fallback mechanisms ensure totals are always available

- **Code Quality**:
  - Enhanced logging for better debugging visibility
  - Clear data source selection logic with fallbacks
  - Comprehensive error handling with graceful degradation

- **Bug Fixes**:
  - **FIXED**: Checkout route sending zero amounts to Stripe
  - **FIXED**: Calculator totals not being saved before checkout navigation
  - **FIXED**: Checkout route using stale session data instead of persisted order data
  - **FIXED**: Payment intent creation with incorrect amounts

#### Migration Notes

- **No Database Changes Required**: This is a code logic fix only, no schema changes
- **No API Changes Required**: Existing API endpoints remain the same, only internal logic changed
- **No Session Changes Required**: Session structure remains unchanged, calculator totals are saved to existing `eventSetup` structure
- **Backward Compatible**: Fully backward compatible - existing orders and sessions work correctly
- **Immediate Effect**: Changes take effect immediately - checkout route now correctly calculates and sends payment amounts
- **Testing**: Verify checkout flow works correctly when:
  1. Order's eventSetup has calculator totals → Uses order's data
  2. Order's eventSetup doesn't have calculator totals → Falls back to session's data
  3. Calculator totals are missing → Redirects to event-summary, then saves totals before checkout
  4. Payment intent is created with correct amount (not zero)
  5. Stripe payment processing succeeds without minimum charge errors

---

### December 21, 2025 @ 22:31 - DRY Refactoring: Session Utilities, Coordinate Helpers, and Calculator State Module

**Type**: 🟠 MAJOR CHANGE | 🟢 DIRECTION CHANGE

**Summary**: Comprehensive DRY (Don't Repeat Yourself) refactoring to eliminate code duplication across route handlers, services, and templates. Created centralized utilities for session data extraction (guest count, numberOfDays), coordinate normalization, and calculator state restoration. All route handlers, services, and templates now use these shared utilities instead of duplicated logic, improving maintainability and ensuring consistent behavior across the application.

#### Major Changes

- **Session Data Extraction Utilities** (`src/lib/utils.ts`):
  - **New Function: `extractGuestCountFromSession()`** (Lines 59-90):
    - Centralized guest count extraction from session data
    - Checks `eventSetup.productQuantities['guest-count']` first, falls back to `eventSetup.calculator.guestCount`
    - Returns `null` if not found or invalid
    - Includes comprehensive logging with emoji prefixes (`✅✅✅` for success, `🟡🟡🟡` for attempts)
    - **Code Added**:
      ```typescript
      export function extractGuestCountFromSession(sessionData: any): number | null {
        const eventSetup = sessionData?.eventSetup;
        if (!eventSetup) return null;
        
        // Try productQuantities first
        if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
          const guestCountValue = eventSetup.productQuantities['guest-count'];
          if (typeof guestCountValue === 'number' && guestCountValue > 0) {
            return guestCountValue;
          }
        }
        
        // Fallback to calculator.guestCount
        if (eventSetup.calculator && typeof eventSetup.calculator === 'object') {
          const calculatorGuestCount = eventSetup.calculator.guestCount;
          if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
            return calculatorGuestCount;
          }
        }
        
        return null;
      }
      ```
    - **Impact**: Eliminates duplicated guest count extraction logic across 3 route handlers

  - **New Function: `calculateNumberOfDaysFromDateInfo()`** (Lines 92-105):
    - Centralized numberOfDays calculation from dateInfo session data
    - Calculates from `dateInfo.dates` array length
    - Returns `1` as default if dateInfo invalid or dates array empty
    - Includes logging with warnings for invalid data
    - **Code Added**:
      ```typescript
      export function calculateNumberOfDaysFromDateInfo(dateInfo: any): number {
        if (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0) {
          const numberOfDays = dateInfo.dates.length;
          return numberOfDays;
        }
        return 1; // Default to 1 day if dateInfo invalid or dates array empty
      }
      ```
    - **Impact**: Eliminates duplicated numberOfDays calculation logic across multiple route handlers

- **Coordinate Normalization Utilities** (`src/lib/coordinateUtils.ts` - New File):
  - **New Module** (Lines 1-160):
    - Centralized coordinate normalization utilities shared across services and scripts
    - Respects `MAP_POLYGON` environment variable for coordinate order configuration
    - **Type Definition**: `CoordinatePair = { lat: number; lng: number }`
    - **Code Added**:
      ```typescript
      export type CoordinatePair = { lat: number; lng: number };
      
      export function normalizeCoordinatePair(
        pair: number[] | { lat: number; lng: number } | { latitude: number; longitude: number },
        coordinateOrder?: 'lng-lat' | 'lat-lng'
      ): CoordinatePair | null {
        // Normalizes coordinate pairs from various formats
        // Handles array format [lng, lat] or [lat, lng]
        // Handles object format {lat, lng} or {latitude, longitude}
      }
      
      export function normalizePolygonCoordinates(
        raw: unknown,
        coordinateOrder?: 'lng-lat' | 'lat-lng'
      ): CoordinatePair[] | null {
        // Normalizes entire polygon coordinate arrays
        // Returns null if insufficient points (< 3) or invalid format
      }
      
      export function normalizeCoordinatePairWithAutoDetect(
        pair: number[],
        targetStorageOrder: 'lng-lat' | 'lat-lng'
      ): [number, number] | null {
        // Auto-detects coordinate format based on value ranges (for import scripts)
        // Converts to target storage format
      }
      
      export function coordinateToArray(
        coord: CoordinatePair,
        storageOrder: 'lng-lat' | 'lat-lng'
      ): [number, number] {
        // Converts normalized coordinate to array format in specified storage order
      }
      ```
    - **Impact**: Eliminates duplicated coordinate normalization logic across 3 services and 1 import script

- **Calculator State Restoration Module** (`public/global/js/calculator-state.js` - New File):
  - **New Client-Side Module** (Lines 1-188):
    - Centralized calculator state restoration utilities shared across templates
    - Handles both `calculator.getState()` format and form data format (fallback)
    - Exported as `window.KloiCalculatorState` for global access
    - **Code Added**:
      ```javascript
      window.KloiCalculatorState = {
        restoreCalculatorState: function(calculator, eventSetupData, options) {
          // Main restoration function with fallback logic
          // Restores radios, checkboxes, products, and guest count
          // Options: { skipGuestCount: boolean, skipProducts: boolean }
        },
        restoreFromCalculatorState: function(calculator, calcState) {
          // Restores from calculator.getState() format
        },
        restoreFromFormData: function(calculator, eventSetup) {
          // Restores from form data format
        }
      };
      ```
    - **Impact**: Eliminates duplicated calculator state restoration logic across 2 templates

- **Route Handler Refactoring**:
  - **`src/routes/eventSetup.ts`** (Modified):
    - **Import Addition** (Line 7):
      - Added `extractGuestCountFromSession` and `calculateNumberOfDaysFromDateInfo` imports
      - **Code Added**:
        ```typescript
        import { extractGuestCountFromSession, calculateNumberOfDaysFromDateInfo } from '../lib/utils';
        ```
    - **Guest Count Extraction Refactoring** (Lines 54-78):
      - Replaced 20+ lines of duplicated extraction logic with single utility call
      - **Code Changed**:
        ```typescript
        // BEFORE: 20+ lines of extraction logic
        let guestCount: number | null = null;
        const eventSetup = sessionData.eventSetup as any;
        if (eventSetup) {
          if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
            const guestCountValue = eventSetup.productQuantities['guest-count'];
            // ... more logic
          }
          // ... fallback logic
        }
        
        // AFTER: Single utility call
        const guestCount = extractGuestCountFromSession(sessionData);
        const hasGuestCount = guestCount !== null && guestCount > 0;
        ```
    - **Number of Days Calculation Refactoring** (Lines 80-116):
      - Replaced 30+ lines of calculation logic with utility call (kept database fallback)
      - **Code Changed**:
        ```typescript
        // BEFORE: 30+ lines of calculation logic
        let numberOfDays = 1;
        let hasDateInfo = false;
        const dateInfo = sessionData.dateInfo as any;
        if (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0) {
          numberOfDays = dateInfo.dates.length;
          hasDateInfo = true;
          // ... more logic
        }
        
        // AFTER: Utility call with database fallback
        const dateInfo = sessionData.dateInfo as any;
        let numberOfDays = calculateNumberOfDaysFromDateInfo(dateInfo);
        let hasDateInfo = numberOfDays > 1 || (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0);
        // Database fallback logic retained
        ```
    - **Impact**: Reduced code duplication, improved maintainability

  - **`src/routes/datePicker.ts`** (Modified):
    - **Import Addition** (Line 5):
      - Added `extractGuestCountFromSession` import
      - **Code Added**:
        ```typescript
        import { extractGuestCountFromSession } from '../lib/utils';
        ```
    - **Guest Count Extraction Refactoring** (Lines 47-57):
      - Replaced 20+ lines of duplicated extraction logic with utility call
      - **Code Changed**:
        ```typescript
        // BEFORE: 20+ lines of extraction logic
        const eventSetup = (request.session as any)?.eventSetup;
        let guestCount: number | null = null;
        if (eventSetup) {
          if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
            // ... extraction logic
          }
          // ... fallback logic
        }
        
        // AFTER: Single utility call
        const sessionData = { eventSetup: (request.session as any)?.eventSetup };
        const guestCount = extractGuestCountFromSession(sessionData);
        ```
    - **Impact**: Eliminated code duplication, consistent extraction logic

  - **`src/routes/eventSummary.ts`** (Modified):
    - **Import Addition** (Line 6):
      - Added `extractGuestCountFromSession` and `calculateNumberOfDaysFromDateInfo` imports
      - **Code Added**:
        ```typescript
        import { extractGuestCountFromSession, calculateNumberOfDaysFromDateInfo } from '../lib/utils';
        ```
    - **Guest Count and Number of Days Refactoring** (Lines 40-68):
      - Replaced 30+ lines of duplicated logic with utility calls
      - **Code Changed**:
        ```typescript
        // BEFORE: 30+ lines of extraction and calculation logic
        let guestCount: number | null = null;
        let numberOfDays = 1;
        if (eventSetup) {
          if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
            // ... extraction logic
          }
          // ... fallback logic
        }
        if (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0) {
          numberOfDays = dateInfo.dates.length;
          // ... more logic
        }
        
        // AFTER: Utility calls
        const sessionData = { eventSetup, dateInfo };
        const guestCount = extractGuestCountFromSession(sessionData);
        const numberOfDays = calculateNumberOfDaysFromDateInfo(dateInfo);
        ```
    - **Impact**: Significant code reduction, improved consistency

  - **`src/routes/finalConfirmation.ts`** (Modified):
    - **Type Assertion Fix** (Lines 93-95):
      - Added type assertions for Prisma JsonObject types to fix TypeScript compilation errors
      - **Code Changed**:
        ```typescript
        // BEFORE: Type errors with JsonObject
        const locationData = order.location && typeof order.location === 'object' ? order.location : null;
        const eventSetup = order.eventSetup && typeof order.eventSetup === 'object' ? order.eventSetup : null;
        
        // AFTER: Type assertions added
        const locationData = order.location && typeof order.location === 'object' ? order.location as any : null;
        const eventSetup = order.eventSetup && typeof order.eventSetup === 'object' ? order.eventSetup as any : null;
        ```
    - **Impact**: Fixed TypeScript compilation errors, maintains functionality

- **Service Refactoring**:
  - **`src/services/deliveryLocationsService.ts`** (Modified):
    - **Import Addition** (Line 3):
      - Added `normalizePolygonCoordinates` import
      - **Code Added**:
        ```typescript
        import { normalizePolygonCoordinates } from '../lib/coordinateUtils';
        ```
    - **Removed Coordinate Order Constant** (Lines 4-15):
      - Removed `POLYGON_COORDINATE_ORDER` constant (now handled by coordinateUtils)
      - Removed coordinate order logging (now in coordinateUtils)
    - **Normalize Polygon Function Refactoring** (Lines 69-73):
      - Replaced 45+ lines of coordinate normalization logic with utility call
      - **Code Changed**:
        ```typescript
        // BEFORE: 45+ lines of normalization logic
        function normalizePolygon(raw: unknown): DeliveryLocationPolygonPoint[] | undefined {
          if (!Array.isArray(raw)) return undefined;
          const points: DeliveryLocationPolygonPoint[] = [];
          raw.forEach((pair, _index) => {
            if (Array.isArray(pair)) {
              const first = Number(pair[0]);
              const second = Number(pair[1]);
              if (Number.isFinite(first) && Number.isFinite(second)) {
                let lat: number, lng: number;
                if (POLYGON_COORDINATE_ORDER === 'lng-lat') {
                  lng = first;
                  lat = second;
                  points.push({ lat, lng });
                } else if (POLYGON_COORDINATE_ORDER === 'lat-lng') {
                  lat = first;
                  lng = second;
                  points.push({ lat, lng });
                }
                // ... more logic
              }
            } else if (pair && typeof pair === 'object') {
              // ... object format handling
            }
          });
          return points.length >= 3 ? points : undefined;
        }
        
        // AFTER: Single utility call
        function normalizePolygon(raw: unknown): DeliveryLocationPolygonPoint[] | undefined {
          const normalized = normalizePolygonCoordinates(raw);
          return normalized || undefined;
        }
        ```
    - **Impact**: Eliminated 45+ lines of duplicated coordinate normalization logic

  - **`src/services/areaPolygonService.ts`** (Modified):
    - **Import Addition** (Line 5):
      - Added `normalizeCoordinatePair` import
      - **Code Added**:
        ```typescript
        import { normalizeCoordinatePair } from '../lib/coordinateUtils';
        ```
    - **Removed Coordinate Order Constant** (Lines 9-20):
      - Removed `POLYGON_COORDINATE_ORDER` constant and logging (now in coordinateUtils)
    - **Polygon Path Conversion Refactoring** (Lines 119-145):
      - Replaced 25+ lines of coordinate normalization logic with utility call
      - **Code Changed**:
        ```typescript
        // BEFORE: 25+ lines of normalization logic
        const paths: LatLng[] = [];
        for (const pair of sub.polygon as Array<any>) {
          const a = Number(pair?.[0]);
          const b = Number(pair?.[1]);
          if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
          
          let lat: number, lng: number;
          if (POLYGON_COORDINATE_ORDER === 'lng-lat') {
            lng = a;
            lat = b;
          } else if (POLYGON_COORDINATE_ORDER === 'lat-lng') {
            lat = a;
            lng = b;
          } else {
            console.error('Invalid POLYGON_COORDINATE_ORDER configuration');
            continue;
          }
          paths.push({ lat, lng });
        }
        
        // AFTER: Utility call
        const paths: LatLng[] = [];
        for (const pair of sub.polygon as Array<any>) {
          const normalized = normalizeCoordinatePair(pair);
          if (normalized) {
            paths.push(normalized);
          }
        }
        ```
    - **Impact**: Eliminated duplicated coordinate normalization logic

  - **`src/scripts/importGeoJsonPolygon.ts`** (Modified):
    - **Import Addition** (Line 6):
      - Added `normalizeCoordinatePairWithAutoDetect` import
      - **Code Added**:
        ```typescript
        import { normalizeCoordinatePairWithAutoDetect } from '../lib/coordinateUtils';
        ```
    - **Removed Coordinate Order Constant Comments** (Lines 7-15):
      - Updated comments to reference coordinateUtils module
    - **Normalize Polygon Pairs Function Refactoring** (Lines 109-146):
      - Replaced 35+ lines of coordinate normalization and auto-detection logic with utility call
      - **Code Changed**:
        ```typescript
        // BEFORE: 35+ lines of normalization and auto-detection logic
        function normalizePolygonPairs(pairs: number[][]): number[][] {
          return pairs
            .map((pair) => {
              const first = Number(pair?.[0]);
              const second = Number(pair?.[1]);
              if (!Number.isFinite(first) || !Number.isFinite(second)) {
                return null;
              }
              if (DB_STORAGE_COORDINATE_ORDER === 'lng-lat') {
                if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
                  return [first, second];
                }
                if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
                  return [second, first];
                }
                return [first, second];
              } else {
                // ... more logic
              }
            })
            .filter((pair): pair is number[] => Array.isArray(pair) && pair.length === 2);
        }
        
        // AFTER: Single utility call
        function normalizePolygonPairs(pairs: number[][]): number[][] {
          return pairs
            .map((pair) => normalizeCoordinatePairWithAutoDetect(pair, DB_STORAGE_COORDINATE_ORDER))
            .filter((pair): pair is [number, number] => pair !== null);
        }
        ```
    - **Impact**: Eliminated duplicated coordinate normalization logic with auto-detection

- **Template Refactoring**:
  - **`src/views/wizard/event-summary.hbs`** (Modified):
    - **Script Include Addition** (Line 73):
      - Added calculator-state.js script include
      - **Code Added**:
        ```handlebars
        <script src="/public/global/js/calculator-state.js"></script>
        ```
    - **Calculator State Restoration Refactoring** (Lines 130-220):
      - Replaced 90+ lines of duplicated restoration logic with module call
      - **Code Changed**:
        ```javascript
        // BEFORE: 90+ lines of restoration logic
        if (eventSetup && eventSetup.calculator) {
          const calcState = eventSetup.calculator;
          if (calcState.radios && typeof calcState.radios === 'object') {
            Object.entries(calcState.radios).forEach(([groupId, optionKey]) => {
              calc.setRadio(groupId, optionKey);
              // ... logging
            });
          }
          if (calcState.checkboxes && Array.isArray(calcState.checkboxes)) {
            calcState.checkboxes.forEach(optionKey => {
              calc.setCheckbox(optionKey, true);
              // ... logging
            });
          }
          if (calcState.products && typeof calcState.products === 'object') {
            Object.entries(calcState.products).forEach(([productKey, qty]) => {
              if (productKey !== 'guest-count') {
                calc.setProductQty(productKey, qty);
                // ... logging
              }
            });
          }
        }
        // ... 50+ more lines of fallback logic
        
        // AFTER: Module call
        if (window.KloiCalculatorState && window.KloiCalculatorState.restoreCalculatorState) {
          window.KloiCalculatorState.restoreCalculatorState(calc, eventSetup, { skipGuestCount: false, skipProducts: false });
        }
        calc.setNumberOfDays(numberOfDays);
        calc.recalc();
        ```
    - **Impact**: Eliminated 90+ lines of duplicated calculator state restoration logic

  - **`src/views/wizard/event-setup.hbs`** (Modified):
    - **Script Include Addition** (Line 259):
      - Added calculator-state.js script include
      - **Code Added**:
        ```handlebars
        <script src="/public/global/js/calculator-state.js"></script>
        ```
    - **Deferred Calculator Initialization Refactoring** (Lines 501-520):
      - Added calculator state restoration using module when eventSetup data available
      - Falls back to reading from form inputs if module unavailable
      - **Code Added**:
        ```javascript
        // 🟡🟡🟡 - [CALCULATOR STATE] Restore calculator state from eventSetup data if available
        const eventSetupJsonAttr = serverDataDiv?.getAttribute('data-event-setup');
        if (eventSetupJsonAttr && eventSetupJsonAttr !== 'null' && window.KloiCalculatorState && window.KloiCalculatorState.restoreCalculatorState) {
          try {
            const eventSetup = JSON.parse(eventSetupJsonAttr);
            window.KloiCalculatorState.restoreCalculatorState(calc, eventSetup, { skipGuestCount: false, skipProducts: false });
            calc.setNumberOfDays(currentNumberOfDays);
            calc.recalc();
          } catch (e) {
            // Fallback to reading from form
            restoreCalculatorFromFormInDeferredInit();
          }
        } else {
          restoreCalculatorFromFormInDeferredInit();
        }
        ```
    - **Calculator Update After Pre-Fill Refactoring** (Lines 1138-1183):
      - Added calculator state restoration using module when eventSetup data available
      - Falls back to reading from form inputs
      - **Code Added**:
        ```javascript
        // 🟡🟡🟡 - [CALCULATOR STATE] Try to restore from eventSetup data first
        const eventSetupJsonAttr = serverDataDiv.getAttribute('data-event-setup');
        if (eventSetupJsonAttr && eventSetupJsonAttr !== 'null' && window.KloiCalculatorState && window.KloiCalculatorState.restoreCalculatorState) {
          try {
            const eventSetup = JSON.parse(eventSetupJsonAttr);
            window.KloiCalculatorState.restoreCalculatorState(calc, eventSetup, { skipGuestCount: false, skipProducts: false });
            calc.recalc();
          } catch (e) {
            // Fallback to reading from form
            updateCalculatorFromForm();
          }
        } else {
          updateCalculatorFromForm();
        }
        ```
    - **Impact**: Improved calculator state restoration consistency, reduced code duplication

- **Documentation Updates** (`docs/APP-WIDE-SERVICES-AND-MODULES.md`):
  - **New Section: "Session Data Extraction Utilities"** (After line 235):
    - Documents `extractGuestCountFromSession()` and `calculateNumberOfDaysFromDateInfo()` functions
    - Includes code examples showing usage in route handlers
    - Notes that these should be used instead of duplicating extraction logic
    - **Code Added**:
      ```markdown
      ### Session Data Extraction Utilities
      
      - Centralized utilities for extracting common session data to eliminate DRY violations
      - Located in `src/lib/utils.ts`
      - **Available Functions:**
        - `extractGuestCountFromSession(sessionData: any): number | null`
        - `calculateNumberOfDaysFromDateInfo(dateInfo: any): number`
      - Example usage and code references included
      ```

  - **New Section: "Coordinate Normalization Utilities"** (After Session Data Extraction Utilities):
    - Documents `coordinateUtils.ts` module
    - Explains `MAP_POLYGON` environment variable usage
    - Includes examples for services and scripts
    - **Code Added**:
      ```markdown
      ### Coordinate Normalization Utilities
      
      - Centralized utilities for coordinate normalization shared across services and scripts
      - Located in `src/lib/coordinateUtils.ts`
      - Respects `MAP_POLYGON` environment variable for coordinate order
      - **Available Functions:**
        - `normalizeCoordinatePair(pair, coordinateOrder?): CoordinatePair | null`
        - `normalizePolygonCoordinates(raw, coordinateOrder?): CoordinatePair[] | null`
        - `normalizeCoordinatePairWithAutoDetect(pair, targetStorageOrder): [number, number] | null`
      - Example usage and code references included
      ```

  - **New Section: "Calculator State Management (Client-Side)"** (After Coordinate Normalization Utilities):
    - Documents `calculator-state.js` module
    - Includes usage examples for templates
    - Notes when to use `restoreCalculatorState()` vs individual restore functions
    - **Code Added**:
      ```markdown
      ### Calculator State Management (Client-Side)
      
      - Centralized module for calculator state restoration shared across templates
      - Located in `public/global/js/calculator-state.js`
      - **Available Functions:**
        - `restoreCalculatorState(calculator, eventSetupData, options)`
        - `restoreFromCalculatorState(calculator, calcState)`
        - `restoreFromFormData(calculator, eventSetup)`
      - Example usage and code references included
      ```

  - **Updated "Checklist for New Pages/Routes"** (Lines 275-289):
    - Added item: "Use session utilities (`extractGuestCountFromSession`, `calculateNumberOfDaysFromDateInfo`) instead of duplicating extraction logic"
    - Added item: "For coordinate operations, use `coordinateUtils` module"
    - Added item: "Include `calculator-state.js` when restoring calculator state from session data"
    - **Code Added**:
      ```markdown
      - Session
        - **Use session utilities** (`extractGuestCountFromSession`, `calculateNumberOfDaysFromDateInfo`) instead of duplicating extraction logic.
      - Coordinate Operations
        - **For coordinate operations, use `coordinateUtils` module** instead of duplicating normalization logic.
        - Ensure `MAP_POLYGON` environment variable is set correctly (`'lng-lat'` or `'lat-lng'`).
      - Calculator State Restoration
        - **Include `calculator-state.js`** when restoring calculator state from session data.
        - Use `window.KloiCalculatorState.restoreCalculatorState()` instead of duplicating restoration logic.
      ```

  - **Updated "Where to Extend and Reuse"** (Lines 291-297):
    - Added: "Session utilities: `src/lib/utils.ts` (extend with new extraction helpers as needed)"
    - Added: "Coordinate utilities: `src/lib/coordinateUtils.ts` (extend for new coordinate operations)"
    - Added: "Calculator state: `public/global/js/calculator-state.js` (extend for new restoration patterns)"
    - **Code Added**:
      ```markdown
      - **Session utilities: `src/lib/utils.ts`** (extend with new extraction helpers as needed, e.g., `extractGuestCountFromSession`, `calculateNumberOfDaysFromDateInfo`).
      - **Coordinate utilities: `src/lib/coordinateUtils.ts`** (extend for new coordinate operations, e.g., `normalizeCoordinatePair`, `normalizePolygonCoordinates`).
      - **Calculator state: `public/global/js/calculator-state.js`** (extend for new restoration patterns, e.g., `restoreCalculatorState`, `restoreFromCalculatorState`).
      ```

#### Files Modified

1. **`src/lib/utils.ts`** (MODIFIED):
   - Lines 59-90: Added `extractGuestCountFromSession()` function
   - Lines 92-105: Added `calculateNumberOfDaysFromDateInfo()` function
   - Total: 2 new utility functions, ~50 lines added

2. **`src/lib/coordinateUtils.ts`** (CREATED):
   - Complete new file with 4 exported functions
   - Lines 1-160: Complete coordinate normalization module
   - Functions: `normalizeCoordinatePair()`, `normalizePolygonCoordinates()`, `normalizeCoordinatePairWithAutoDetect()`, `coordinateToArray()`
   - Total: ~160 lines

3. **`public/global/js/calculator-state.js`** (CREATED):
   - Complete new client-side module
   - Lines 1-188: Complete calculator state restoration module
   - Functions: `restoreCalculatorState()`, `restoreFromCalculatorState()`, `restoreFromFormData()`
   - Total: ~188 lines

4. **`src/routes/eventSetup.ts`** (MODIFIED):
   - Line 7: Added imports for session utilities
   - Lines 54-78: Refactored guest count extraction (replaced 20+ lines with utility call)
   - Lines 80-116: Refactored numberOfDays calculation (replaced 30+ lines with utility call, kept database fallback)
   - Line 123: Fixed eventSetup variable reference for template data
   - Total: ~50 lines removed, 3 lines added

5. **`src/routes/datePicker.ts`** (MODIFIED):
   - Line 5: Added import for session utilities
   - Lines 47-57: Refactored guest count extraction (replaced 20+ lines with utility call)
   - Line 57: Fixed eventSetup variable reference in logging
   - Total: ~20 lines removed, 2 lines added

6. **`src/routes/eventSummary.ts`** (MODIFIED):
   - Line 6: Added imports for session utilities
   - Lines 40-68: Refactored guest count and numberOfDays extraction/calculation (replaced 30+ lines with utility calls)
   - Total: ~30 lines removed, 2 lines added

7. **`src/routes/finalConfirmation.ts`** (MODIFIED):
   - Lines 93-95: Added type assertions (`as any`) for Prisma JsonObject types to fix TypeScript compilation errors
   - Total: 3 lines modified

8. **`src/services/deliveryLocationsService.ts`** (MODIFIED):
   - Line 3: Added import for coordinate utilities
   - Lines 4-15: Removed `POLYGON_COORDINATE_ORDER` constant and logging (now in coordinateUtils)
   - Lines 69-73: Refactored `normalizePolygon()` function (replaced 45+ lines with utility call)
   - Total: ~50 lines removed, 1 line added

9. **`src/services/areaPolygonService.ts`** (MODIFIED):
   - Line 5: Added import for coordinate utilities
   - Lines 9-20: Removed `POLYGON_COORDINATE_ORDER` constant and logging (now in coordinateUtils)
   - Lines 119-145: Refactored polygon path conversion (replaced 25+ lines with utility call)
   - Total: ~30 lines removed, 1 line added

10. **`src/scripts/importGeoJsonPolygon.ts`** (MODIFIED):
    - Line 6: Added import for coordinate utilities
    - Lines 7-15: Updated comments to reference coordinateUtils module
    - Lines 109-146: Refactored `normalizePolygonPairs()` function (replaced 35+ lines with utility call)
    - Total: ~40 lines removed, 1 line added

11. **`src/views/wizard/event-summary.hbs`** (MODIFIED):
    - Line 73: Added script include for calculator-state.js
    - Lines 130-220: Refactored calculator state restoration (replaced 90+ lines with module call)
    - Total: ~90 lines removed, 1 line added

12. **`src/views/wizard/event-setup.hbs`** (MODIFIED):
    - Line 259: Added script include for calculator-state.js
    - Lines 501-520: Added calculator state restoration using module in deferred initialization
    - Lines 1138-1183: Added calculator state restoration using module after form pre-fill
    - Total: ~50 lines added (module integration), form reading logic retained as fallback

13. **`docs/APP-WIDE-SERVICES-AND-MODULES.md`** (MODIFIED):
    - Added "Session Data Extraction Utilities" section with code examples
    - Added "Coordinate Normalization Utilities" section with code examples
    - Added "Calculator State Management (Client-Side)" section with code examples
    - Updated "Checklist for New Pages/Routes" with new requirements
    - Updated "Where to Extend and Reuse" section with new utilities
    - Total: ~150 lines added

#### Technical Details

- **Code Reduction**: Eliminated ~400+ lines of duplicated code across the codebase
- **Consistency**: All route handlers, services, and templates now use the same extraction/calculation logic
- **Maintainability**: Changes to extraction logic only need to be made in one place
- **Backward Compatibility**: All utilities handle edge cases gracefully, maintaining existing behavior
- **Type Safety**: TypeScript types maintained throughout refactoring
- **Logging**: All utilities follow existing logging conventions (emoji-prefixed logs)

- **Session Utilities**:
  - Guest count extraction: Checks `productQuantities['guest-count']` first, falls back to `calculator.guestCount`
  - Number of days calculation: Calculates from `dateInfo.dates` array length, defaults to 1
  - Both utilities include comprehensive logging for debugging

- **Coordinate Utilities**:
  - Respects `MAP_POLYGON` environment variable (`'lng-lat'` or `'lat-lng'`)
  - Supports multiple input formats: arrays `[lng, lat]` or `[lat, lng]`, objects `{lat, lng}` or `{latitude, longitude}`
  - Auto-detection function available for import scripts (not used by services for security)
  - Returns `null` for invalid inputs, requires minimum 3 points for polygons

- **Calculator State Module**:
  - Handles both calculator state format (`calculator.getState()`) and form data format (fallback)
  - Restores radios, checkboxes, products, and guest count
  - Options allow skipping guest count or products if needed
  - Includes comprehensive logging for debugging

#### Dependencies

- **Session Utilities**: No new dependencies, uses existing TypeScript and logging infrastructure
- **Coordinate Utilities**: No new dependencies, uses existing TypeScript infrastructure
- **Calculator State Module**: No new dependencies, uses existing JavaScript and calculator API

#### Testing Considerations

- Verify guest count extraction works correctly in all route handlers
- Verify numberOfDays calculation works correctly in all route handlers
- Test coordinate normalization with various input formats
- Test coordinate normalization with different `MAP_POLYGON` values
- Verify calculator state restoration works on event-summary page
- Verify calculator state restoration works on event-setup page (both immediate and deferred initialization)
- Test fallback logic when calculator state module unavailable
- Verify backward compatibility with existing session data structures

#### Impact

- **Code Quality**: 
  - Eliminated ~400+ lines of duplicated code
  - Improved maintainability - changes only need to be made in one place
  - Consistent behavior across all route handlers and services
  - Better error handling and logging

- **Developer Experience**:
  - Easier to add new route handlers - just import and use utilities
  - Clear documentation in `APP-WIDE-SERVICES-AND-MODULES.md`
  - Consistent patterns across codebase

- **Performance**:
  - No performance impact - utilities are lightweight functions
  - Same execution time, just centralized

- **Backward Compatibility**:
  - Fully backward compatible - all utilities handle edge cases
  - Existing session data structures work without changes
  - Existing coordinate formats supported

#### Migration Notes

- **No Database Changes Required**: This is a code refactoring only
- **No API Changes Required**: All API endpoints remain unchanged
- **No Session Changes Required**: Session structure remains the same
- **Environment Variable**: Ensure `MAP_POLYGON` is set correctly (`'lng-lat'` or `'lat-lng'`) for coordinate utilities
- **Backward Compatible**: Fully backward compatible - existing code continues to work
- **Immediate Effect**: Changes take effect immediately after deployment

---

### December 20, 2025 @ 17:18 - Final Confirmation Route Implementation

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented the missing `/final-confirmation` route handler and view template to resolve 404 errors after successful payment completion. The implementation includes a complete route handler that retrieves order details, validates payment status, formats data for display, and renders a comprehensive confirmation page. Additionally, added a `formatDate` Handlebars helper for consistent date formatting across templates. This fixes the issue where users were redirected to `/final-confirmation?order=<orderId>` after successful payment but encountered a "Route not found" error.

#### Major Changes

- **New Final Confirmation Route Handler** (`src/routes/finalConfirmation.ts` - New File):
  - **Route Implementation** (Lines 1-153):
    - Created complete route handler for `GET /final-confirmation` endpoint
    - Extracts `order` query parameter from request URL
    - Validates order ID presence and format
    - Retrieves order from database using Prisma with comprehensive field selection
    - Validates order exists and optionally verifies session ownership for security
    - Retrieves latest payment status from payment service provider
    - Formats amounts (subtotal, surcharge, total) for display with 2 decimal places
    - Parses JSON fields (location, eventDetails, eventSetup) from order data
    - Calculates price breakdown from event setup and location data
    - Formats dates for proper display in templates
    - Renders final confirmation view with all order details
    - **Code Added**:
      ```typescript
      app.get('/final-confirmation', async (request: FastifyRequest, reply: FastifyReply) => {
        // Validates order ID from query parameter
        // Retrieves order from database
        // Gets payment status from payment service
        // Formats and renders confirmation page
      });
      ```
    - **Error Handling**: Comprehensive error handling with logging for missing order ID, order not found, payment retrieval failures, and rendering errors
    - **Security**: Validates order belongs to session (with warning log, allows access for valid order IDs)
    - **Impact**: Resolves 404 error after payment completion, provides users with order confirmation page

- **Route Registration** (`src/routes/index.ts`):
  - **Import Statement** (Line 13):
    - Added import for `finalConfirmationRoutes` module
    - **Code Added**:
      ```typescript
      import finalConfirmationRoutes from './finalConfirmation';
      ```
    - **Impact**: Makes final confirmation route available to application
  
  - **Route Registration** (Line 39):
    - Registered `finalConfirmationRoutes` in protected wizard routes section
    - Positioned after `checkoutRoutes` registration
    - **Code Added**:
      ```typescript
      await _app.register(finalConfirmationRoutes);
      ```
    - **Impact**: Final confirmation route is now accessible and protected by session validation hooks

- **Final Confirmation View Template** (`src/views/wizard/final-confirmation.hbs` - New File):
  - **Template Structure** (Lines 1-200):
    - Created comprehensive Handlebars template for order confirmation display
    - Reuses checkout CSS styles for consistent design
    - **Success Message Section** (Lines 7-20):
      - Displays success icon (SVG checkmark)
      - Shows "Payment Successful" heading
      - Provides confirmation message about email notification
      - **Code Added**:
        ```handlebars
        <section class="checkout-section success-message">
          <div class="success-icon">...</div>
          <h2>Payment Successful</h2>
          <p>Your order has been processed and confirmed...</p>
        </section>
        ```
    
    - **Order Details Section** (Lines 22-120):
      - Displays order number and order ID
      - Shows payment status with color-coded badges (succeeded/pending/failed)
      - Displays paid timestamp if available
      - Shows location information (address, area, city)
      - Displays customer information (name, phone, email)
      - Shows event details (event type, notes)
      - Displays price breakdown (subtotal, surcharge, total paid)
      - Shows order date and order status
      - **Code Added**:
        ```handlebars
        <section class="checkout-section order-summary">
          <h2>Order Details</h2>
          <!-- Order number, payment status, location, customer, event, pricing -->
        </section>
        ```
    
    - **Next Steps Section** (Lines 122-131):
      - Provides information about what happens next
      - Includes contact instructions with order number
      - **Code Added**:
        ```handlebars
        <section class="checkout-section next-steps">
          <h2>What's Next?</h2>
          <p>We've received your order and payment...</p>
        </section>
        ```
    
    - **Client-Side Scripting** (Lines 133-140):
      - Initializes page with console logging for debugging
      - Logs order number and payment status
      - **Code Added**:
        ```javascript
        console.log('✅✅✅ - [FINAL CONFIRMATION] Page loaded successfully');
        ```
    
    - **Custom Styles** (Lines 142-200):
      - Success message styling with green background
      - Payment status badge styling (succeeded: green, pending: orange, failed: red)
      - Next steps section styling with gray background
      - Responsive design matching checkout page
      - **Code Added**:
        ```css
        .final-confirmation .success-message { ... }
        .final-confirmation .payment-status.succeeded { ... }
        ```
    - **Impact**: Provides professional, user-friendly confirmation page with all order details

- **Date Formatting Helper** (`src/app.ts`):
  - **Handlebars Helper Registration** (Lines 60-75):
    - Added `formatDate` helper for consistent date formatting across templates
    - Handles Date objects, date strings, and null/undefined values
    - Formats dates as: "Month Day, Year, HH:MM AM/PM" (e.g., "December 20, 2025, 05:17 PM")
    - Returns "N/A" for null/undefined, "Invalid Date" for invalid dates
    - **Code Added**:
      ```typescript
      handlebars.registerHelper('formatDate', function(date: any) {
        if (!date) return 'N/A';
        try {
          const dateObj = date instanceof Date ? date : new Date(date);
          if (isNaN(dateObj.getTime())) return 'Invalid Date';
          return dateObj.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } catch (error) {
          return 'Invalid Date';
        }
      });
      ```
    - **Usage in Templates**: Used in final-confirmation.hbs for `order.paidAt` and `order.createdAt` display
    - **Impact**: Provides consistent, readable date formatting across all templates

#### Files Modified

1. **`src/routes/finalConfirmation.ts`** (New File, 153 lines):
   - Complete route handler implementation
   - Order retrieval and validation logic
   - Payment status retrieval
   - Data formatting and template rendering

2. **`src/routes/index.ts`** (Modified, 2 changes):
   - Added import for `finalConfirmationRoutes` (Line 13)
   - Registered route in protected wizard routes section (Line 39)

3. **`src/views/wizard/final-confirmation.hbs`** (New File, 200 lines):
   - Complete Handlebars template for confirmation page
   - Success message, order details, and next steps sections
   - Custom CSS styling
   - Client-side JavaScript initialization

4. **`src/app.ts`** (Modified, 1 addition):
   - Added `formatDate` Handlebars helper registration (Lines 60-75)

#### Technical Details

- **Route Path**: `GET /final-confirmation?order=<orderId>`
- **Query Parameter**: `order` (required) - UUID of the order
- **Session Validation**: Route is protected by wizard session validation hooks
- **Payment Status**: Retrieves latest status from payment service provider (Stripe)
- **Error Responses**:
  - `400`: Missing or invalid order ID
  - `404`: Order not found
  - `500`: Server error during processing
- **Data Flow**:
  1. Extract order ID from query parameter
  2. Validate order ID format
  3. Retrieve order from database
  4. Verify order exists
  5. Optionally validate session ownership
  6. Retrieve payment status from payment service
  7. Format amounts and dates
  8. Parse JSON fields
  9. Render confirmation template with all data

#### Dependencies

- Uses existing `paymentService` for payment status retrieval
- Uses existing `prisma` client for database operations
- Uses existing `generatePageClass` utility for page class generation
- Integrates with existing session validation hooks
- Reuses checkout CSS styles for consistent design

#### Testing Considerations

- Test with valid order ID after successful payment
- Test with invalid/missing order ID
- Test with order ID from different session (should still work but log warning)
- Test with orders that have different payment statuses
- Verify date formatting displays correctly
- Verify all order details render properly
- Test responsive design on different screen sizes

---

### December 19, 2025 @ 17:20 - Database-Driven Taxes and Fees System Implementation

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Implemented a comprehensive database-driven taxes and fees system for the live calculator, replacing the hardcoded `taxPercent` option with configurable taxes and fees loaded from a new `taxesFees` table. The system filters taxes/fees by country code, applies them to order total (after minimum order calculation), supports both percentage and fixed calculations, and includes active/inactive status and time-based rules via startDate/endDate fields. Taxes and fees are loaded server-side and passed to the calculator via route handlers, ensuring accurate pricing calculations based on location.

#### Major Changes

- **Database Migration** (`prisma/migrations/20251219130502_create_taxes_fees_table/migration.sql`):
  - **New TaxesFees Table** (Lines 3-20):
    - Created `taxesFees` table with comprehensive tax/fee configuration fields
    - Fields: `id` (TEXT UUID primary key), `code` (VARCHAR(50) UNIQUE), `name` (VARCHAR(100)), `type` (VARCHAR(20) - 'TAX' or 'FEE'), `category` (VARCHAR(50)), `country_code` (VARCHAR(10)), `applies_to` (VARCHAR(50) - 'ORDER_TOTAL' or 'SUBTOTAL'), `calculation_type` (VARCHAR(20) - 'PERCENTAGE' or 'FIXED'), `rate_value` (DECIMAL(10, 2)), `currency` (VARCHAR(10)), `active` (BOOLEAN DEFAULT TRUE), `startDate` (TIMESTAMP NULL), `endDate` (TIMESTAMP NULL), `createdAt`, `updatedAt`
    - **Indexes Created**:
      - Unique index on `code` for tax/fee identification
      - Index on `country_code` for efficient country-based filtering
      - Index on `active` for filtering active taxes/fees
      - Composite index on `(startDate, endDate)` for date range queries
    - **Seed Data**: Inserted initial taxes/fees (VAT_AE 5%, SERVICE_FEE 3%, PROC_FEE_150 AED 150) with `active = TRUE` and NULL dates
    - **Code Added**:
      ```sql
      CREATE TABLE IF NOT EXISTS "taxesFees" (
          "id" TEXT NOT NULL,
          "code" VARCHAR(50) NOT NULL,
          "name" VARCHAR(100) NOT NULL,
          "type" VARCHAR(20) NOT NULL,
          "category" VARCHAR(50) NOT NULL,
          "country_code" VARCHAR(10) NOT NULL,
          "applies_to" VARCHAR(50) NOT NULL,
          "calculation_type" VARCHAR(20) NOT NULL,
          "rate_value" DECIMAL(10, 2) NOT NULL,
          "currency" VARCHAR(10) NOT NULL,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "startDate" TIMESTAMP(3),
          "endDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "taxesFees_pkey" PRIMARY KEY ("id")
      );
      ```
    - **Impact**: Provides flexible, database-driven tax/fee management with country-specific rules and time-based activation

- **Prisma Schema Update** (`prisma/schema.prisma`):
  - **New TaxesFees Model** (Lines 98-118):
    - Added `TaxesFees` model matching table structure with all fields including `active`, `startDate`, `endDate`
    - Used `@@map("taxesFees")` to match table name
    - Added indexes matching migration SQL
    - **Code Added**:
      ```prisma
      model TaxesFees {
        id              String    @id @default(uuid())
        code            String    @unique @db.VarChar(50)
        name            String    @db.VarChar(100)
        type            String    @db.VarChar(20)
        category        String    @db.VarChar(50)
        country_code    String    @db.VarChar(10)
        applies_to      String    @db.VarChar(50)
        calculation_type String   @db.VarChar(20)
        rate_value      Decimal   @db.Decimal(10, 2)
        currency        String    @db.VarChar(10)
        active          Boolean   @default(true)
        startDate       DateTime? @db.Timestamptz(3)
        endDate         DateTime? @db.Timestamptz(3)
        createdAt       DateTime  @default(now()) @db.Timestamptz(3)
        updatedAt       DateTime  @updatedAt @db.Timestamptz(3)

        @@index([country_code], map: "taxesFees_country_code_idx")
        @@index([active], map: "taxesFees_active_idx")
        @@index([startDate, endDate], map: "taxesFees_dates_idx")
        @@map("taxesFees")
      }
      ```
    - **Impact**: Prisma client now includes TaxesFees model for type-safe database operations

- **New TaxesFeesService** (`src/services/taxesFeesService.ts` - New File):
  - **Service Class** (Lines 30-120):
    - Follows pattern from `MenuService` (static methods, emoji-prefixed logging)
    - `getTaxesFeesByCountry(countryCode: string, effectiveDate?: Date)`: Fetches active taxes/fees for country
      - Filters by `country_code`, `active = TRUE`, and date ranges (`startDate IS NULL OR startDate <= effectiveDate`, `endDate IS NULL OR endDate >= effectiveDate`)
      - Returns array sorted by type (TAX first) then by creation date
      - Handles errors gracefully (logs, returns empty array)
      - Converts Prisma Decimal to number for `rate_value`
    - `getCountryCodeFromLocation(locationData: any)`: Extracts country code from location data
      - Checks `locationData.components.country` first, then `locationData.country`
      - Maps country names to codes (e.g., 'UAE' -> 'AE', 'United Arab Emirates' -> 'AE')
      - Returns 'AE' as default if country not found
    - **Type Definitions**:
      - `TaxFee` interface matching table structure
      - `CalculationType` type: 'PERCENTAGE' | 'FIXED'
      - `TaxFeeType` type: 'TAX' | 'FEE'
      - `AppliesTo` type: 'ORDER_TOTAL' | 'SUBTOTAL'
    - **Code Added**:
      ```typescript
      export class TaxesFeesService {
        static async getTaxesFeesByCountry(countryCode: string, effectiveDate?: Date): Promise<TaxFee[]> {
          const now = effectiveDate || new Date();
          const taxesFees = await prisma.taxesFees.findMany({
            where: {
              country_code: countryCode,
              active: true,
              AND: [
                { OR: [{ startDate: null }, { startDate: { lte: now } }] },
                { OR: [{ endDate: null }, { endDate: { gte: now } }] }
              ]
            },
            orderBy: [{ type: 'asc' }, { createdAt: 'asc' }]
          });
          return taxesFees.map(tf => ({ ...tf, rate_value: Number(tf.rate_value) }));
        }
        
        static getCountryCodeFromLocation(locationData: any): string {
          // Extract and map country code from location data
        }
      }
      ```
    - **Impact**: Provides centralized service for loading and processing taxes/fees based on country and date

- **Calculator Engine Updates** (`public/global/js/kloi_calculator.js`):
  - **Constructor Enhancement** (Lines 19-38):
    - Added `taxesFees` parameter to constructor options
    - Store `taxesFees` array in engine instance
    - Added logging for taxes/fees count
    - **Code Updated**:
      ```javascript
      constructor(menuSections, options = {}) {
        // ... existing code ...
        this.taxesFees = Array.isArray(options.taxesFees) ? options.taxesFees : []
        console.log('🟡🟡🟡 - [KLOI CALC] Taxes/fees loaded:', this.taxesFees.length)
      }
      ```
    - **Impact**: Calculator engine now accepts and stores taxes/fees configuration

  - **New applyTaxesFees() Method** (Lines 137-175):
    - Applies taxes/fees to order total after minimum order calculation
    - For `PERCENTAGE`: calculates as `currentTotal * (rate_value / 100)` (compound)
    - For `FIXED`: adds `rate_value` directly
    - Applies in order (TAX first, then FEE, as sorted by service)
    - Returns breakdown array with name, type, category, code, calculation_type, rate_value, amount
    - **Code Added**:
      ```javascript
      applyTaxesFees(baseAmount) {
        if (!this.taxesFees || this.taxesFees.length === 0) {
          return { total: baseAmount, breakdown: [] }
        }
        let currentTotal = baseAmount
        const breakdown = []
        this.taxesFees.forEach((taxFee) => {
          if (taxFee.applies_to !== 'ORDER_TOTAL') return
          let amount = 0
          if (taxFee.calculation_type === 'PERCENTAGE') {
            amount = currentTotal * (taxFee.rate_value / 100)
          } else if (taxFee.calculation_type === 'FIXED') {
            amount = taxFee.rate_value
          }
          if (amount > 0) {
            currentTotal += amount
            breakdown.push({ name: taxFee.name, type: taxFee.type, ... })
          }
        })
        return { total: currentTotal, breakdown }
      }
      ```
    - **Impact**: Taxes/fees are applied correctly after minimum order, with compound percentage calculations

  - **Updated calculate() Method** (Lines 256-280):
    - Calls `applyTaxesFees()` after minimum order logic
    - Adds taxes/fees breakdown to return object
    - Includes taxes/fees in `modifiersMeta` for display
    - **Code Updated**:
      ```javascript
      // After minimum order logic
      const taxesFeesResult = this.applyTaxesFees(total)
      total = taxesFeesResult.total
      const taxesFeesBreakdown = taxesFeesResult.breakdown
      
      // Add to modifiersMeta for display
      taxesFeesBreakdown.forEach((tf) => {
        modifiersMeta.push({ name: tf.name, delta: tf.amount, meta: { ... } })
      })
      
      return { ..., taxesFeesBreakdown }
      ```
    - **Impact**: Calculator now includes taxes/fees in total calculation and breakdown

  - **Removed taxPercent Option** (Lines 406-420):
    - Removed hardcoded `taxPercent` modifier logic from `initFromMenuSections()`
    - Calculator no longer accepts `taxPercent` option
    - **Code Removed**:
      ```javascript
      // REMOVED:
      if (options.taxPercent && options.taxPercent > 0) {
        const pct = toNumber(options.taxPercent)
        engine.use(function tax({ subtotal }) {
          const taxAmount = subtotal * (pct / 100)
          return { total: subtotal + taxAmount, meta: { taxPercent: pct, taxAmount } }
        })
      }
      ```
    - **Impact**: Breaking change - `taxPercent` option removed, must use database taxes/fees instead

- **Calculator UI Updates** (`public/global/js/kloi_calculator.js`):
  - **Updated render() Method** (Lines 344-400):
    - Includes `taxesFeesBreakdown` in destructuring from `calculate()`
    - Taxes/fees automatically displayed in modifiers section via `modifiersMeta`
    - Uses existing `calc-mod` class for styling
    - **Code Updated**:
      ```javascript
      render() {
        const { ..., taxesFeesBreakdown } = this.engine.calculate()
        // Taxes/fees displayed via modifiersMeta (already includes taxes/fees breakdown)
      }
      ```
    - **Impact**: Taxes/fees breakdown displayed in calculator UI automatically

- **Route Handler Updates** (`src/routes/eventSetup.ts`):
  - **Import Addition** (Line 4):
    - Added `TaxesFeesService` import
    - **Code Added**:
      ```typescript
      import { TaxesFeesService } from '../services/taxesFeesService';
      ```
  
  - **Taxes/Fees Loading** (Lines 117-130):
    - Extract country code from `locationData` using `TaxesFeesService.getCountryCodeFromLocation()`
    - Fetch taxes/fees using `TaxesFeesService.getTaxesFeesByCountry(countryCode)`
    - Handle errors gracefully (log, continue without taxes/fees)
    - **Code Added**:
      ```typescript
      let taxesFees = [];
      try {
        const locationData = sessionData.locationData;
        if (locationData) {
          const countryCode = TaxesFeesService.getCountryCodeFromLocation(locationData);
          taxesFees = await TaxesFeesService.getTaxesFeesByCountry(countryCode);
        }
      } catch (taxesFeesError) {
        console.error('❗❗❗ - [EVENT SETUP ROUTE] Error loading taxes/fees:', taxesFeesError);
      }
      ```
  
  - **Template Data Enhancement** (Lines 121-135):
    - Added `taxesFees` and `taxesFeesJson` to template data
    - **Code Added**:
      ```typescript
      taxesFees: taxesFees,
      taxesFeesJson: JSON.stringify(taxesFees)
      ```
    - **Impact**: Taxes/fees available to template for calculator initialization

- **Route Handler Updates** (`src/routes/eventSummary.ts`):
  - **Import Addition** (Line 4):
    - Added `TaxesFeesService` import
  
  - **Taxes/Fees Loading** (Lines 69-82):
    - Extract country code from `locationData`
    - Fetch taxes/fees using `TaxesFeesService.getTaxesFeesByCountry(countryCode)`
    - Handle errors gracefully
  
  - **Template Data Enhancement** (Lines 255-274):
    - Added `taxesFees` and `taxesFeesJson` to template data
    - **Impact**: Taxes/fees available to template for calculator initialization

- **Template Updates** (`src/views/wizard/event-setup.hbs`):
  - **Server Data Attribute** (Line 242):
    - Added `data-taxes-fees="{{taxesFeesJson}}"` attribute to `serverData` div
    - **Code Updated**:
      ```handlebars
      <div id="serverData" ... data-taxes-fees="{{taxesFeesJson}}" ...>
      ```
  
  - **JavaScript Taxes/Fees Reading** (Lines 293-304):
    - Read `taxesFees` from server data attribute
    - Parse JSON if string
    - **Code Added**:
      ```javascript
      const taxesFeesData = serverDataDiv?.dataset.taxesFees;
      let taxesFeesArray = [];
      if (taxesFeesData && taxesFeesData !== 'null' && taxesFeesData !== '') {
        try {
          taxesFeesArray = JSON.parse(taxesFeesData);
        } catch (e) {
          console.error('❗❗❗ - [EVENT SETUP JS] Error parsing taxes/fees data:', e);
        }
      }
      ```
  
  - **Calculator Initialization Updates** (Lines 401, 460):
    - Updated `initFromMenuSections()` calls to pass `taxesFees: taxesFeesArray` instead of `taxPercent: 0`
    - Updated deferred initialization to include taxes/fees
    - **Code Updated**:
      ```javascript
      // OLD: { taxPercent: 0, numberOfDays: numberOfDays }
      // NEW:
      calc = window.KloiCalculator.initFromMenuSections(menuSectionsData, { taxesFees: taxesFeesArray, numberOfDays: numberOfDays });
      ```
    - **Impact**: Calculator initialized with database taxes/fees instead of hardcoded tax percent

- **Template Updates** (`src/views/wizard/event-summary.hbs`):
  - **Server Data Attribute** (Line 66):
    - Added `data-taxes-fees="{{taxesFeesJson}}"` attribute to `summaryServerData` div
  
  - **JavaScript Taxes/Fees Reading** (Lines 82-95):
    - Read and parse `taxesFees` from server data
  
  - **Calculator Initialization Update** (Line 104):
    - Updated `initFromMenuSections()` call to pass `taxesFees: taxesFeesArray` instead of `taxPercent: 0`
    - **Impact**: Calculator initialized with database taxes/fees on event-summary page

#### Technical Details

- **Calculation Order**:
  1. Calculate subtotal (line items: radios, checkboxes, products)
  2. Apply minimum order if subtotal < minimumOrderTotal
  3. Apply taxes/fees to order total (after minimum order)
     - For PERCENTAGE: apply to running total (compound)
     - For FIXED: add fixed amount
  4. Return final total

- **Percentage Calculation**:
  - Apply percentage to the current total (after previous taxes/fees)
  - Example: Subtotal 1000, VAT 5% = 50, Service Fee 3% of 1050 = 31.50, Total = 1081.50

- **Fixed Fee Calculation**:
  - Add fixed amount to current total
  - Example: Subtotal 1000, Processing Fee 150 = 1150

- **Active Status Filtering**:
  - Only taxes/fees with `active = TRUE` are loaded and applied
  - Inactive taxes/fees are excluded from queries

- **Date Range Filtering**:
  - Taxes/fees with `startDate` in the future are excluded
  - Taxes/fees with `endDate` in the past are excluded
  - NULL dates mean no limit (always active if within other date range)
  - Uses current date/time for date range checks (server time)

- **Country Code Extraction**:
  - Checks `locationData.components.country` first (from delivery-location page)
  - Falls back to `locationData.country` (from map geocoding)
  - Maps country names to codes (e.g., 'UAE' -> 'AE')
  - Defaults to 'AE' if country not found

- **Error Handling**:
  - Missing country code: Defaults to 'AE'
  - No taxes/fees found: Calculator works normally, no taxes/fees applied
  - Invalid calculation type: Logs error, skips invalid tax/fee
  - Zero rate value: Skips tax/fee with zero rate
  - Database errors: Logs error, continues without taxes/fees (graceful degradation)

#### Files Modified

1. `prisma/migrations/20251219130502_create_taxes_fees_table/migration.sql` (CREATED):
   - Created `taxesFees` table with all required columns and indexes
   - Inserted initial seed data

2. `prisma/schema.prisma` (MODIFIED):
   - Added `TaxesFees` model matching table structure

3. `src/services/taxesFeesService.ts` (CREATED):
   - Created service with `getTaxesFeesByCountry()` and `getCountryCodeFromLocation()` methods
   - Includes type definitions and error handling

4. `public/global/js/kloi_calculator.js` (MODIFIED):
   - Added `taxesFees` to constructor options
   - Created `applyTaxesFees()` method
   - Updated `calculate()` method to apply taxes/fees after minimum order
   - Removed `taxPercent` option handling
   - Updated `render()` method to include taxes/fees breakdown

5. `src/routes/eventSetup.ts` (MODIFIED):
   - Added `TaxesFeesService` import
   - Added taxes/fees loading logic
   - Added `taxesFees` and `taxesFeesJson` to template data

6. `src/routes/eventSummary.ts` (MODIFIED):
   - Added `TaxesFeesService` import
   - Added taxes/fees loading logic
   - Added `taxesFees` and `taxesFeesJson` to template data

7. `src/views/wizard/event-setup.hbs` (MODIFIED):
   - Added `data-taxes-fees` attribute to serverData div
   - Added JavaScript to read and parse taxes/fees
   - Updated calculator initialization to pass `taxesFees` instead of `taxPercent: 0`

8. `src/views/wizard/event-summary.hbs` (MODIFIED):
   - Added `data-taxes-fees` attribute to summaryServerData div
   - Added JavaScript to read and parse taxes/fees
   - Updated calculator initialization to pass `taxesFees` instead of `taxPercent: 0`

#### Impact

- **User Experience**:
  - Calculator now shows accurate totals with taxes and fees applied
  - Taxes/fees breakdown displayed in calculator UI
  - Country-specific taxes/fees automatically applied based on location
  - Time-based tax/fee rules supported (e.g., promotional fees with end dates)

- **Business Logic**:
  - Flexible tax/fee management via database (no code changes needed)
  - Support for multiple taxes/fees per country
  - Active/inactive status for enabling/disabling taxes/fees
  - Date range support for time-based rules (e.g., seasonal fees)

- **Code Quality**:
  - Follows DRY principles (reusable service, centralized logic)
  - Consistent with existing patterns (MenuService, emoji-prefixed logging)
  - Type-safe with TypeScript interfaces
  - Graceful error handling (continues without taxes/fees on errors)

- **Breaking Changes**:
  - **`taxPercent` option removed**: Calculator no longer accepts `taxPercent` option
  - **Migration Required**: New `taxesFees` table must be created
  - **Backward Compatibility**: Existing calculator initializations without `taxesFees` will work (no taxes applied)

#### Migration Notes

- **Database Changes**: New `taxesFees` table required
  - Run migration: `npx prisma migrate deploy` or `npx prisma migrate dev`
  - Generate Prisma client: `npx prisma generate`
- **Breaking Change**: `taxPercent` option removed from calculator API
- **Backward Compatibility**: Existing calculator initializations without `taxesFees` will work (no taxes applied)
- **Data Migration**: Seed initial taxes/fees data via migration SQL (already included)
- **Testing**: Verify calculator shows correct totals with taxes/fees applied:
  1. User selects location (country code extracted)
  2. Taxes/fees loaded from database based on country code
  3. Calculator applies taxes/fees after minimum order
  4. Calculator displays taxes/fees breakdown in modifiers section
  5. Total includes taxes/fees correctly

---

### December 19, 2025 @ 16:30 - Multi-Day Event Calculation Fix: All Line Items Now Multiplied by Number of Days

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical calculator bugs affecting multi-day event pricing. Calculator was only multiplying minimum orders by `numberOfDays`, but not the actual line items (menu selections, upgrades, addons). Additionally, fixed minimum order display logic on event-summary page to only show when relevant (subtotal < minimumOrderTotal), and ensured `numberOfDays` is explicitly set after calculator initialization and state restoration on both event-setup and event-summary pages. All line items (radios, checkboxes, products) are now correctly multiplied by `numberOfDays` for multi-day events, ensuring accurate pricing (e.g., 2-day event with AED 17,325 subtotal now correctly shows AED 34,650 total).

#### Major Changes

- **Calculator Multi-Day Event Calculation Fix** (`public/global/js/kloi_calculator.js`):
  - **All Line Items Multiplied by numberOfDays** (Lines 143-187):
    - **Root Cause**: Calculator was only multiplying minimum orders by `numberOfDays`, but not line items (radios, checkboxes, products)
    - **Fix Applied**: All line items now multiplied by `numberOfDays` after base calculation
    - **Radio Selections** (Lines 149-159):
      - **Previous**: `lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice`
      - **New**: `lineTotal = (basis === 'Per guest' ? basePrice * guestCount : basePrice) * numberOfDays`
      - **Code Updated**:
        ```javascript
        // 🟡🟡🟡 - [LINE ITEM CALCULATION] Calculate base line total (per guest or fixed)
        let lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice
        // 🟡🟡🟡 - [MULTI-DAY MULTIPLICATION] Multiply by numberOfDays for multi-day events
        lineTotal = lineTotal * numberOfDays
        ```
      - **Impact**: Radio selections (menu options) now correctly multiplied by number of days
    - **Checkbox Selections** (Lines 161-170):
      - **Previous**: `lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice`
      - **New**: `lineTotal = (basis === 'Per guest' ? basePrice * guestCount : basePrice) * numberOfDays`
      - **Code Updated**:
        ```javascript
        // 🟡🟡🟡 - [LINE ITEM CALCULATION] Calculate base line total (per guest or fixed)
        let lineTotal = basis === 'Per guest' ? basePrice * guestCount : basePrice
        // 🟡🟡🟡 - [MULTI-DAY MULTIPLICATION] Multiply by numberOfDays for multi-day events
        lineTotal = lineTotal * numberOfDays
        ```
      - **Impact**: Checkbox selections (upgrades) now correctly multiplied by number of days
    - **Product Quantities** (Lines 172-187):
      - **Previous**: `lineTotal = basePrice * qty`
      - **New**: `lineTotal = (basePrice * qty) * numberOfDays`
      - **Code Updated**:
        ```javascript
        // 🟡🟡🟡 - [LINE ITEM CALCULATION] Calculate base line total (price * quantity)
        let lineTotal = basePrice * qty
        // 🟡🟡🟡 - [MULTI-DAY MULTIPLICATION] Multiply by numberOfDays for multi-day events
        lineTotal = lineTotal * numberOfDays
        ```
      - **Impact**: Product quantities (addons) now correctly multiplied by number of days
    - **Enhanced Logging** (Lines 252-253):
      - Added `numberOfDays` to calculation log output
      - Added dedicated log line for multi-day event calculation visibility
      - **Code Added**:
        ```javascript
        console.log('✅✅✅ - [KLOI CALC] Calculated', { guestCount, subtotal, total, breakdown, modifiersMeta, minimumOrderTotal, minimumOrderBreakdown, numberOfDays })
        console.log('🟡🟡🟡 - [KLOI CALC] Multi-day event calculation - numberOfDays:', numberOfDays, 'subtotal:', subtotal, 'total:', total)
        ```
      - **Impact**: Better debugging visibility into multi-day event calculations

- **Minimum Order Display Fix on Event-Summary** (`src/routes/eventSummary.ts`):
  - **Conditional Minimum Order Display** (Lines 181-189):
    - **Previous**: Minimum order always displayed when `minimumOrderTotal > 0`
    - **New**: Minimum order only displayed when `subtotal < minimumOrderTotal`
    - **Code Updated**:
      ```typescript
      // 🟡🟡🟡 - [MINIMUM ORDER DISPLAY] Only show minimum order if subtotal < minimumOrderTotal
      // ⚠️⚠️⚠️ - [MINIMUM ORDER LOGIC] When minimum is met, do NOT display minimum order requirement
      if (totals.minimumOrderTotal !== undefined && totals.minimumOrderTotal > 0) {
        const subtotal = totals.subtotal || 0;
        if (subtotal < totals.minimumOrderTotal) {
          items.push(`<dt>Minimum Order</dt><dd>AED ${escapeHtml(String(totals.minimumOrderTotal.toFixed(2)))}</dd>`);
        }
      }
      ```
    - **Impact**: Minimum order only appears when relevant (user hasn't met minimum yet), reducing visual clutter

- **Number of Days Explicit Setting on Event-Summary** (`src/views/wizard/event-summary.hbs`):
  - **Explicit setNumberOfDays() After State Restoration** (Line 193):
    - Added explicit `calc.setNumberOfDays(numberOfDays)` call after all state restoration is complete
    - Ensures calculator uses current session `numberOfDays` value, not any saved state value
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [NUMBER OF DAYS] Explicitly set number of days again after state restoration
      // ⚠️⚠️⚠️ - [NUMBER OF DAYS] This ensures calculator uses current session numberOfDays, not any saved state value
      calc.setNumberOfDays(numberOfDays);
      ```
    - **Impact**: Calculator correctly uses number of days from current session (e.g., 2 days) after state restoration

- **Number of Days Explicit Setting on Event-Setup** (`src/views/wizard/event-setup.hbs`):
  - **Immediate Initialization** (Lines 405-408):
    - Added explicit `calc.setNumberOfDays(numberOfDays)` call immediately after calculator initialization
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [NUMBER OF DAYS] Explicitly set number of days to ensure correct calculation
      // ⚠️⚠️⚠️ - [NUMBER OF DAYS] This ensures calculator uses current session numberOfDays, not any saved state
      calc.setNumberOfDays(numberOfDays);
      console.log('✅✅✅ - [EVENT SETUP JS] Calculator initialized with numberOfDays:', numberOfDays);
      ```
    - **Impact**: Calculator uses correct number of days when initialized with guest count and dates available
  - **Deferred Initialization** (Lines 456-465):
    - Added logic to read current `numberOfDays` from server data (may have been updated)
    - Added explicit `calc.setNumberOfDays(currentNumberOfDays)` call after deferred initialization
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [NUMBER OF DAYS] Get current numberOfDays from server data (may have been updated)
      const currentNumberOfDaysData = serverDataDiv?.dataset.numberOfDays;
      const currentNumberOfDays = currentNumberOfDaysData ? parseInt(currentNumberOfDaysData, 10) : (pending.numberOfDays || 1);
      
      calc = window.KloiCalculator.initFromMenuSections(pending.menuSectionsData, { taxPercent: 0, numberOfDays: currentNumberOfDays });
      if (calc) {
        // 🟡🟡🟡 - [NUMBER OF DAYS] Explicitly set number of days to ensure correct calculation
        // ⚠️⚠️⚠️ - [NUMBER OF DAYS] This ensures calculator uses current session numberOfDays, not any saved state
        calc.setNumberOfDays(currentNumberOfDays);
        console.log('✅✅✅ - [EVENT SETUP JS] Deferred calculator initialized with numberOfDays:', currentNumberOfDays);
      ```
    - **Impact**: Calculator correctly uses number of days when initialized later (when guest count becomes available)

#### Technical Details

- **Root Cause Analysis**:
  - **Multi-Day Calculation Bug**: Calculator was only multiplying minimum orders by `numberOfDays` (for "Per day" basis), but not the actual line items (radios, checkboxes, products)
  - **Example**: 2-day event with AED 17,325 subtotal was showing AED 17,325 total instead of AED 34,650 (17,325 × 2)
  - **Minimum Order Display Bug**: Minimum order was always displayed even when user had already met the minimum requirement
  - **Number of Days Not Applied**: Even though `numberOfDays` was passed during initialization, it wasn't being explicitly set after state restoration, potentially allowing stale saved state values to override current session values

- **Calculation Flow Before Fix**:
  1. Calculate base line totals (radios, checkboxes, products) without multiplying by `numberOfDays`
  2. Calculate minimum orders (only "Per day" items multiplied by `numberOfDays`)
  3. Add minimum order to total if subtotal < minimumOrderTotal
  4. **Result**: Multi-day events showed incorrect totals (1-day pricing for 2+ day events)

- **Calculation Flow After Fix**:
  1. Calculate base line totals (radios, checkboxes, products)
  2. **Multiply all line items by `numberOfDays`** (NEW)
  3. Calculate minimum orders (already multiplied by `numberOfDays` for "Per day" basis)
  4. Add minimum order to total if subtotal < minimumOrderTotal
  5. **Result**: Multi-day events show correct totals (e.g., 2-day event = 2× line items)

- **Multi-Day Event Example**:
  - **Before Fix**: 2-day event, 188 guests, menu selection AED 7,050 per day
    - Subtotal: AED 14,100 (calculated as 1 day)
    - Total: AED 14,100
  - **After Fix**: 2-day event, 188 guests, menu selection AED 7,050 per day
    - Subtotal: AED 28,200 (14,100 × 2 days)
    - Total: AED 28,200

- **State Restoration Flow**:
  1. Calculator initialized with `numberOfDays` from session (e.g., 2 days)
  2. `setNumberOfDays()` explicitly sets `engine.numberOfDays` to current session value
  3. Guest count set from session
  4. Radio selections restored from saved state
  5. Checkbox selections restored from saved state
  6. Product quantities restored from saved state
  7. **`setNumberOfDays()` called again after state restoration** (NEW)
  8. Final `recalc()` ensures all calculations use correct `numberOfDays`

#### Files Modified

1. `public/global/js/kloi_calculator.js`:
   - **Line 145**: Added `numberOfDays` variable at start of `calculate()` method
   - **Lines 149-159**: Updated radio selections to multiply by `numberOfDays` after base calculation
   - **Lines 161-170**: Updated checkbox selections to multiply by `numberOfDays` after base calculation
   - **Lines 172-187**: Updated product quantities to multiply by `numberOfDays` after base calculation
   - **Lines 252-253**: Enhanced logging to include `numberOfDays` and multi-day calculation visibility

2. `src/routes/eventSummary.ts`:
   - **Lines 181-189**: Updated minimum order display logic to only show when `subtotal < minimumOrderTotal`

3. `src/views/wizard/event-summary.hbs`:
   - **Line 193**: Added explicit `calc.setNumberOfDays(numberOfDays)` call after state restoration

4. `src/views/wizard/event-setup.hbs`:
   - **Lines 405-408**: Added explicit `calc.setNumberOfDays(numberOfDays)` call after immediate calculator initialization
   - **Lines 456-465**: Added logic to read current `numberOfDays` from server data and explicitly set it after deferred calculator initialization

#### Impact

- **User Experience**:
  - Multi-day events now show correct pricing (all line items multiplied by number of days)
  - Minimum order only appears when relevant (user hasn't met minimum yet)
  - Calculator totals accurately reflect multi-day event costs
  - Users see correct pricing for events spanning multiple days

- **Calculation Accuracy**:
  - **Before**: 2-day event with AED 17,325 subtotal showed AED 17,325 total (incorrect)
  - **After**: 2-day event with AED 17,325 subtotal shows AED 34,650 total (correct)
  - All line items (menu selections, upgrades, addons) correctly multiplied by `numberOfDays`
  - Minimum orders already working correctly (no change needed)

- **Code Quality**:
  - Consistent multiplication pattern: all line items multiplied by `numberOfDays`
  - Explicit `setNumberOfDays()` calls ensure calculator always uses current session value
  - Enhanced logging for better debugging visibility
  - Minimum order display logic matches calculator display logic (only show when relevant)

- **Bug Fixes**:
  - **FIXED**: Multi-day events showing incorrect totals (1-day pricing for 2+ day events)
  - **FIXED**: Minimum order displayed even when user had already met minimum requirement
  - **FIXED**: Calculator potentially using stale `numberOfDays` value from saved state instead of current session

#### Migration Notes

- **No Database Changes Required**: This is a frontend JavaScript calculation fix only
- **No API Changes Required**: Existing API endpoints remain unchanged
- **No Session Changes Required**: Session structure remains the same
- **Backward Compatible**: Fully backward compatible - calculator still works with existing session data
- **Immediate Effect**: Changes take effect immediately - calculator will correctly calculate for multi-day events
- **Testing**: Verify calculator shows correct totals when:
  1. User selects 2+ dates in date-picker
  2. User completes event-setup with menu selections
  3. Calculator shows correct total (e.g., 2 days = 2× all line items)
  4. Minimum order only appears when subtotal < minimumOrderTotal
  5. Calculator correctly uses `numberOfDays` from current session, not saved state

---

### December 18, 2025 @ 20:02 - Lead Creation Fix: Remove Blocking Conflict Detection for Duplicate Leads

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical bug where lead creation was incorrectly blocked when duplicate phone numbers or email addresses were detected in the Leads table. The Leads table is designed to allow duplicates (no unique constraints), but the code was performing conflict detection and returning 409 errors, preventing users from completing the wizard flow. Removed the blocking conflict check from lead creation flow, allowing duplicate leads to be created as designed. Conflict detection remains in place for customer conversion (after payment), which is the correct place for uniqueness enforcement.

#### Major Changes

- **Event-Details Step Handler Lead Creation Fix** (`src/routes/api/index.ts`):
  - **Removed Blocking Conflict Detection** (Lines 1205-1225):
    - Removed `detectLeadConflicts()` call that was blocking lead creation
    - Removed 409 error response when conflicts were detected in Leads table
    - **Code Removed**:
      ```typescript
      // OLD CODE (REMOVED):
      // 🟡🟡🟡 - [LEAD CONFLICT DETECTION] Check for existing leads (for UI conflict resolution)
      const conflictCheck = await detectLeadConflicts(
        validatedData.phone,
        validatedData.email
      );
      
      if (!conflictCheck.success) {
        // 🟡🟡🟡 - [LEAD CONFLICT] Conflict detected in leads, return conflict info to client
        console.log('❗❗❗ - [LEAD CREATION] Lead conflict detected:', conflictCheck.message);
        
        return reply.status(409).send({
          success: false,
          message: 'Lead conflict detected',
          conflict: {
            type: conflictCheck.conflictType,
            existingCustomer: conflictCheck.existingCustomer,
            message: conflictCheck.message
          },
          requiresUserConfirmation: true
        });
      }
      ```
    - **Impact**: Lead creation no longer blocked by duplicate phone/email in Leads table

  - **Direct Lead Creation** (Lines 1205-1212):
    - Lead creation now proceeds directly without conflict checks
    - Added clarifying comments that duplicates are allowed
    - **Code Updated**:
      ```typescript
      // 🟡🟡🟡 - [LEAD CREATION] Create lead (duplicates are allowed - no conflict check needed)
      // Leads table has no unique constraints, so we can create leads even if phone/email already exists
      const leadResult = await createLead(
        validatedData.phone,
        validatedData.email,
        validatedData.firstName,
        validatedData.lastName
      );
      ```
    - **Impact**: Leads are created successfully even when duplicate phone/email exists, matching the design intent

  - **Updated Comment** (Line 1194):
    - Changed comment from "with conflict detection (for UI purposes)" to "duplicates allowed in Leads table"
    - **Code Updated**:
      ```typescript
      // OLD: // 🟡🟡🟡 - [LEAD CREATION] Create lead record with conflict detection (for UI purposes)
      // NEW:
      // 🟡🟡🟡 - [LEAD CREATION] Create lead record (duplicates allowed in Leads table)
      ```
    - **Impact**: Comments now accurately reflect that duplicates are allowed

  - **Removed Unused Import** (Line 10):
    - Removed `detectLeadConflicts` from import statement since it's no longer used in lead creation flow
    - **Code Updated**:
      ```typescript
      // OLD: import { createLead, detectLeadConflicts } from '../../services/leadService';
      // NEW:
      import { createLead } from '../../services/leadService';
      ```
    - **Impact**: Cleaner imports, removed unused dependency

#### Technical Details

- **Root Cause**:
  - The Leads table was designed to allow duplicates (no unique constraints) to prevent blocking users who don't complete checkout
  - However, the event-details step handler was calling `detectLeadConflicts()` before creating leads
  - When conflicts were detected (duplicate phone/email), the code returned a 409 error, blocking lead creation
  - This violated the design intent: Leads table should allow duplicates, conflict detection should only occur when converting leads to customers

- **Design Intent**:
  - **Leads Table**: Allows duplicates - users can create multiple leads with same phone/email during wizard flow
  - **Customers Table**: Enforces uniqueness - conflict detection occurs when converting leads to customers (after payment)
  - **Conflict Resolution**: Should only be needed when converting leads to customers, not during lead creation

- **Error Flow Before Fix**:
  1. User enters phone/email that already exists in Leads table
  2. `detectLeadConflicts()` finds existing lead
  3. Code returns 409 error with conflict information
  4. User cannot proceed with wizard flow
  5. **Result**: Users blocked from completing order even though Leads table allows duplicates

- **Correct Flow After Fix**:
  1. User enters phone/email (may or may not exist in Leads table)
  2. Lead created directly via `createLead()` without conflict check
  3. Duplicate leads allowed (as designed)
  4. User proceeds with wizard flow
  5. After payment success, lead converted to customer with conflict detection
  6. **Result**: Users can complete wizard flow, duplicates handled correctly at customer conversion stage

- **Conflict Detection Still Available**:
  - `detectLeadConflicts()` function remains in `leadService.ts` for potential future use
  - Conflict detection still occurs in `convertLeadToCustomer()` function (after payment)
  - Conflict resolution endpoint (`/resolve-conflict`) still works correctly (creates leads without blocking)

#### Files Modified

1. `src/routes/api/index.ts`:
   - **Line 10**: Removed `detectLeadConflicts` from import statement
   - **Line 1194**: Updated comment to clarify duplicates are allowed
   - **Lines 1205-1225**: Removed blocking conflict detection check and 409 error response
   - **Lines 1205-1212**: Added clarifying comments that duplicates are allowed, no conflict check needed

#### Impact

- **User Experience**:
  - Users can now complete wizard flow even if their phone/email already exists in Leads table
  - No more 409 errors blocking lead creation for duplicate phone/email
  - Wizard flow proceeds smoothly to checkout
  - Matches design intent: Leads table allows duplicates

- **Data Integrity**:
  - Leads table correctly allows duplicate entries (as designed)
  - Customer table still enforces uniqueness (conflict detection at conversion stage)
  - Proper separation: Leads (duplicates allowed) vs Customers (uniqueness enforced)

- **Code Quality**:
  - Removed incorrect conflict detection that violated design intent
  - Comments accurately reflect that duplicates are allowed
  - Cleaner imports (removed unused dependency)
  - Aligns with Leads table design (no unique constraints)

- **Bug Fix**:
  - Fixed issue where users were incorrectly blocked from creating leads with duplicate phone/email
  - Error logs showed: "Lead conflict detected: Phone number is already in use by another lead"
  - This error no longer occurs during lead creation

#### Migration Notes

- **No Database Changes Required**: This is a code logic fix only, no schema changes
- **No API Changes Required**: API endpoints remain the same, only internal logic changed
- **No Session Changes Required**: Session structure remains unchanged
- **Backward Compatible**: Fully backward compatible - existing leads and orders unaffected
- **Immediate Effect**: Changes take effect immediately - users can now create duplicate leads
- **Testing**: Verify lead creation works when:
  1. User enters phone/email that already exists in Leads table
  2. Lead is created successfully (no 409 error)
  3. User can proceed through wizard flow
  4. After payment, lead converts to customer with proper conflict detection
  5. Multiple leads with same phone/email can exist simultaneously

#### Related Code

- **Conflict Detection Function** (`src/services/leadService.ts`, Lines 114-201):
  - `detectLeadConflicts()` function remains available but is no longer used in lead creation flow
  - Still used internally in `convertLeadToCustomer()` for customer conversion conflict detection
  - Function correctly identifies conflicts but doesn't block lead creation (as intended)

- **Lead Creation Function** (`src/services/leadService.ts`, Lines 7-44):
  - `createLead()` function unchanged - correctly allows duplicates
  - No unique constraints in Leads table, so duplicates are allowed at database level
  - Function works correctly without conflict checks

- **Customer Conversion** (`src/services/paymentService.ts`, Lines 292-350):
  - Lead-to-customer conversion still includes conflict detection (correct behavior)
  - Conflict detection occurs at customer conversion stage, not lead creation stage
  - Ensures Customers table maintains uniqueness while Leads table allows duplicates

---

### December 18, 2025 @ 19:51 - Calculator numberOfDays Fix: Multi-Day Event Calculation Correction

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical bug where calculator on event-summary page was calculating quotes for only 1 day regardless of the actual number of days selected in the date picker. Calculator now correctly uses the number of days from the current session's `dateInfo.dates` array, ensuring accurate pricing for multi-day events. Added `setNumberOfDays()` method to calculator API to allow dynamic updates of number of days after initialization, ensuring calculator always uses the correct number of days from the current session rather than any saved state.

#### Major Changes

- **Calculator API Enhancement** (`public/global/js/kloi_calculator.js`):
  - **New Method: `setNumberOfDays()`** (Lines 372-380):
    - Added method to update `numberOfDays` property after calculator initialization
    - Updates `engine.numberOfDays` and triggers recalculation via `ui.render()`
    - Validates input to ensure positive integer (defaults to 1 if invalid)
    - **Code Added**:
      ```javascript
      setNumberOfDays: (days) => {
        // 🟡🟡🟡 - [NUMBER OF DAYS] Update number of days and recalculate
        // ⚠️⚠️⚠️ - [NUMBER OF DAYS] This affects minimum order calculations for "Per day" basis
        const numDays = days && days > 0 ? Math.floor(days) : 1
        engine.numberOfDays = numDays
        console.log('🟡🟡🟡 - [KLOI CALC] Number of days updated to:', numDays)
        ui.render()
      },
      ```
    - **Location**: Lines 372-380 in calculator API object
    - **Impact**: Enables calculator to update number of days dynamically, ensuring calculations use current session data rather than stale saved state

- **Event-Summary Calculator Initialization Fix** (`src/views/wizard/event-summary.hbs`):
  - **Explicit numberOfDays Setting** (Lines 106-109):
    - Added explicit call to `calc.setNumberOfDays(numberOfDays)` immediately after calculator initialization
    - Ensures calculator uses current session's `numberOfDays` value, not any saved state value
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [NUMBER OF DAYS] Explicitly set number of days to ensure correct calculation
      // ⚠️⚠️⚠️ - [NUMBER OF DAYS] This ensures calculator uses current session numberOfDays, not any saved state
      calc.setNumberOfDays(numberOfDays);
      console.log('✅✅✅ - [EVENT SUMMARY VIEW] Calculator initialized with numberOfDays:', numberOfDays);
      ```
    - **Impact**: Calculator now correctly uses number of days from current session (e.g., 2 days for 2 selected dates) instead of defaulting to 1 day

  - **Final Recalculation After State Restoration** (Lines 192-194):
    - Added explicit `calc.recalc()` call after all state restoration is complete
    - Ensures final calculation uses correct `numberOfDays` after all selections are restored
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [FINAL RECALC] Ensure calculator recalculates with correct numberOfDays after state restoration
      // ⚠️⚠️⚠️ - [NUMBER OF DAYS] This ensures final calculation uses current session numberOfDays, not any saved state value
      calc.recalc();
      console.log('✅✅✅ - [EVENT SUMMARY VIEW] Calculator state restored from session and recalculated with numberOfDays:', numberOfDays);
      ```
    - **Impact**: Final quote calculation reflects correct number of days after all state restoration

  - **Enhanced Logging** (Line 89):
    - Added `numberOfDaysData` to logging output for debugging
    - **Code Updated**:
      ```javascript
      console.log('🟡🟡🟡 - [EVENT SUMMARY VIEW] Initializing calculator:', { numberOfDays, guestCount, numberOfDaysData });
      ```
    - **Impact**: Better debugging visibility into numberOfDays value source

- **Route Handler Logging Enhancement** (`src/routes/eventSummary.ts`):
  - **Enhanced numberOfDays Calculation Logging** (Lines 62-67):
    - Added detailed logging showing which dates were used to calculate `numberOfDays`
    - Added warning log when dates are not found, using default value
    - **Code Updated**:
      ```typescript
      // 🟡🟡🟡 - [NUMBER OF DAYS] Calculate from dateInfo
      if (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0) {
        numberOfDays = dateInfo.dates.length;
        console.log('✅✅✅ - [EVENT SUMMARY ROUTE] Number of days calculated:', numberOfDays, 'from dates:', dateInfo.dates);
      } else {
        console.warn('⚠️⚠️⚠️ - [EVENT SUMMARY ROUTE] No valid dates found in dateInfo, using default numberOfDays:', numberOfDays);
      }
      ```
    - **Impact**: Better visibility into numberOfDays calculation process for debugging

#### Technical Details

- **Root Cause**:
  - Calculator was initialized with correct `numberOfDays` from session data
  - However, when restoring calculator state from saved session data, the calculator might have been using a stale `numberOfDays` value from the saved state
  - The calculator engine's `numberOfDays` property was set during initialization but wasn't being explicitly updated to match current session data

- **Solution Pattern**:
  - **Explicit Setting**: Call `setNumberOfDays()` immediately after initialization to ensure calculator uses current session value
  - **Final Recalculation**: Call `recalc()` after state restoration to ensure all calculations use correct `numberOfDays`
  - **API Method**: Added `setNumberOfDays()` method to calculator API for dynamic updates

- **Calculation Impact**:
  - **Minimum Orders**: "Per day" minimum orders are multiplied by `numberOfDays` (line 202 in `kloi_calculator.js`)
  - **Multi-Day Events**: Events with multiple dates (e.g., 2 days) now correctly calculate minimum orders for all days
  - **Example**: If minimum order is AED 1,000 per day and user selects 2 dates, calculator now shows AED 2,000 minimum order (previously showed AED 1,000)

- **State Restoration Flow**:
  1. Calculator initialized with `numberOfDays` from session (e.g., 2 days)
  2. `setNumberOfDays()` explicitly sets `engine.numberOfDays` to current session value
  3. Guest count set from session
  4. Radio selections restored from saved state
  5. Checkbox selections restored from saved state
  6. Product quantities restored from saved state
  7. Final `recalc()` ensures all calculations use correct `numberOfDays`

#### Files Modified

1. `public/global/js/kloi_calculator.js`:
   - Lines 372-380: Added `setNumberOfDays()` method to calculator API

2. `src/views/wizard/event-summary.hbs`:
   - Lines 106-109: Added explicit `setNumberOfDays()` call after calculator initialization
   - Lines 192-194: Added final `recalc()` call after state restoration
   - Line 89: Enhanced logging to include `numberOfDaysData`

3. `src/routes/eventSummary.ts`:
   - Lines 62-67: Enhanced logging for numberOfDays calculation with dates array and warning message

#### Impact

- **User Experience**:
  - Calculator now shows correct totals for multi-day events
  - Minimum order requirements correctly reflect number of days selected
  - Users see accurate pricing for events spanning multiple days

- **Calculation Accuracy**:
  - "Per day" minimum orders correctly multiplied by actual number of days
  - Multi-day events (2+ days) now calculate correctly instead of defaulting to 1 day
  - Calculator always uses current session's `numberOfDays`, not stale saved state

- **Code Quality**:
  - Added explicit API method for updating `numberOfDays` (follows DRY principles)
  - Enhanced logging for better debugging visibility
  - Ensures calculator state matches current session data

#### Migration Notes

- **No Database Changes Required**: This is a frontend JavaScript fix only
- **No API Changes Required**: Existing API endpoints remain unchanged
- **No Session Changes Required**: Session structure remains the same
- **Backward Compatible**: Fully backward compatible - calculator still works with existing session data
- **Immediate Effect**: Changes take effect immediately - calculator will correctly calculate for multi-day events
- **Testing**: Verify calculator shows correct totals when:
  1. User selects 2+ dates in date-picker
  2. User completes event-setup
  3. User views event-summary
  4. Calculator total reflects correct number of days (e.g., 2 days = 2x minimum order for "Per day" items)

---

### December 16, 2025 @ 19:48 - Leads Table Implementation: Pre-Checkout Customer Data Management

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Implemented a Leads table system to store customer information during the wizard flow (before payment completion), and convert leads to customers only after successful payment. This prevents duplicate customer entries for users who don't complete checkout. The Leads table allows duplicates (no unique constraints), while Customers table maintains strict uniqueness. During the wizard flow, customer data is saved to Leads table and linked to orders via `leadId`. Upon successful payment completion, leads are converted to customers with conflict detection, and orders are linked to customers via `userId`.

#### Major Changes

- **Database Migration** (`prisma/migrations/20251216194559_create_leads_table/migration.sql`):
  - **New Leads Table** (Lines 6-15):
    - Created `Leads` table with same structure as `Customers` table
    - Fields: `id` (UUID primary key), `email` (VARCHAR(100), nullable), `phone` (VARCHAR(20), nullable), `firstName` (VARCHAR(50), nullable), `lastName` (VARCHAR(50), nullable), `createdAt` (TIMESTAMP)
    - **No unique constraints** - allows duplicate phone/email combinations
    - **Code Added**:
      ```sql
      CREATE TABLE "Leads" (
          "id" TEXT NOT NULL,
          "email" VARCHAR(100),
          "phone" VARCHAR(20),
          "firstName" VARCHAR(50),
          "lastName" VARCHAR(50),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Leads_pkey" PRIMARY KEY ("id")
      );
      ```
    - **Impact**: Provides storage for pre-checkout customer data without uniqueness restrictions

  - **Order Table Enhancement** (Lines 18-21):
    - Added `leadId` field to `kloiOrdersTable` to link orders to leads
    - Added foreign key constraint with `ON DELETE SET NULL ON UPDATE CASCADE`
    - **Code Added**:
      ```sql
      ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "leadId" TEXT;
      ALTER TABLE "kloiOrdersTable" ADD CONSTRAINT "kloiOrdersTable_leadId_fkey" 
          FOREIGN KEY ("leadId") REFERENCES "Leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ```
    - **Impact**: Orders can now link to leads during wizard flow, then to customers after payment

- **Prisma Schema Updates** (`prisma/schema.prisma`):
  - **New Leads Model** (Lines 25-35):
    - Added `Leads` model matching `Customers` structure without unique constraint
    - **Code Added**:
      ```prisma
      model Leads {
        id        String            @id @default(uuid())
        email     String?           @db.VarChar(100)
        phone     String?           @db.VarChar(20)
        createdAt DateTime          @default(now())
        firstName String?           @db.VarChar(50)
        lastName  String?           @db.VarChar(50)
        orders    kloiOrdersTable[]

        @@map("Leads")
      }
      ```
    - **Impact**: Prisma client now includes Leads model for type-safe database operations

  - **Order Model Enhancement** (Lines 76-80):
    - Added `leadId` field and `lead` relation to `kloiOrdersTable` model
    - **Code Added**:
      ```prisma
      leadId        String?
      lead          Leads?      @relation(fields: [leadId], references: [id])
      ```
    - **Impact**: Type-safe access to lead data from orders

- **New Lead Service** (`src/services/leadService.ts` - New File):
  - **Lead Creation Function** (Lines 8-44):
    - `createLead()` - Creates lead records without conflict detection (allows duplicates)
    - **Code Added**:
      ```typescript
      export async function createLead(
        phone: string,
        email: string | null,
        firstName: string,
        lastName: string
      ): Promise<{ success: boolean; leadId?: string; message?: string }> {
        const sanitizedEmail = sanitizeEmail(email);
        const lead = await prisma.leads.create({
          data: {
            phone: phone,
            firstName: firstName,
            lastName: lastName,
            email: sanitizedEmail,
          }
        });
        return { success: true, leadId: lead.id, message: 'Lead created successfully' };
      }
      ```
    - **Impact**: Simple lead creation without uniqueness constraints

  - **Lead to Customer Conversion** (Lines 47-92):
    - `convertLeadToCustomer()` - Converts lead to customer with conflict detection
    - Reuses existing `createCustomerSafely()` function (DRY principle)
    - **Code Added**:
      ```typescript
      export async function convertLeadToCustomer(
        leadId: string
      ): Promise<ConflictResolutionResult & { converted?: boolean }> {
        const lead = await prisma.leads.findUnique({ where: { id: leadId } });
        const customerResult = await createCustomerSafely(
          lead.phone,
          lead.email,
          lead.firstName || '',
          lead.lastName || ''
        );
        return { ...customerResult, converted: customerResult.success };
      }
      ```
    - **Impact**: Converts leads to customers only after payment, with proper conflict handling

  - **Lead Conflict Detection** (Lines 95-177):
    - `detectLeadConflicts()` - Checks for existing leads (for UI conflict resolution)
    - **Code Added**:
      ```typescript
      export async function detectLeadConflicts(
        phone: string, 
        email: string | null
      ): Promise<ConflictResolutionResult> {
        const existingByPhone = await prisma.leads.findFirst({ where: { phone: phone } });
        const existingByEmail = sanitizedEmail ? 
          await prisma.leads.findFirst({ where: { email: sanitizedEmail } }) : null;
        // Returns conflict information for UI
      }
      ```
    - **Impact**: Enables conflict resolution UI to show existing leads to users

- **Event-Details Step Handler Updates** (`src/routes/api/index.ts`):
  - **Import Statement Update** (Line 11):
    - Added import for lead service functions
    - **Code Added**:
      ```typescript
      import { createLead, detectLeadConflicts } from '../../services/leadService';
      ```
    - **Impact**: Access to lead creation and conflict detection functions

  - **Customer Creation Replaced with Lead Creation** (Lines 1195-1235):
    - Replaced `createCustomerSafely()` with `createLead()` and `detectLeadConflicts()`
    - Added lead conflict detection before creating lead
    - **Code Changed**:
      ```typescript
      // OLD: const customerResult = await createCustomerSafely(...)
      // NEW:
      const conflictCheck = await detectLeadConflicts(
        validatedData.phone,
        validatedData.email
      );
      if (!conflictCheck.success) {
        return reply.status(409).send({
          success: false,
          message: 'Lead conflict detected',
          conflict: { ... }
        });
      }
      const leadResult = await createLead(...);
      ```
    - **Impact**: Customer data now saved to Leads table during wizard flow

  - **Order Creation Update** (Lines 1237-1274):
    - Changed order linking from `userId` to `leadId`
    - **Code Changed**:
      ```typescript
      // OLD: userId: customer?.id || null,
      // NEW:
      leadId: lead?.id || null,
      ```
    - **Impact**: Orders link to leads during wizard, not customers

  - **Session Storage Update** (Lines 1283-1286):
    - Changed session storage from `customerId` to `leadId`
    - **Code Changed**:
      ```typescript
      // OLD: (request.session as any).customerId = customer?.id || null;
      // NEW:
      (request.session as any).leadId = lead?.id || null;
      ```
    - **Impact**: Session tracks lead ID instead of customer ID during wizard

- **Conflict Resolution Endpoint Update** (`src/routes/api/index.ts`, Lines 897-970):
  - **Endpoint Logic Change**:
    - Changed from `resolveCustomerConflict()` to `createLead()` after user confirmation
    - **Code Changed**:
      ```typescript
      // OLD: const resolutionResult = await resolveCustomerConflict(...)
      // NEW:
      const leadResult = await createLead(
        phone,
        email,
        firstName,
        lastName
      );
      (request.session as any).leadId = leadResult.leadId;
      ```
    - **Impact**: Conflict resolution now creates leads instead of customers

- **Payment Success Handler Enhancement** (`src/services/paymentService.ts`, Lines 292-350):
  - **Lead to Customer Conversion on Payment Success**:
    - Added lead-to-customer conversion in `payment_intent.succeeded` webhook handler
    - **Code Added**:
      ```typescript
      case 'payment_intent.succeeded':
        let customerId: string | null = null;
        if (order.leadId) {
          const { convertLeadToCustomer } = await import('./leadService');
          const conversionResult = await convertLeadToCustomer(order.leadId);
          
          if (conversionResult.success && conversionResult.customerId) {
            customerId = conversionResult.customerId;
          } else {
            // Handle conflict - find existing customer
            const lead = await prisma.leads.findUnique({ where: { id: order.leadId } });
            const existingCustomer = await prisma.customers.findFirst({
              where: { OR: [{ phone: lead.phone }, { email: lead.email }] }
            });
            customerId = existingCustomer?.id || null;
          }
        }
        
        await prisma.kloiOrdersTable.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.COMPLETED,
            paymentStatus: 'succeeded',
            paidAt: new Date(),
            userId: customerId || undefined, // Link to customer
          }
        });
      ```
    - **Impact**: Leads are automatically converted to customers only after successful payment, with conflict detection

#### Migration Instructions

1. **Run Database Migration**:
   ```bash
   npx prisma migrate deploy
   # or
   npx prisma migrate dev
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **No Code Changes Required**: Existing code automatically uses new Leads system

#### Breaking Changes

- **Session Data**: Session now stores `leadId` instead of `customerId` during wizard flow
- **Order Linking**: Orders link to leads via `leadId` during wizard, then to customers via `userId` after payment
- **Conflict Resolution**: `/resolve-conflict` endpoint now creates leads instead of customers

#### Benefits

- **Prevents Duplicate Customers**: Only users who complete payment become customers
- **Maintains Data Integrity**: Customers table only contains paid customers
- **Audit Trail**: Leads table preserves all customer attempts, even if payment fails
- **DRY Principle**: Reuses existing customer creation and conflict detection logic
- **Backward Compatible**: Existing customer conflict detection logic remains unchanged

---

### December 10, 2025 @ 16:23 - Form Pre-Filling from Session Data on Event-Setup Page

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented form pre-filling functionality on event-setup page to restore user selections from session cookie when returning from event-summary page. Users can now edit their selections without re-entering all data from scratch. Form pre-fills radio buttons, checkboxes, quantity inputs (including guest count), and properly updates calculator with restored values. Radio options are expanded/contracted correctly based on selections.

#### Major Changes

- **Route Handler Template Data Enhancement** (`src/routes/eventSetup.ts`):
  - **EventSetup JSON Addition** (Line 125):
    - Added `eventSetupJson` to template data for JavaScript access
    - **Code Added**:
      ```typescript
      eventSetupJson: eventSetup ? JSON.stringify(eventSetup) : 'null', // 🟡🟡🟡 - [FORM PRE-FILL] Pass eventSetup JSON for form pre-filling
      ```
    - **Impact**: JavaScript can access eventSetup session data to pre-fill form inputs

- **Template Data Attribute Addition** (`src/views/wizard/event-setup.hbs`):
  - **EventSetup Data Attribute** (Line 241):
    - Added `data-event-setup` attribute to serverData div
    - **Code Updated**:
      ```handlebars
      <div id="serverData" ... data-event-setup="{{eventSetupJson}}" ...>
      ```
    - **Impact**: JavaScript can read eventSetup data from DOM for form pre-filling

- **Form Pre-Filling Function** (`src/views/wizard/event-setup.hbs`):
  - **New Function** (Lines 990-1085):
    - Added `prefillFormFromSession()` function to restore form state from session
    - Reads eventSetup data from serverData div
    - Pre-fills radio buttons, checkboxes, and quantity inputs
    - Expands selected radio options and contracts others
    - Shows guest counter container if guest count > 0
    - Updates calculator if already initialized
    - **Code Added**:
      ```javascript
      function prefillFormFromSession() {
          const serverDataDiv = document.getElementById('serverData');
          const eventSetupJsonAttr = serverDataDiv.getAttribute('data-event-setup');
          if (eventSetupJsonAttr && eventSetupJsonAttr !== 'null') {
              const eventSetup = JSON.parse(eventSetupJsonAttr);
              
              // Pre-fill radio buttons
              if (eventSetup.radioSelections) {
                  Object.entries(eventSetup.radioSelections).forEach(([groupId, optionKey]) => {
                      const radioInput = document.querySelector(`input[type="radio"][name="${groupId}"][value="${optionKey}"]`);
                      if (radioInput) {
                          radioInput.checked = true;
                          // Expand selected option, contract others
                      }
                  });
              }
              
              // Pre-fill checkboxes
              if (eventSetup.checkboxSelections) {
                  Object.entries(eventSetup.checkboxSelections).forEach(([optionKey, value]) => {
                      const checkboxInput = document.querySelector(`input[type="checkbox"][name="${optionKey}"]`);
                      if (checkboxInput) checkboxInput.checked = true;
                  });
              }
              
              // Pre-fill quantity inputs
              if (eventSetup.productQuantities) {
                  Object.entries(eventSetup.productQuantities).forEach(([productKey, quantity]) => {
                      const quantityInput = document.querySelector(`input.quantity-input[name="${productKey}"]`);
                      if (quantityInput) {
                          quantityInput.value = quantity.toString();
                          // Show guest counter if guest count > 0
                      }
                  });
              }
              
              // Update calculator if already initialized
              if (calc) {
                  // Update calculator with pre-filled values
              }
          }
      }
      ```
    - **Impact**: Form inputs are restored from session, providing seamless editing experience

- **Radio Option Expansion Logic** (`src/views/wizard/event-setup.hbs`):
  - **Visual State Management** (Lines 1017-1042):
    - Expands selected radio option (adds 'expanded' class, removes 'contracted')
    - Shows view details button for selected option
    - Contracts other options in same group
    - Hides view details buttons for non-selected options
    - **Code Added**:
      ```javascript
      const radioOption = radioInput.closest('.radio-option');
      radioOption.classList.remove('contracted');
      radioOption.classList.add('expanded');
      const viewDetailsBtn = radioOption.querySelector('.view-details-btn');
      if (viewDetailsBtn) viewDetailsBtn.style.display = 'inline-block';
      // Contract other options in group
      ```
    - **Impact**: Selected radio options are visually expanded, matching user's previous selection state

- **Calculator Update After Pre-Fill** (`src/views/wizard/event-setup.hbs`):
  - **Calculator Synchronization** (Lines 1057-1085):
    - Updates calculator with pre-filled form values if calculator already initialized
    - Sets guest count, radio selections, checkbox selections, and product quantities
    - Recalculates calculator totals
    - **Code Added**:
      ```javascript
      if (calc) {
          // Update guest count
          const guestInput = document.querySelector('#guest-counter-container .quantity-input[name="guest-count"]');
          if (guestInput) {
              const guestCountValue = parseInt(guestInput.value) || 0;
              if (guestCountValue > 0) {
                  calc.setGuestCount(guestCountValue);
              }
          }
          
          // Update radio selections
          const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
          selectedRadios.forEach(r => calc.setRadio(r.name, r.value));
          
          // Update checkbox selections
          const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
          selectedCheckboxes.forEach(cb => calc.setCheckbox(cb.value, true));
          
          // Update product quantities
          const productInputs = document.querySelectorAll('.product-group .quantity-input, .addon-group .quantity-input');
          productInputs.forEach(pi => {
              const qty = parseInt(pi.value) || 0;
              if (qty > 0 || pi.name === 'guest-count') {
                  calc.setProductQty(pi.name, qty);
              }
          });
          
          calc.recalc();
      }
      ```
    - **Impact**: Calculator reflects pre-filled form values immediately, showing correct quote

- **Initialization Order Update** (`src/views/wizard/event-setup.hbs`):
  - **Pre-Fill First** (Line 1087):
    - Form pre-filling called first in `initialize()` function
    - **Code Updated**:
      ```javascript
      function initialize() {
          // Pre-fill form from session data BEFORE other initialization
          prefillFormFromSession();
          
          initializePopupData();
          initializeQuantityControls();
          // ... rest of initialization
      }
      ```
    - **Impact**: Ensures form is pre-filled before other initialization logic runs

- **Deferred Calculator Initialization Enhancement** (`src/views/wizard/event-setup.hbs`):
  - **Form Value Reading** (Lines 450-466):
    - Updated `initializeCalculatorIfNeeded()` to read from pre-filled form values
    - Reads radio, checkbox, and product values from form when calculator initializes later
    - **Code Updated**:
      ```javascript
      calc = window.KloiCalculator.initFromMenuSections(pending.menuSectionsData, { taxPercent: 0, numberOfDays: pending.numberOfDays });
      if (calc) {
          // Set guest count
          // Read pre-filled form values and set in calculator
          const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
          selectedRadios.forEach(r => calc.setRadio(r.name, r.value));
          
          const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
          selectedCheckboxes.forEach(cb => calc.setCheckbox(cb.value, true));
          
          const productInputs = document.querySelectorAll('.product-group .quantity-input, .addon-group .quantity-input');
          productInputs.forEach(pi => {
              const qty = parseInt(pi.value) || 0;
              if (qty > 0 || pi.name === 'guest-count') {
                  calc.setProductQty(pi.name, qty);
              }
          });
          
          calc.recalc();
      }
      ```
    - **Impact**: Calculator initialized later (when dates become available) correctly reads pre-filled form values

#### Technical Details

- **Pre-Fill Strategy**:
  - Reads eventSetup data from session cookie via data attribute
  - Pre-fills form inputs before other initialization
  - Updates calculator if already initialized, or calculator reads from form when initialized later
  - Handles both immediate and deferred calculator initialization scenarios

- **Radio Option State Management**:
  - Selected radio options are expanded (visual state)
  - Non-selected options in same group are contracted
  - View details buttons shown/hidden appropriately
  - Matches user's previous interaction state

- **Guest Counter Visibility**:
  - Guest counter container shown if guest count > 0 in session
  - Guest count input pre-filled with session value
  - Calculator updated with guest count if initialized

- **Data Flow**:
  1. User completes event-setup → data saved to session
  2. User navigates to event-summary → sees summary
  3. User clicks "Edit EVENT SETUP" → returns to event-setup
  4. Page loads → form pre-fills from session data
  5. Calculator updates → reads pre-filled values and shows correct quote

#### Files Modified

1. `src/routes/eventSetup.ts`:
   - Line 125: Added `eventSetupJson` to template data

2. `src/views/wizard/event-setup.hbs`:
   - Line 241: Added `data-event-setup` attribute to serverData div
   - Lines 990-1085: Added `prefillFormFromSession()` function
   - Lines 1017-1042: Added radio option expansion/contraction logic
   - Lines 1057-1085: Added calculator update after pre-fill
   - Line 1087: Added pre-fill call at start of `initialize()` function
   - Lines 450-466: Updated `initializeCalculatorIfNeeded()` to read from pre-filled form

#### Impact

- **User Experience**:
  - Users can edit selections without re-entering all data
  - Form state restored from session cookie
  - Radio options visually expanded to match selections
  - Calculator shows correct quote immediately
  - Seamless editing workflow

- **Data Consistency**:
  - Form inputs match session data
  - Calculator state synchronized with form state
  - Visual state (radio expansion) matches data state

- **Code Quality**:
  - Centralized pre-fill logic in dedicated function
  - Handles both immediate and deferred calculator initialization
  - Proper error handling for missing or invalid session data

#### Migration Notes

- **No Database Changes Required**: This is a frontend JavaScript change only
- **No API Changes Required**: Existing API endpoints remain unchanged
- **Session Data**: Uses existing eventSetup session structure
- **Backward Compatibility**: Fully backward compatible - if no session data, form starts empty (existing behavior)
- **Immediate Effect**: Changes take effect immediately - form pre-fills when returning from event-summary
- **Testing**: Verify form pre-fills correctly when:
  1. Returning from event-summary after completing event-setup
  2. Radio buttons checked and expanded
  3. Checkboxes checked
  4. Quantity inputs filled (including guest count)
  5. Calculator shows correct quote with pre-filled values

---

### December 10, 2025 @ 15:30 - Calculator Requirements Fix, Live Calculator on Event-Summary, and User-Friendly Label Display

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical calculator visibility logic to require BOTH guest count AND dates before showing calculator and related elements. Added live calculator to event-summary page with full state restoration. Fixed event-summary display to show user-friendly labels instead of raw keys. Calculator now properly initializes on event-summary page with all selections restored from session data.

#### Major Changes

- **Calculator Visibility Requirements Update** (`src/routes/eventSetup.ts`):
  - **Date Info Validation** (Lines 79-109):
    - Added `hasDateInfo` flag to track if valid dates are available in session
    - Calculates `numberOfDays` from `dateInfo.dates` array
    - **Code Added**:
      ```typescript
      let hasDateInfo = false;
      const dateInfo = sessionData.dateInfo as any;
      if (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0) {
        numberOfDays = dateInfo.dates.length;
        hasDateInfo = true;
      }
      ```
    - **Impact**: Ensures dates are available before calculator can be shown
  - **Calculator Readiness Flag** (Lines 111-112):
    - Added `canShowCalculator` flag requiring BOTH guest count AND dates
    - **Code Added**:
      ```typescript
      const canShowCalculator = hasGuestCount && hasDateInfo;
      ```
    - **Impact**: Calculator only shows when both conditions are met, ensuring accurate pricing

- **Template Visibility Updates** (`src/views/wizard/event-setup.hbs`):
  - **Minimum Order Sections** (Line 178):
    - Added conditional hiding based on `canShowCalculator`
    - **Code Updated**:
      ```handlebars
      <div class="div-group" data-group-name="{{id}}" style="{{#unless canShowCalculator}}display: none;{{/unless}}">
      ```
  - **Calculator Container** (Line 211):
    - Changed visibility condition from `hasGuestCount` to `canShowCalculator`
    - **Code Updated**:
      ```handlebars
      <div id="koi-live-quote" style="{{#unless canShowCalculator}}display: none;{{/unless}}">
      ```
  - **Edit Date Section** (Line 216):
    - Added conditional hiding based on `canShowCalculator`
    - **Code Updated**:
      ```handlebars
      <div id="edit-date" class="edit-date-section" style="{{#unless canShowCalculator}}display: none;{{/unless}}">
      ```
  - **Server Data Attributes** (Line 236):
    - Added `hasDateInfo` and `canShowCalculator` to server data div
    - **Code Updated**:
      ```handlebars
      <div id="serverData" ... data-has-date-info="{{hasDateInfo}}" data-can-show-calculator="{{canShowCalculator}}" ...>
      ```
    - **Impact**: JavaScript can check both guest count and dates availability

- **JavaScript Calculator Readiness Check** (`src/views/wizard/event-setup.hbs`):
  - **New Function** (Lines 296-314):
    - Added `checkCalculatorReadiness()` function requiring BOTH guest count AND dates
    - **Code Added**:
      ```javascript
      function checkCalculatorReadiness() {
          let hasGuestCount = false;
          let hasDates = false;
          // Check guest count from input or server
          // Check dates from server (dates come from date-picker route)
          hasDates = hasDateInfoData;
          return hasGuestCount && hasDates;
      }
      ```
    - **Impact**: Centralizes calculator readiness logic requiring both conditions
  - **Updated Visibility Function** (Lines 316-335):
    - Updated `updateCalculatorVisibility()` to check both conditions
    - Hides/shows calculator, edit-date section, and minimum order sections
    - **Code Updated**:
      ```javascript
      function updateCalculatorVisibility() {
          const isReady = checkCalculatorReadiness();
          if (isReady) {
              calculatorContainer.style.display = '';
              editDateSection.style.display = '';
              minimumOrderSections.forEach(section => section.style.display = '');
          } else {
              calculatorContainer.style.display = 'none';
              editDateSection.style.display = 'none';
              minimumOrderSections.forEach(section => section.style.display = 'none');
          }
      }
      ```
    - **Impact**: All calculator-related elements show/hide together based on both conditions

- **Calculator Initialization Update** (`src/views/wizard/event-setup.hbs`):
  - **Conditional Initialization** (Lines 389-420):
    - Calculator only initializes if `checkCalculatorReadiness()` returns true
    - **Code Updated**:
      ```javascript
      const calculatorReadyForInit = checkCalculatorReadiness();
      if (calculatorReadyForInit) {
          // Initialize calculator
      } else {
          // Store menu data for deferred initialization
          window.__pendingCalculatorInit = { ... };
      }
      ```
    - **Impact**: Prevents calculator from initializing without dates, ensuring accurate pricing
  - **Deferred Initialization Function** (Lines 422-450):
    - Updated `initializeCalculatorIfNeeded()` to check both conditions
    - **Code Updated**:
      ```javascript
      function initializeCalculatorIfNeeded() {
          const isReady = checkCalculatorReadiness();
          if (!isReady) return;
          // Initialize calculator when both conditions met
      }
      ```
    - **Impact**: Calculator initializes when user enters guest count AND dates are available

- **Live Calculator on Event-Summary Page** (`src/routes/eventSummary.ts`):
  - **Menu Sections Fetching** (Lines 18-30):
    - Added `MenuService` import and menu fetching logic
    - **Code Added**:
      ```typescript
      import { MenuService } from '../services/menuService';
      let menuSections = null;
      if (theme) {
        menuSections = await MenuService.getThemeMenu(theme);
      }
      ```
    - **Impact**: Menu sections available for calculator initialization
  - **Calculator Data Extraction** (Lines 32-58):
    - Extracts guest count from `eventSetup` session
    - Calculates `numberOfDays` from `dateInfo.dates`
    - Determines `canShowCalculator` flag
    - **Code Added**:
      ```typescript
      let guestCount: number | null = null;
      let numberOfDays = 1;
      // Extract guest count from eventSetup
      // Calculate numberOfDays from dateInfo.dates
      const canShowCalculator = guestCount !== null && guestCount > 0 && numberOfDays > 0 && menuSections !== null;
      ```
    - **Impact**: Calculator can be initialized on event-summary page
  - **Template Data Enhancement** (Lines 200-210):
    - Added calculator-related data to template
    - **Code Added**:
      ```typescript
      menuSections: menuSections,
      menuSectionsJson: menuSections ? JSON.stringify(menuSections) : 'null',
      guestCount: guestCount,
      numberOfDays: numberOfDays,
      canShowCalculator: canShowCalculator,
      eventSetupJson: eventSetup ? JSON.stringify(eventSetup) : 'null'
      ```
    - **Impact**: Template has all data needed for calculator initialization

- **Event-Summary Template Calculator Integration** (`src/views/wizard/event-summary.hbs`):
  - **Calculator Container** (Lines 45-52):
    - Added calculator container in event-setup section
    - **Code Added**:
      ```handlebars
      {{#if canShowCalculator}}
      <div id="koi-live-quote-summary" class="calculator-summary-section">
        <h3>Live Quote</h3>
        <div class="kloi-calculator"></div>
      </div>
      {{/if}}
      ```
    - **Impact**: Calculator displays on event-summary page
  - **Hidden Data Div** (Lines 64-67):
    - Added server data div with calculator initialization data
    - **Code Added**:
      ```handlebars
      <div id="summaryServerData" data-menu-sections="{{menuSectionsJson}}" data-number-of-days="{{numberOfDays}}" data-guest-count="{{guestCount}}" data-event-setup="{{eventSetupJson}}" ...>
      ```
    - **Impact**: JavaScript can access all calculator initialization data
  - **Calculator Initialization Script** (Lines 77-232):
    - Initializes menu labels
    - Initializes calculator with menu sections, numberOfDays, and guest count
    - Restores calculator state from session (radios, checkboxes, products)
    - **Code Added**:
      ```javascript
      // Initialize menu labels
      window.KloiMenuLabels.initFromMenuSections(menuSectionsJson);
      // Initialize calculator
      const calc = window.KloiCalculator.initFromMenuSections(menuSectionsJson, { taxPercent: 0, numberOfDays: numberOfDays });
      calc.setGuestCount(guestCount);
      // Restore state from session
      ```
    - **Impact**: Calculator shows live quote with all user selections restored

- **Calculator State Restoration Enhancement** (`src/views/wizard/event-summary.hbs`):
  - **Dual Source Restoration** (Lines 110-195):
    - Restores from `calculator.getState()` format first (radios, checkboxes, products)
    - Falls back to form data format (radioSelections, checkboxSelections, productQuantities)
    - **Code Added**:
      ```javascript
      // Restore from calculator state
      if (eventSetup.calculator) {
          if (calcState.radios) { /* restore radios */ }
          if (calcState.checkboxes) { /* restore checkboxes */ }
          if (calcState.products) { /* restore products */ }
      }
      // Fallback to form data
      if (eventSetup.radioSelections) { /* restore from form data */ }
      ```
    - **Impact**: Calculator state restored even if calculator state wasn't saved, using form data as fallback

- **User-Friendly Label Display Fix** (`src/routes/eventSummary.ts`):
  - **Radio Selections Display** (Lines 135-147):
    - Uses `radioSelectionsDisplay` for friendly labels
    - Falls back to raw option key if display label unavailable
    - **Code Updated**:
      ```typescript
      const radioItems = Object.entries(data.radioSelections).map(([groupId, optionKey]) => {
        let displayLabel = String(optionKey);
        if (data.radioSelectionsDisplay && data.radioSelectionsDisplay[groupId]) {
          displayLabel = data.radioSelectionsDisplay[groupId];
        }
        return `<li><strong>${escapeHtml(displayLabel)}</strong></li>`;
      }).join('');
      ```
    - **Impact**: Shows "Matcha Ice Cream Only" instead of "section5: radio1"
  - **Checkbox Selections Display** (Lines 149-161):
    - Uses `checkboxSelectionsDisplay` for friendly labels
    - Falls back to raw option key if display label unavailable
    - **Code Updated**:
      ```typescript
      const checkboxItems = Object.entries(data.checkboxSelections).map(([optionKey]) => {
        let displayLabel = String(optionKey);
        if (data.checkboxSelectionsDisplay && data.checkboxSelectionsDisplay[optionKey]) {
          displayLabel = data.checkboxSelectionsDisplay[optionKey];
        }
        return `<li><strong>${escapeHtml(displayLabel)}</strong></li>`;
      }).join('');
      ```
    - **Impact**: Shows "Matcha Upgrade (Ceremonial Grade)" instead of "checbox1: checbox1"
  - **Product Quantities Display** (Lines 163-178):
    - Uses `productLabels` for friendly labels
    - Falls back to raw product key if display label unavailable
    - **Code Updated**:
      ```typescript
      const quantityItems = Object.entries(data.productQuantities)
        .filter(([key]) => key !== 'guest-count')
        .map(([productKey, qty]) => {
          let displayLabel = String(productKey);
          if (data.productLabels && data.productLabels[productKey]) {
            displayLabel = data.productLabels[productKey];
          }
          return `<li><strong>${escapeHtml(displayLabel)}:</strong> ${escapeHtml(String(qty))}</li>`;
        }).join('');
      ```
    - **Impact**: Shows "Zero Sugar Ice Cream: 30" instead of "zero-sugar: 30"
  - **Excluded Display Label Fields** (Line 186):
    - Added display label fields to excluded keys list
    - **Code Updated**:
      ```typescript
      const excludedKeys = ['radioSelections', 'checkboxSelections', 'productQuantities', 'calculator', 'radioSelectionsDisplay', 'checkboxSelectionsDisplay', 'productLabels'];
      ```
    - **Impact**: Prevents display label metadata from appearing in generic fallback display

- **TypeScript Error Fix** (`src/routes/eventSummary.ts`):
  - **Unused Variable Removal** (Line 152):
    - Removed unused `value` parameter from checkbox items mapping
    - **Code Updated**:
      ```typescript
      const checkboxItems = Object.entries(data.checkboxSelections).map(([optionKey]) => {
        // Removed unused 'value' parameter
      });
      ```
    - **Impact**: Resolves TypeScript compilation error TS6133

#### Technical Details

- **Calculator Requirements Rationale**:
  - Calculator needs `numberOfDays` for accurate pricing (affects minimum order calculations)
  - Dates come from date-picker route, not event-setup route
  - Calculator should only show when both guest count AND dates are available
  - This ensures accurate pricing calculations from the start

- **State Restoration Strategy**:
  - Primary: Restore from `calculator.getState()` format (radios, checkboxes, products)
  - Fallback: Restore from form data format (radioSelections, checkboxSelections, productQuantities)
  - This handles cases where calculator state wasn't saved but form data exists

- **Label Display Strategy**:
  - Use display label fields (`radioSelectionsDisplay`, `checkboxSelectionsDisplay`, `productLabels`) when available
  - Fallback to raw keys if display labels not available
  - Ensures consistent user-friendly display across all pages

#### Files Modified

1. `src/routes/eventSetup.ts`:
   - Lines 79-109: Added date info validation and `hasDateInfo` flag
   - Lines 111-112: Added `canShowCalculator` flag calculation
   - Lines 120-122: Added `hasDateInfo` and `canShowCalculator` to template data

2. `src/views/wizard/event-setup.hbs`:
   - Line 178: Added conditional hiding for minimum order sections
   - Line 211: Changed calculator visibility condition to `canShowCalculator`
   - Line 216: Added conditional hiding for edit-date section
   - Line 236: Added `hasDateInfo` and `canShowCalculator` to server data attributes
   - Lines 296-314: Added `checkCalculatorReadiness()` function
   - Lines 316-335: Updated `updateCalculatorVisibility()` to check both conditions
   - Lines 389-420: Updated calculator initialization to require both conditions
   - Lines 422-450: Updated `initializeCalculatorIfNeeded()` to check both conditions

3. `src/routes/eventSummary.ts`:
   - Line 3: Added `MenuService` import
   - Lines 18-30: Added menu sections fetching logic
   - Lines 32-58: Added calculator data extraction (guest count, numberOfDays, canShowCalculator)
   - Lines 200-210: Added calculator-related data to template
   - Lines 135-147: Updated radio selections display to use friendly labels
   - Lines 149-161: Updated checkbox selections display to use friendly labels
   - Lines 163-178: Updated product quantities display to use friendly labels
   - Line 186: Added display label fields to excluded keys

4. `src/views/wizard/event-summary.hbs`:
   - Lines 45-52: Added calculator container in event-setup section
   - Lines 64-67: Added hidden server data div with calculator initialization data
   - Lines 69-71: Added calculator and menu labels script includes
   - Lines 77-232: Added calculator initialization script with state restoration

#### Impact

- **User Experience**:
  - Calculator only shows when both guest count AND dates are available
  - Live calculator displays on event-summary page with accurate pricing
  - User-friendly labels displayed throughout event-summary page
  - Consistent display format across event-setup and event-summary pages

- **Data Accuracy**:
  - Calculator pricing calculations are accurate from initialization
  - Calculator state properly restored from session data
  - Fallback to form data ensures state restoration even if calculator state not saved

- **Code Quality**:
  - Centralized calculator readiness logic
  - Proper separation of concerns (visibility vs initialization)
  - TypeScript compilation errors resolved

#### Migration Notes

- **No Database Changes Required**: This is a frontend and routing change only
- **No API Changes Required**: Existing API endpoints remain unchanged
- **Session Data**: Existing sessions will work correctly - calculator will show when both conditions met
- **Backward Compatibility**: Fully backward compatible - calculator state restoration handles both formats
- **Immediate Effect**: Changes take effect immediately - calculator visibility and label display updated
- **Testing**: Verify calculator:
  1. Only shows when both guest count AND dates are available
  2. Displays correctly on event-summary page
  3. Shows user-friendly labels instead of raw keys
  4. Restores state correctly from session data

---

### December 5, 2025 @ 12:16 - Calculator Initialization Fix - Prevent Rendering Without Guest Count

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical issue where calculator was initializing and rendering immediately on page load even without guest count in session cookie. Calculator now uses deferred initialization pattern - only initializes when guest count is available (either from session or user input). This prevents calculator from rendering empty/invalid state and ensures proper visibility control.

#### Major Changes

- **Guest Count Availability Check Function** (`src/views/wizard/event-setup.hbs`):
  - **New Function** (Lines 296-314):
    - Added `checkGuestCountAvailable()` helper function
    - Checks guest count from both input field and server data attributes
    - Returns boolean indicating if guest count is available and valid (> 0)
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [CALCULATOR VISIBILITY] Function to check if guest count is available
      function checkGuestCountAvailable() {
          const guestCountInput = document.querySelector('input[name="guest-count"]');
          
          // 🟡🟡🟡 - [GUEST COUNT CHECK] Check if guest count is available from input or server
          if (guestCountInput) {
              const guestCountValue = parseInt(guestCountInput.value) || 0;
              if (guestCountValue > 0) {
                  return true;
              }
          }
          
          // 🟡🟡🟡 - [GUEST COUNT CHECK] Check server data
          if (hasGuestCountData && guestCountFromServer && guestCountFromServer > 0) {
              return true;
          }
          
          return false;
      }
      ```
    - **Impact**: Centralizes guest count availability logic for consistent checks across all calculator operations

- **Conditional Calculator Initialization** (`src/views/wizard/event-setup.hbs`):
  - **Initialization Logic Change** (Lines 337-369):
    - **CRITICAL FIX**: Calculator initialization now conditional on guest count availability
    - **Previous Behavior**: Calculator initialized immediately on page load, rendering even without guest count
    - **New Behavior**: Calculator only initializes if `checkGuestCountAvailable()` returns true
    - **Code Updated**:
      ```javascript
      // 🟡🟡🟡 - [CALCULATOR INIT] Only initialize calculator if guest count is available
      // ⚠️⚠️⚠️ - [CALCULATOR INIT] Calculator renders immediately on init, so we must check guest count first
      const hasGuestCountForInit = checkGuestCountAvailable();
      
      if (menuSectionsData && window.KloiCalculator) {
          if (hasGuestCountForInit) {
              // Initialize calculator
              calc = window.KloiCalculator.initFromMenuSections(menuSectionsData, { taxPercent: 0, numberOfDays: numberOfDays });
              // ... set guest count if available
          } else {
              // 🟡🟡🟡 - [CALCULATOR DEFERRED INIT] Store menu data for later initialization
              window.__pendingCalculatorInit = {
                  menuSectionsData: menuSectionsData,
                  numberOfDays: numberOfDays,
                  guestCountFromServer: guestCountFromServer
              };
          }
      }
      ```
    - **Impact**: Prevents calculator from rendering without guest count, eliminating empty/invalid calculator display

- **Deferred Calculator Initialization Function** (`src/views/wizard/event-setup.hbs`):
  - **New Function** (Lines 374-395):
    - Added `initializeCalculatorIfNeeded()` function for on-demand calculator initialization
    - Checks if calculator is not initialized and pending initialization data exists
    - Initializes calculator when called (typically when guest count becomes available)
    - Sets guest count immediately after initialization
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [CALCULATOR DEFERRED INIT] Function to initialize calculator when guest count becomes available
      function initializeCalculatorIfNeeded() {
          if (!calc && window.__pendingCalculatorInit && window.KloiCalculator) {
              const pending = window.__pendingCalculatorInit;
              console.log('🟡🟡🟡 - [EVENT SETUP JS] Initializing deferred calculator now that guest count is available');
              
              calc = window.KloiCalculator.initFromMenuSections(pending.menuSectionsData, { taxPercent: 0, numberOfDays: pending.numberOfDays });
              if (calc) {
                  // 🟡🟡🟡 - [GUEST COUNT] Set guest count from input or server
                  const guestCountInput = document.querySelector('input[name="guest-count"]');
                  const guestCountValue = guestCountInput ? parseInt(guestCountInput.value) || 0 : (pending.guestCountFromServer || 0);
                  if (guestCountValue > 0) {
                      calc.setGuestCount(guestCountValue);
                  }
                  
                  try { window.__kloiCalc = calc; } catch(_e) {}
                  delete window.__pendingCalculatorInit;
              }
          }
      }
      ```
    - **Impact**: Enables calculator to initialize dynamically when guest count becomes available, ensuring proper state

- **Updated Visibility Control Function** (`src/views/wizard/event-setup.hbs`):
  - **Function Refactoring** (Lines 316-335):
    - Refactored `updateCalculatorVisibility()` to use `checkGuestCountAvailable()` helper
    - Simplified logic by delegating guest count check to dedicated function
    - **Code Updated**:
      ```javascript
      function updateCalculatorVisibility() {
          const calculatorContainer = document.getElementById('koi-live-quote');
          
          if (!calculatorContainer) {
              console.warn('⚠️⚠️⚠️ - [EVENT SETUP JS] Calculator container not found');
              return;
          }
          
          const hasGuestCount = checkGuestCountAvailable();
          
          // 🟡🟡🟡 - [VISIBILITY CONTROL] Show calculator if guest count is available
          if (hasGuestCount) {
              calculatorContainer.style.display = '';
          } else {
              calculatorContainer.style.display = 'none';
          }
      }
      ```
    - **Impact**: Cleaner code with consistent guest count checking logic

- **Quantity Button Click Handler Update** (`src/views/wizard/event-setup.hbs`):
  - **Guest Count Handler Enhancement** (Lines 552-578):
    - Added call to `initializeCalculatorIfNeeded()` before using calculator
    - Handles case where calculator is not yet initialized when guest count button is clicked
    - **Code Updated**:
      ```javascript
      const productEl = this.closest('.product-item');
      if (productEl && productEl.dataset.productId === 'guest-count') {
          // 🟡🟡🟡 - [CALCULATOR DEFERRED INIT] Initialize calculator if guest count just became available
          if (!calc) {
              initializeCalculatorIfNeeded();
          }
          
          if (calc) {
              calc.setGuestCount(value);
              updateAddonMaxValues();
              updateCalculatorVisibility();
              updateMinimumOrderVisibility();
          } else {
              // Still update addon max values even if calculator not initialized
              updateAddonMaxValues();
              updateCalculatorVisibility();
          }
      }
      ```
    - **Impact**: Ensures calculator initializes when user clicks guest count buttons (+/-)

- **Quantity Input Change Handler Update** (`src/views/wizard/event-setup.hbs`):
  - **Guest Count Handler Enhancement** (Lines 598-622):
    - Added call to `initializeCalculatorIfNeeded()` before using calculator
    - Handles direct input changes to guest count field
    - **Code Updated**:
      ```javascript
      if (productEl && productEl.dataset.productId === 'guest-count') {
          // 🟡🟡🟡 - [CALCULATOR DEFERRED INIT] Initialize calculator if guest count just became available
          if (!calc) {
              initializeCalculatorIfNeeded();
          }
          
          if (calc) {
              calc.setGuestCount(value);
              updateAddonMaxValues();
              updateCalculatorVisibility();
              updateMinimumOrderVisibility();
          } else {
              updateAddonMaxValues();
              updateCalculatorVisibility();
          }
      }
      ```
    - **Impact**: Ensures calculator initializes when user directly types guest count value

- **Guest Count Input Listener Enhancement** (`src/views/wizard/event-setup.hbs`):
  - **Input Event Handler Update** (Lines 629-646):
    - Added call to `initializeCalculatorIfNeeded()` when guest count > 0 and calculator not initialized
    - Updates calculator guest count if already initialized
    - **Code Updated**:
      ```javascript
      guestCountInput.addEventListener('input', function() {
          const value = parseInt(this.value) || 0;
          
          // 🟡🟡🟡 - [CALCULATOR DEFERRED INIT] Initialize calculator if guest count just became available
          if (value > 0 && !calc) {
              initializeCalculatorIfNeeded();
          }
          
          updateAddonMaxValues();
          updateCalculatorVisibility();
          
          // 🟡🟡🟡 - [CALCULATOR UPDATE] Update calculator if initialized
          if (calc) {
              calc.setGuestCount(value);
              updateMinimumOrderVisibility();
          }
      });
      ```
    - **Impact**: Ensures calculator initializes on real-time input changes to guest count field

#### Technical Details

- **Root Cause**: 
  - `KloiCalculatorUI` constructor calls `render()` immediately (line 262 in `kloi_calculator.js`)
  - Previous implementation initialized calculator on page load regardless of guest count availability
  - Calculator rendered empty/invalid state even when container was hidden with CSS

- **Solution Pattern**:
  - **Deferred Initialization**: Store initialization data in `window.__pendingCalculatorInit` when guest count unavailable
  - **On-Demand Initialization**: Initialize calculator when guest count becomes available via `initializeCalculatorIfNeeded()`
  - **Conditional Initialization**: Check guest count availability before calling `KloiCalculator.initFromMenuSections()`

- **Initialization Triggers**:
  1. Page load with guest count in session (immediate initialization)
  2. User clicks guest count +/- buttons (deferred initialization)
  3. User types guest count value (deferred initialization)
  4. User changes guest count input field (deferred initialization)

- **State Management**:
  - `calc` variable tracks calculator instance (null until initialized)
  - `window.__pendingCalculatorInit` stores menu data for deferred initialization
  - `window.__kloiCalc` global reference set after initialization

#### Files Modified

1. `src/views/wizard/event-setup.hbs`:
   - Lines 296-314: Added `checkGuestCountAvailable()` function
   - Lines 316-335: Refactored `updateCalculatorVisibility()` to use helper function
   - Lines 337-369: Changed calculator initialization to conditional based on guest count
   - Lines 374-395: Added `initializeCalculatorIfNeeded()` deferred initialization function
   - Lines 552-578: Updated quantity button click handler for guest-count to call deferred init
   - Lines 598-622: Updated quantity input change handler for guest-count to call deferred init
   - Lines 629-646: Enhanced guest count input listener to call deferred init

#### Impact

- **User Experience**:
  - Calculator no longer renders empty/invalid state on first page load
  - Calculator appears smoothly when guest count is entered
  - No visual glitches or empty calculator displays
  - Consistent behavior whether guest count comes from session or user input

- **Performance**:
  - Calculator initialization deferred until needed (lazy loading)
  - Reduces unnecessary DOM manipulation on page load
  - Calculator only renders when it has valid data to display

- **Code Quality**:
  - Centralized guest count availability checking
  - Clear separation between initialization and visibility control
  - Better error handling for missing guest count scenarios

- **Bug Fix**:
  - **FIXED**: Calculator rendering without guest count in session cookie
  - **FIXED**: Empty calculator display showing "Minimum Order Per Day AED 2111 Per day" with no valid data
  - **FIXED**: Calculator rendering before guest count validation

#### Migration Notes

- **No Database Changes Required**: This is a frontend JavaScript change only
- **No API Changes Required**: Existing API endpoints remain unchanged
- **No Session Changes Required**: Session structure remains the same
- **Backward Compatibility**: Fully backward compatible - calculator still works with existing session data
- **Immediate Effect**: Changes take effect immediately - calculator will no longer render without guest count
- **Testing**: Verify calculator appears when:
  1. Guest count entered on first visit
  2. Returning from edit with guest count in session
  3. Guest count changed via buttons or direct input

---

### December 4, 2025 @ 21:07 - Calculator Visibility Fix and Event-Summary Rendering Improvements

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed calculator visibility on event-setup page to initialize but remain hidden until guest count is available. Calculator now shows when guest count is entered or when returning from edit with guest count in session. Improved event-setup section rendering in event-summary page to properly display guest count, calculator totals, and all event setup data after route order changes.

#### Major Changes

- **Guest Count Extraction in Event-Setup Route** (`src/routes/eventSetup.ts`):
  - **Guest Count Detection** (Lines 53-77):
    - Extracts guest count from `eventSetup` session data
    - Checks multiple locations: `eventSetup.productQuantities['guest-count']` and `eventSetup.calculator.guestCount`
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [GUEST COUNT] Extract guest count from eventSetup session for calculator visibility
      let guestCount: number | null = null;
      const eventSetup = sessionData.eventSetup as any;
      if (eventSetup) {
        // Try productQuantities first
        if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
          const guestCountValue = eventSetup.productQuantities['guest-count'];
          if (typeof guestCountValue === 'number' && guestCountValue > 0) {
            guestCount = guestCountValue;
          }
        }
        
        // Fallback to calculator.guestCount if not found
        if (guestCount === null && eventSetup.calculator && typeof eventSetup.calculator === 'object') {
          const calculatorGuestCount = eventSetup.calculator.guestCount;
          if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
            guestCount = calculatorGuestCount;
          }
        }
      }
      
      const hasGuestCount = guestCount !== null && guestCount > 0;
      ```
    - **Impact**: Enables template to conditionally show/hide calculator based on guest count availability
  - **Template Data Enhancement** (Lines 85-100):
    - Added `guestCount` and `hasGuestCount` to template data
    - **Code Updated**:
      ```typescript
      const templateData = {
        // ... existing fields
        guestCount: guestCount, // Pass guest count for calculator visibility
        hasGuestCount: hasGuestCount // Pass boolean flag for calculator visibility
      };
      ```

- **Calculator Visibility Control** (`src/views/wizard/event-setup.hbs`):
  - **Template Conditional Rendering** (Lines 210-212):
    - Calculator container hidden initially if guest count not available
    - **Code Updated**:
      ```handlebars
      <div id="koi-live-quote" style="{{#unless hasGuestCount}}display: none;{{/unless}}">
        <div class="kloi-calculator"></div>
      </div>
      ```
    - **Impact**: Calculator container is hidden on first load when guest count is not in session
  - **Server Data Attributes** (Line 234):
    - Added guest count data attributes to `serverData` div
    - **Code Updated**:
      ```handlebars
      <div id="serverData" data-menu-sections="{{menuSectionsJson}}" data-number-of-days="{{numberOfDays}}" data-guest-count="{{guestCount}}" data-has-guest-count="{{hasGuestCount}}" style="display: none;"></div>
      ```
  - **JavaScript Guest Count Reading** (Lines 272-277):
    - Reads guest count from server data attributes
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [GUEST COUNT] Read guest count from server data for calculator visibility
      const guestCountData = serverDataDiv?.dataset.guestCount;
      const hasGuestCountData = serverDataDiv?.dataset.hasGuestCount === 'true';
      const guestCountFromServer = guestCountData ? parseInt(guestCountData, 10) : null;
      ```
  - **Calculator Initialization with Guest Count** (Lines 289-310):
    - Calculator initializes even when hidden
    - Guest count set in calculator if available from server
    - **Code Updated**:
      ```javascript
      if (menuSectionsData && window.KloiCalculator) {
        calc = window.KloiCalculator.initFromMenuSections(menuSectionsData, { taxPercent: 0, numberOfDays: numberOfDays });
        if (calc) {
          // Set guest count if available from server
          if (guestCountFromServer && guestCountFromServer > 0) {
            calc.setGuestCount(guestCountFromServer);
          }
        }
      }
      ```
  - **Calculator Visibility Function** (Lines 312-340):
    - Added `updateCalculatorVisibility()` function to show/hide calculator
    - Checks guest count from input or server data
    - **Code Added**:
      ```javascript
      function updateCalculatorVisibility() {
        const calculatorContainer = document.getElementById('koi-live-quote');
        const guestCountInput = document.querySelector('input[name="guest-count"]');
        
        let hasGuestCount = false;
        if (guestCountInput) {
          const guestCountValue = parseInt(guestCountInput.value) || 0;
          hasGuestCount = guestCountValue > 0;
        } else if (hasGuestCountData && guestCountFromServer && guestCountFromServer > 0) {
          hasGuestCount = true;
        }
        
        if (hasGuestCount) {
          calculatorContainer.style.display = '';
        } else {
          calculatorContainer.style.display = 'none';
        }
      }
      ```
    - **Impact**: Calculator shows/hides dynamically based on guest count availability
  - **Guest Count Change Listeners** (Lines 465-469, 495-499, 508-513):
    - Added `updateCalculatorVisibility()` calls when guest count changes
    - Triggers on quantity button clicks, input changes, and input events
    - **Code Updated**:
      ```javascript
      // In quantity button click handler
      if (productEl && productEl.dataset.productId === 'guest-count') {
        calc.setGuestCount(value);
        updateAddonMaxValues();
        updateCalculatorVisibility(); // Show calculator when guest count is set
      }
      
      // In quantity input change handler
      if (productEl && productEl.dataset.productId === 'guest-count') {
        calc.setGuestCount(value);
        updateAddonMaxValues();
        updateCalculatorVisibility(); // Show calculator when guest count is set
      }
      
      // In guest count input listener
      guestCountInput.addEventListener('input', function() {
        updateAddonMaxValues();
        updateCalculatorVisibility(); // Update calculator visibility on input change
      });
      ```

- **Event-Summary Rendering Improvements** (`src/routes/eventSummary.ts`):
  - **Enhanced Event-Setup Section Rendering** (Lines 72-120):
    - Guest count displayed prominently (from `productQuantities` or `calculator`)
    - Product quantities exclude guest-count (shown separately)
    - Calculator totals displayed (subtotal, total, minimum order)
    - Better handling of nested objects
    - **Code Updated**:
      ```typescript
      } else if (sectionName === 'event-setup') {
        // Display guest count prominently if available
        let guestCountDisplayed = false;
        if (data.productQuantities && typeof data.productQuantities === 'object') {
          const guestCount = data.productQuantities['guest-count'];
          if (typeof guestCount === 'number' && guestCount > 0) {
            items.push(`<dt>Guest Count</dt><dd>${escapeHtml(String(guestCount))}</dd>`);
            guestCountDisplayed = true;
          }
        }
        // Try calculator.guestCount if not in productQuantities
        if (!guestCountDisplayed && data.calculator && typeof data.calculator === 'object') {
          const calculatorGuestCount = data.calculator.guestCount;
          if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
            items.push(`<dt>Guest Count</dt><dd>${escapeHtml(String(calculatorGuestCount))}</dd>`);
          }
        }
        
        // Display radio selections, checkbox selections, product quantities (excluding guest-count)
        // Display calculator totals if available
        if (data.calculator && typeof data.calculator === 'object' && data.calculator.totals) {
          const totals = data.calculator.totals;
          if (totals.subtotal !== undefined) items.push(`<dt>Subtotal</dt><dd>AED ${escapeHtml(String(totals.subtotal.toFixed(2)))}</dd>`);
          if (totals.total !== undefined) items.push(`<dt>Total</dt><dd>AED ${escapeHtml(String(totals.total.toFixed(2)))}</dd>`);
          if (totals.minimumOrderTotal !== undefined && totals.minimumOrderTotal > 0) {
            items.push(`<dt>Minimum Order</dt><dd>AED ${escapeHtml(String(totals.minimumOrderTotal.toFixed(2)))}</dd>`);
          }
        }
      }
      ```
    - **Impact**: Event-summary now properly displays all event-setup data including guest count and calculator totals

#### Technical Details

- **Calculator Initialization Strategy**:
  - Calculator initializes even when hidden to ensure it's ready when guest count becomes available
  - Guest count is set in calculator from server data if available (when returning from edit)
  - Calculator becomes visible when guest count input has value > 0

- **Visibility Control Flow**:
  1. On page load: Check server data for guest count → hide/show calculator container
  2. On guest count input: Update calculator visibility dynamically
  3. On returning from edit: Guest count in session → calculator shows immediately

- **Event-Summary Data Display**:
  - Guest count is extracted from multiple sources (productQuantities, calculator)
  - Calculator totals are formatted as currency (AED)
  - Product quantities exclude guest-count to avoid duplication
  - All fields are properly escaped for HTML safety

#### Files Modified

1. `src/routes/eventSetup.ts`:
   - Lines 53-77: Added guest count extraction logic from eventSetup session
   - Lines 85-100: Added `guestCount` and `hasGuestCount` to template data

2. `src/views/wizard/event-setup.hbs`:
   - Lines 210-212: Added conditional style to hide calculator container if guest count not available
   - Line 234: Added `data-guest-count` and `data-has-guest-count` attributes to serverData div
   - Lines 272-277: Added guest count reading from server data attributes
   - Lines 289-310: Updated calculator initialization to set guest count from server if available
   - Lines 312-340: Added `updateCalculatorVisibility()` function
   - Lines 465-469: Added calculator visibility update in quantity button click handler for guest-count
   - Lines 495-499: Added calculator visibility update in quantity input change handler for guest-count
   - Lines 508-513: Added calculator visibility update in guest count input event listener

3. `src/routes/eventSummary.ts`:
   - Lines 72-120: Enhanced event-setup section rendering with guest count display, calculator totals, and improved data handling

#### Impact

- **User Experience**:
  - Calculator no longer appears empty on first load (hidden until guest count available)
  - Calculator appears immediately when user enters guest count
  - Calculator appears immediately when returning from edit with guest count in session
  - Event-summary page now displays all event-setup data clearly, including guest count and totals

- **Data Integrity**:
  - Guest count is properly extracted from multiple session locations
  - Calculator state is maintained when returning from edit
  - Event-summary displays complete and accurate event setup information

- **Code Quality**:
  - Calculator visibility logic is centralized in `updateCalculatorVisibility()` function
  - Guest count detection follows same pattern as date-picker route
  - Event-summary rendering handles all data structures properly

#### Migration Notes

- **No Database Changes Required**: This is a frontend and rendering change only
- **No API Changes Required**: Existing API endpoints remain unchanged
- **Session Data**: Works with existing session structure - no migration needed
- **Backward Compatible**: Calculator still initializes even if guest count not available (just hidden)
- **Immediate Effect**: Changes take effect immediately - calculator visibility improves user experience

---

### December 4, 2025 @ 20:11 - Route Order Change and Dynamic Booked Days Based on Guest Count

**Type**: 🟠 MAJOR CHANGE

**Summary**: Changed wizard route order so event-setup comes before date-picker, and implemented dynamic `defaultBookedDays` calculation based on guest count. The number of days marked as BOOKED in the date picker now dynamically adjusts based on the number of guests entered in event-setup, with more guests requiring more preparation time. Guest count is now required before accessing date-picker - missing guest count triggers redirect to splash route.

#### Major Changes

- **Wizard Route Order Reconfiguration** (`src/routes/api/index.ts`):
  - **Route Flow Changed**: Updated `stepConfig` redirects to enforce new wizard flow
    - **Location**: Lines 17-24
    - **Previous Flow**: `/event-details` → `/date-picker` → `/event-setup` → `/event-summary`
    - **New Flow**: `/event-details` → `/event-setup` → `/date-picker` → `/event-summary`
    - **Code Updated**:
      ```typescript
      const stepConfig: Record<string, WizardStepConfig> = {
        location: { sessionKey: 'locationData', redirectTo: '/event-details' },
        customer: { sessionKey: 'eventDetails', redirectTo: '/event-setup' },
        'event-details': { sessionKey: 'eventDetails', redirectTo: '/event-setup' }, // Changed from '/date-picker'
        date: { sessionKey: 'dateInfo', redirectTo: '/event-summary' }, // Changed from '/event-setup'
        event: { sessionKey: 'eventSetup', redirectTo: '/date-picker' }, // Changed from '/event-summary'
        summary: { sessionKey: 'finalReview', redirectTo: '/checkout' },
      };
      ```
    - **Impact**: Users must complete event-setup (including guest count) before accessing date-picker, ensuring guest count is always available for booked days calculation

- **Guest Count Extraction and Validation** (`src/routes/datePicker.ts`):
  - **Guest Count Extraction** (Lines 39-75):
    - Extracts guest count from `eventSetup` session data
    - Checks multiple locations: `eventSetup.productQuantities['guest-count']` and `eventSetup.calculator.guestCount`
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [GUEST COUNT VALIDATION] Extract guest count from eventSetup session data
      const eventSetup = (request.session as any)?.eventSetup;
      let guestCount: number | null = null;
      
      if (eventSetup) {
        // Try productQuantities first
        if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
          const guestCountValue = eventSetup.productQuantities['guest-count'];
          if (typeof guestCountValue === 'number' && guestCountValue > 0) {
            guestCount = guestCountValue;
          }
        }
        
        // Fallback to calculator.guestCount
        if (guestCount === null && eventSetup.calculator && typeof eventSetup.calculator === 'object') {
          const calculatorGuestCount = eventSetup.calculator.guestCount;
          if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
            guestCount = calculatorGuestCount;
          }
        }
      }
      ```
  - **Guest Count Validation** (Lines 76-82):
    - **CRITICAL**: Guest count is REQUIRED - missing guest count means invalid session
    - If guest count is missing or invalid (null/undefined/<=0), redirects to `/` (splash route)
    - **Code Added**:
      ```typescript
      // ⚠️⚠️⚠️ - [GUEST COUNT VALIDATION] If guest count is missing, redirect to splash (invalid session)
      if (guestCount === null || guestCount <= 0) {
        console.log('❗❗❗ - [DATE PICKER] Guest count missing or invalid, redirecting to splash');
        return reply.redirect('/');
      }
      ```
    - **Impact**: Ensures guest count is always available before date-picker loads, preventing errors in booked days calculation
  - **Guest Count Passed to Template** (Line 61):
    - Guest count is passed to template as `guestCount` variable for JavaScript access

- **Template Data Attribute Addition** (`src/views/wizard/date-picker.hbs`):
  - **Guest Count Data Attribute** (Line 72):
    - Added `data-guest-count` attribute to `serverDateData` div
    - **Code Updated**:
      ```handlebars
      <div id="serverDateData" data-date-info="{{dateInfoJson}}" data-guest-count="{{guestCount}}" style="display: none;"></div>
      ```
    - **Impact**: JavaScript can now read guest count from template to calculate dynamic booked days

- **Dynamic Booked Days Calculation** (`public/global/js/date__picker.js`):
  - **Calculation Method** (Lines 80-115):
    - Added `calculateDefaultBookedDays(guestCount)` method with switch/case rules
    - **Rules Implemented**:
      - 1-10 guests: 3 days
      - 11-50 guests: 5 days
      - 51-200 guests: 14 days
      - 201-1000 guests: 30 days
      - Default: 3 days (fallback)
    - **Code Added**:
      ```javascript
      calculateDefaultBookedDays(guestCount) {
        let bookedDays;
        switch (true) {
          case guestCount >= 1 && guestCount <= 10:
            bookedDays = 3;
            break;
          case guestCount >= 11 && guestCount <= 50:
            bookedDays = 5;
            break;
          case guestCount >= 51 && guestCount <= 200:
            bookedDays = 14;
            break;
          case guestCount >= 201 && guestCount <= 1000:
            bookedDays = 30;
            break;
          default:
            bookedDays = 3;
            break;
        }
        return bookedDays;
      }
      ```
    - **Impact**: Rules are easily adjustable - can be modified in switch/case statement or moved to database in future
  - **Guest Count Reading Method** (Lines 117-145):
    - Added `calculateDefaultBookedDaysFromGuestCount()` method
    - Reads guest count from `serverDateData` div's `data-guest-count` attribute
    - Calls `calculateDefaultBookedDays()` and sets `this.defaultBookedDays`
    - **Code Added**:
      ```javascript
      calculateDefaultBookedDaysFromGuestCount() {
        const serverDataDiv = document.getElementById('serverDateData');
        const guestCountAttr = serverDataDiv?.dataset.guestCount;
        const guestCount = parseInt(guestCountAttr, 10);
        if (!isNaN(guestCount) && guestCount > 0) {
          this.defaultBookedDays = this.calculateDefaultBookedDays(guestCount);
        }
      }
      ```
  - **Integration into Init Flow** (Line 34):
    - `calculateDefaultBookedDaysFromGuestCount()` is called in `init()` method
    - Called after `fetchServerTime()` and before `fetchBookedDates()`
    - **Code Updated**:
      ```javascript
      async init() {
        await this.fetchServerTime();
        this.calculateDefaultBookedDaysFromGuestCount(); // Calculate before fetching booked dates
        await this.fetchBookedDates();
        // ... rest of init
      }
      ```
    - **Impact**: Ensures `defaultBookedDays` is set correctly before booked dates are fetched and processed

#### Technical Details

- **Route Order Rationale**:
  - Event-setup must come before date-picker to ensure guest count is collected first
  - Guest count is required for dynamic booked days calculation
  - This prevents users from accessing date-picker without completing event-setup

- **Guest Count Storage**:
  - Guest count is stored in session under `eventSetup.productQuantities['guest-count']` or `eventSetup.calculator.guestCount`
  - Both locations are checked for maximum compatibility
  - Guest count is collected from the guest counter input in event-setup form

- **Booked Days Logic**:
  - More guests = more preparation time needed = more days marked as BOOKED
  - Rules are configurable via switch/case statement for easy adjustment
  - Future enhancement: Rules can be moved to database configuration table

- **Validation Flow**:
  - Server-side validation in route handler ensures guest count exists before template render
  - Missing guest count triggers redirect to splash (same pattern as session hooks)
  - Client-side fallback uses default 3 days if guest count somehow unavailable (should not happen with proper validation)

#### Files Modified

1. `src/routes/api/index.ts`:
   - Lines 17-24: Updated `stepConfig` redirects for route order change
   - Changed `'event-details'` redirect from `/date-picker` to `/event-setup`
   - Changed `'event'` redirect from `/event-summary` to `/date-picker`
   - Changed `'date'` redirect from `/event-setup` to `/event-summary`

2. `src/routes/datePicker.ts`:
   - Lines 39-75: Added guest count extraction logic from `eventSetup` session
   - Lines 76-82: Added guest count validation with redirect to splash if missing
   - Line 61: Added `guestCount` to template data

3. `src/views/wizard/date-picker.hbs`:
   - Line 72: Added `data-guest-count="{{guestCount}}"` attribute to `serverDateData` div

4. `public/global/js/date__picker.js`:
   - Line 14: Updated comment for `defaultBookedDays` initialization
   - Lines 80-115: Added `calculateDefaultBookedDays(guestCount)` method with switch/case rules
   - Lines 117-145: Added `calculateDefaultBookedDaysFromGuestCount()` method
   - Line 34: Integrated guest count calculation into `init()` flow

#### Impact

- **User Experience**:
  - Users must complete event-setup (including guest count) before selecting dates
  - Date picker now shows appropriate number of booked days based on event size
  - Larger events (more guests) have more days marked as unavailable for booking

- **Business Logic**:
  - Preparation time scales with event size
  - Prevents booking conflicts for large events requiring more setup time
  - Rules can be easily adjusted as business needs change

- **Session Management**:
  - Guest count validation ensures data integrity
  - Missing guest count properly handled with redirect (prevents errors)
  - Session validation pattern consistent with existing session hooks

#### Migration Notes

- **No Database Changes Required**: This is a frontend and routing change only
- **No API Changes Required**: Existing API endpoints remain unchanged
- **Session Data**: Existing sessions without guest count will redirect to splash (expected behavior)
- **Backward Compatibility**: Users must complete event-setup before accessing date-picker (new requirement)
- **Immediate Effect**: Changes take effect immediately - users following wizard flow will see new route order
- **Rule Adjustment**: Booked days rules can be modified in `calculateDefaultBookedDays()` method without other code changes

---

### November 28, 2025 - Minimum Order Calculation Fix

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed calculator logic to prevent minimum order amounts from being added to the total when the minimum order requirement is already met. Previously, the minimum order amount was always added to the total regardless of whether the user's selections met the minimum requirement, resulting in incorrect totals.

#### Major Changes

- **Calculator Minimum Order Logic** (`public/global/js/kloi_calculator.js`):
  - **Fixed Total Calculation**: Updated minimum order addition logic to only add minimum order amount when subtotal is less than minimum order total
    - **Location**: Lines 230-237
    - **Previous Behavior**: Minimum order amount was always added to total if `minimumOrderTotal > 0`
    - **New Behavior**: Minimum order amount is only added when `subtotal < minimumOrderTotal`
    - **Code Updated**:
      ```javascript
      // 🟡🟡🟡 - [MINIMUM ORDER ADDITION] Only add minimum order to total if subtotal is less than minimum
      // ⚠️⚠️⚠️ - [MINIMUM ORDER LOGIC] When minimum is met (subtotal >= minimumOrderTotal), do NOT add minimum to total
      if (minimumOrderTotal > 0 && subtotal < minimumOrderTotal) {
        total += minimumOrderTotal
        console.log('🟡🟡🟡 - [KLOI CALC] Minimum order not met, adding minimum order amount to total:', minimumOrderTotal)
      } else if (minimumOrderTotal > 0 && subtotal >= minimumOrderTotal) {
        console.log('✅✅✅ - [KLOI CALC] Minimum order met, NOT adding minimum order amount to total')
      }
      ```
    - **Impact**: Calculator now correctly calculates totals - when minimum is met, only the subtotal (plus modifiers) is used as the total, without adding the minimum order amount

#### Technical Details

- **Calculation Logic**:
  - When `subtotal < minimumOrderTotal`: Minimum order amount is added to total (user needs to meet minimum)
  - When `subtotal >= minimumOrderTotal`: Minimum order amount is NOT added to total (minimum already met)
  - This ensures the total reflects only what the user actually needs to pay

- **Consistency with UI**:
  - Calculator display logic already hides minimum order section when minimum is met (lines 282-292)
  - Event setup template already hides minimum order divs when minimum is met (`updateMinimumOrderVisibility()` function)
  - This fix ensures the calculation matches the UI behavior

#### Files Modified

1. `public/global/js/kloi_calculator.js`:
   - Lines 230-237: Updated minimum order addition logic with conditional check

#### Impact

- **User Experience**: Users now see correct totals when minimum order requirements are met
- **Calculation Accuracy**: Total calculations now accurately reflect whether minimum order charges apply
- **Consistency**: Calculator logic now matches UI visibility behavior (minimum order hidden when met = minimum order not added when met)

#### Migration Notes

- **No Database Changes Required**: This is a frontend calculation fix only
- **No API Changes Required**: Calculator API remains unchanged
- **Backward Compatible**: Existing menu data structure and calculator state management unchanged
- **Immediate Effect**: Fix takes effect immediately on page refresh - no migration needed

---

### November 29, 2025 - Addon Items Calculator Integration Fix

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed calculator integration to properly include addon items in total calculations. After the nested addon items structure change (November 28, 2025), addon inputs were not being included in the calculator's price index or initialization, causing addon selections to be excluded from the total. This fix ensures addon items are properly indexed, initialized, and calculated as part of the quote total.

#### Major Changes

- **Calculator Price Index Update** (`public/global/js/kloi_calculator.js`):
  - **Addon Items Processing** (Lines 84-95):
    - Added processing logic for `addon-items` property in sections during price index building
    - Addon items are now extracted from sections with `addon-items` property (e.g., "Add Ons" section)
    - Addon items are added to the `products` price index, same as regular product-group items
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [ADDON ITEMS] Extract addon items from sections with addon-items property (e.g., "Add Ons" section)
      // 2025-11-28T00:00:00Z 🟡🟡🟡 - [ADDON ITEMS] Process addon-items nested in sections (not in content property)
      const addonItems = section['addon-items']
      if (addonItems && typeof addonItems === 'object') {
        Object.entries(addonItems).forEach(([productKey, productData]) => {
          index.products[productKey] = {
            price: toNumber(productData.price),
            basis: productData['price-basis'] || 'Per guest',
          }
        })
        console.log('🟡🟡🟡 - [KLOI CALC] Processed addon items from section:', id, Object.keys(addonItems))
      }
      ```
    - **Location**: Lines 84-95 in `buildPriceIndex()` method
    - **Impact**: Addon items are now included in the calculator's price lookup, enabling proper calculation

- **Event Setup Initialization Update** (`src/views/wizard/event-setup.hbs`):
  - **Product Input Selection Enhancement** (Lines 812-816):
    - Updated initialization selector to include both regular product-group inputs and addon-group inputs
    - **Previous Selector**: `.product-group .quantity-input` (only regular products)
    - **New Selector**: `.product-group .quantity-input, .addon-group .quantity-input` (includes addons)
    - **Code Updated**:
      ```javascript
      // Products (including addon items)
      // 2025-11-28T00:00:00Z 🟡🟡🟡 - [ADDON ITEMS] Include both regular product-group inputs and addon-group inputs
      const productInputs = document.querySelectorAll('.product-group .quantity-input, .addon-group .quantity-input');
      productInputs.forEach(pi => calc.setProductQty(pi.name, parseInt(pi.value) || 0));
      console.log('🟡🟡🟡 - [EVENT SETUP JS] Initialized product quantities:', productInputs.length, 'inputs');
      ```
    - **Location**: Lines 812-816 in initialization function
    - **Impact**: Addon inputs are now wired to the calculator during page load, ensuring initial state is correct

#### Technical Details

- **Price Index Building**:
  - The `buildPriceIndex()` method now checks for `addon-items` property on each section
  - Addon items are processed independently of the section's `html-type` or `content` property
  - Addon items are stored in the same `index.products` object as regular product-group items
  - This allows addon items to be calculated using the same product calculation logic

- **Initialization Flow**:
  - During page load, the calculator initialization now selects both:
    - Regular product inputs: `.product-group .quantity-input`
    - Addon inputs: `.addon-group .quantity-input`
  - All selected inputs are passed to `calc.setProductQty()` to set initial quantities
  - This ensures addon selections are included in the initial calculation

- **Event Listeners**:
  - Existing change event listeners already use `.quantity-input` selector, which includes addon inputs
  - Addon inputs correctly trigger `calc.setProductQty()` when changed via:
    - Quantity buttons (+/-)
    - Direct input changes
  - No changes needed to event listeners - they already handle addon inputs correctly

- **Calculation Logic**:
  - Addon items use the same calculation logic as regular products:
    - `lineTotal = basePrice * qty` (multiplies price by quantity input)
    - No multiplication by guest count (quantity input represents units/guests for the addon)
  - Addon items appear in the breakdown with kind `'product'` and are included in subtotal

#### Files Modified

1. `public/global/js/kloi_calculator.js`:
   - Lines 84-95: Added addon items processing in `buildPriceIndex()` method
   - Added logging to track when addon items are processed

2. `src/views/wizard/event-setup.hbs`:
   - Lines 812-816: Updated product input selector to include addon-group inputs
   - Added logging to show number of product inputs initialized

#### Impact

- **Calculator Accuracy**: Addon items are now correctly included in total calculations
- **User Experience**: Users can see addon selections reflected in the live quote calculator
- **Initialization**: Addon quantities are properly initialized on page load
- **Real-time Updates**: Addon quantity changes update the calculator in real-time
- **Backward Compatibility**: Regular product-group items continue to work as before

#### Migration Notes

- **No Database Changes Required**: This is a frontend calculation fix only
- **No API Changes Required**: Calculator API remains unchanged
- **No Menu JSON Changes Required**: Works with existing nested addon-items structure
- **Immediate Effect**: Fix takes effect immediately on page refresh - no migration needed
- **Related Change**: This fix addresses an issue introduced by the November 28, 2025 change "Addon Items Nested Structure and Dynamic Max Value Constraints"

#### Related Changes

- **November 28, 2025**: "Addon Items Nested Structure and Dynamic Max Value Constraints" - This change introduced the nested addon-items structure but did not update the calculator to process them, which is now fixed

---

### November 28, 2025 - Addon Items Nested Structure and Dynamic Max Value Constraints

**Type**: 🟠 MAJOR CHANGE

**Summary**: Updated the event setup menu rendering system to support nested addon items within the "Add Ons" section. Addon items are now nested directly within the section object instead of being in a separate product-group section. Additionally, implemented dynamic max value constraints for addon inputs that are automatically updated based on the guest count, ensuring users cannot select more addons than the number of guests.

#### Major Changes

- **Menu JSON Structure Update**:
  - **New Structure**: Addon items are now nested within the "Add Ons" section (h2 type) as an `addon-items` property
  - **Previous Structure**: Addon items were in a separate section with `html-type: "product-group"`
  - **Example Structure**:
    ```json
    "section6": {
      "order": 6,
      "content": "Add Ons",
      "html-type": "h2",
      "addon-items": {
        "zero-sugar": {
          "label": "Zero Sugar Ice Cream",
          "price": 9,
          "price-basis": "Per guest"
        }
      }
    }
    ```

- **Template Rendering Updates** (`src/views/wizard/event-setup.hbs`):
  - **Addon Items Rendering** (Lines 34-61):
    - Added conditional rendering for `addon-items` when section content is "Add Ons"
    - Renders addon items with the same structure as product-group items
    - Added `addon-group` and `addon-item` classes for identification
    - Added `addon-input` class and `data-max-based-on-guest="true"` attribute to addon quantity inputs
    - Initial max value set to 0 (updated dynamically by JavaScript)
    - **Code Added**:
      ```handlebars
      {{#if (eq content "Add Ons")}}
        {{#if (get this "addon-items")}}
          <div class="product-group addon-group" data-group-name="{{id}}" data-is-addon="true">
            {{#each (get this "addon-items")}}
              <div class="product-item addon-item" data-product-id="{{@key}}">
                <!-- Addon item rendering -->
                <input type="number" class="quantity-input addon-input" 
                       name="{{@key}}" data-max-based-on-guest="true" max="0">
              </div>
            {{/each}}
          </div>
        {{/if}}
      {{/if}}
      ```

  - **JavaScript Functionality** (Lines 393-425):
    - **New Function**: `updateAddonMaxValues()`
      - Retrieves current guest count value
      - Updates max attribute of all addon inputs to match guest count
      - Automatically adjusts addon input values if they exceed the new max
      - Includes comprehensive logging for debugging
      - **Location**: Lines 393-425

  - **Quantity Controls Enhancement** (Lines 427-508):
    - Updated `initializeQuantityControls()` function to handle addon max value updates
    - Added max value validation when quantity buttons are clicked
    - Added max value validation when quantity inputs are changed directly
    - Added event listener for guest count input changes to trigger addon max updates
    - **Key Updates**:
      - Lines 444-448: Max value check before incrementing/decrementing
      - Lines 457-459: Call to `updateAddonMaxValues()` when guest count changes via button
      - Lines 474-480: Max value validation for direct input changes
      - Lines 486-489: Call to `updateAddonMaxValues()` when guest count changes via input
      - Lines 499-505: Event listener for guest count input changes

  - **Initialization Updates** (Line 821):
    - Added call to `updateAddonMaxValues()` during page initialization
    - Ensures addon max values are set correctly on page load
    - **Location**: Line 821

- **Menu Service Updates** (`src/services/menuService.ts`):
  - **Addon Items Processing** (Lines 93-96):
    - Added handling for `addon-items` property when processing menu sections
    - Preserves `addon-items` in the processed section object for template access
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [ADDON ITEMS] Handle addon-items nested in sections (e.g., "Add Ons" section)
      if ((sectionData as any)['addon-items']) {
        (section as any)['addon-items'] = (sectionData as any)['addon-items'];
      }
      ```

- **Handlebars Helper Addition** (`src/app.ts`):
  - **New Helper**: `get` helper (Lines 55-58):
    - Enables access to object properties with hyphens or special characters in Handlebars templates
    - Required for accessing `addon-items` property in templates
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [HANDLEBARS GET HELPER] Helper to access object properties with hyphens or special characters
      handlebars.registerHelper('get', function(obj: any, key: string) {
        return obj && obj[key];
      });
      ```

#### Technical Details

- **Dynamic Max Value Updates**:
  - Addon inputs start with `max="0"` and are updated when:
    - Guest count is changed via quantity buttons (+/-)
    - Guest count is changed via direct input
    - Guest count input value changes (input event)
    - Page loads (initialization)

- **Value Validation**:
  - If an addon input value exceeds the new max (when guest count decreases), the value is automatically adjusted to match the max
  - Validation occurs both on button clicks and direct input changes

- **Backward Compatibility**:
  - Existing product-group sections continue to work as before
  - The new addon-items structure is optional and only applies to sections with content "Add Ons"

#### Files Modified

1. `src/views/wizard/event-setup.hbs`:
   - Lines 34-61: Addon items rendering logic
   - Lines 393-425: `updateAddonMaxValues()` function
   - Lines 427-508: Enhanced quantity controls with max value handling
   - Line 821: Initialization call for addon max values

2. `src/services/menuService.ts`:
   - Lines 93-96: Addon items property preservation

3. `src/app.ts`:
   - Lines 55-58: Handlebars `get` helper registration

#### Impact

- **Database**: No database changes required. This is a JSON structure change that should be applied to existing menu JSONB data in the `menus` table
- **API**: No API changes required
- **Frontend**: Template and JavaScript updates require page refresh to take effect
- **User Experience**: Users can no longer select more addons than the number of guests, preventing invalid selections

#### Migration Notes

- **Menu JSON Updates**: Existing menus in the database should be updated to move addon items from separate product-group sections into the `addon-items` property of the "Add Ons" section
- **Example Migration**:
  - **Before**: Separate `section7` with `html-type: "product-group"` containing addon items
  - **After**: `addon-items` property added to the "Add Ons" section (typically `section6`)

---

### November 26, 2025 - Minimum Order Display Logic Improvements

**Type**: 🟠 MAJOR CHANGE

**Summary**: Enhanced minimum order display logic to hide minimum order requirements when user selections meet or exceed the minimum order amount. This improves user experience by only showing minimum order information when it's relevant (i.e., when the minimum hasn't been met yet). Changes affect both the calculator display and the event setup template.

#### Major Changes

- **Calculator Minimum Order Display Logic** (`public/global/js/kloi_calculator.js`):
  - **Removed Individual Minimum Order Lines**: Removed the `<div class="calc-min-order-line">` elements that displayed individual minimum order items with labels and amounts
    - **Location**: Line 287 (previously in `minimumOrderBreakdown.map()` callback)
    - **Impact**: Calculator now only shows the minimum order total, not individual breakdown items
    - **Code Removed**:
      ```javascript
      ${minimumOrderBreakdown.map((mo) => {
        const daysInfo = mo.days ? ` (${mo.days} day${mo.days > 1 ? 's' : ''})` : ''
        return `<div class="calc-min-order-line">${mo.label}${daysInfo}: ${formatCurrency(mo.amount)}</div>`
      }).join('')}
      ```
  
  - **Conditional Minimum Order Section Display**: Updated logic to only show the entire minimum order section when the minimum is NOT met
    - **Location**: Lines 279-288
    - **Logic Change**: Added condition `subtotal < minimumOrderTotal` to the minimum order HTML generation
    - **Previous Behavior**: Minimum order section always displayed when `minimumOrderBreakdown.length > 0`
    - **New Behavior**: Minimum order section only displays when `minimumOrderBreakdown.length > 0` AND `subtotal < minimumOrderTotal`
    - **Code Updated**:
      ```javascript
      // 🟡🟡🟡 - [MINIMUM ORDER DISPLAY] Render minimum order information only if minimum is NOT met
      // 🟡🟡🟡 - [MINIMUM ORDER LOGIC] Only show minimum order section if subtotal < minimumOrderTotal
      let minimumOrderHtml = ''
      if (minimumOrderBreakdown && minimumOrderBreakdown.length > 0 && subtotal < minimumOrderTotal) {
        minimumOrderHtml = `
          <div class="calc-minimum-orders">
            <div class="calc-min-order-title" style="display: none;">Minimum Orders:</div>
            <div class="calc-min-order-total">Minimum Order Total: ${formatCurrency(minimumOrderTotal)}</div>
          </div>
        `
      }
      ```
    - **User Experience**: Users no longer see minimum order requirements once their selections meet the minimum, reducing visual clutter

- **Event Setup Template Minimum Order Visibility** (`src/views/wizard/event-setup.hbs`):
  - **New Function: `updateMinimumOrderVisibility()`**: Added function to dynamically show/hide minimum order divs based on calculator state
    - **Location**: Lines 422-456
    - **Functionality**:
      - Retrieves current quote from calculator using `calc.getQuote()`
      - Compares `subtotal` with `minimumOrderTotal`
      - Hides all `<div class="minimum_order">` elements when `subtotal >= minimumOrderTotal`
      - Shows minimum order divs when minimum is not met
    - **Code Added**:
      ```javascript
      // 🟡🟡🟡 - [MINIMUM ORDER VISIBILITY] Update minimum order divs visibility based on calculator state
      function updateMinimumOrderVisibility() {
        console.log('🟡🟡🟡 - [EVENT SETUP JS] Updating minimum order visibility');
        
        if (!calc || typeof calc.getQuote !== 'function') {
          console.log('🟡🟡🟡 - [EVENT SETUP JS] Calculator not available for minimum order check');
          return;
        }
        
        try {
          const quote = calc.getQuote();
          if (!quote) {
            console.log('🟡🟡🟡 - [EVENT SETUP JS] No quote available');
            return;
          }
          
          const subtotal = quote.subtotal || 0;
          const minimumOrderTotal = quote.minimumOrderTotal || 0;
          const isMinimumMet = subtotal >= minimumOrderTotal;
          
          // 🟡🟡🟡 - [MINIMUM ORDER LOGIC] Hide minimum order divs if minimum is met
          const minimumOrderDivs = document.querySelectorAll('.minimum_order');
          minimumOrderDivs.forEach(div => {
            if (isMinimumMet && minimumOrderTotal > 0) {
              div.style.display = 'none';
              console.log('🟡🟡🟡 - [EVENT SETUP JS] Hiding minimum order div (minimum met):', div.dataset.minOrderKey);
            } else {
              div.style.display = '';
              console.log('🟡🟡🟡 - [EVENT SETUP JS] Showing minimum order div (minimum not met):', div.dataset.minOrderKey);
            }
          });
          
          console.log('✅✅✅ - [EVENT SETUP JS] Minimum order visibility updated', { subtotal, minimumOrderTotal, isMinimumMet });
        } catch (err) {
          console.error('❗❗❗ - [EVENT SETUP JS] Error updating minimum order visibility:', err);
        }
      }
      ```
  
  - **Integration Points**: Added `updateMinimumOrderVisibility()` calls after all calculator state changes
    - **After Guest Count Changes**: Lines 389-394 (quantity controls), 407-411 (direct input changes)
    - **After Radio Selection Changes**: Line 609 (radio contraction handler)
    - **After Checkbox Selection Changes**: Line 645 (form input change handler)
    - **After Product Quantity Changes**: Lines 389-394, 407-411 (quantity controls)
    - **After Initial Calculator Setup**: Line 720 (initialization function)
    - **Code Pattern**: All calculator update calls now followed by `updateMinimumOrderVisibility()` to keep UI in sync

#### Technical Notes

⚠️⚠️⚠️ **Behavior Changes**:

- **Minimum Order Display**: Minimum order sections (both in calculator and template) now only appear when relevant
  - **Before**: Always visible when minimum orders exist in menu data
  - **After**: Only visible when `subtotal < minimumOrderTotal`
  - **Rationale**: Reduces visual clutter and only shows information when user needs to take action

- **Real-time Updates**: Minimum order visibility updates automatically whenever user selections change
  - Updates triggered by: guest count changes, radio selections, checkbox selections, product quantity changes
  - Ensures UI always reflects current calculator state

- **Data Source**: Minimum order amounts come from database table `public."Menus"` column `menuItems`
  - Minimum orders are extracted from `div-group` type sections in menu data
  - Supports both "Per day" and "Per event" pricing basis
  - Number of days is dynamically calculated from session/database data

#### Files Affected

- `public/global/js/kloi_calculator.js`:
  - Lines 279-288: Updated minimum order display logic with conditional rendering
  - Removed individual minimum order line rendering (previously line 287)

- `src/views/wizard/event-setup.hbs`:
  - Lines 422-456: Added `updateMinimumOrderVisibility()` function
  - Lines 389-394: Added visibility update after quantity control changes
  - Lines 407-411: Added visibility update after direct input changes
  - Line 609: Added visibility update after radio selection changes
  - Line 645: Added visibility update after checkbox/radio form input changes
  - Line 720: Added visibility update after initial calculator setup

#### Migration Notes

- **No Database Changes Required**: This is a frontend-only change
- **No API Changes Required**: Calculator API remains unchanged
- **Backward Compatible**: Existing menu data structure and calculator state management unchanged
- **User Experience Improvement**: Users will see cleaner UI when minimum orders are met

---

### November 25, 2025 - Payment Integration Bug Fixes and CSS Refactoring

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical TypeScript compilation errors and Handlebars template parsing errors in the payment integration. Resolved issues preventing successful builds and checkout page rendering. Additionally, extracted inline CSS from checkout template into external stylesheet for better maintainability and to enable styling changes without application redeployment.

#### Major Changes

- **TypeScript Compilation Error Fixes**: Resolved unused import and type errors
  - **Payment API Route** (`src/routes/api/payment.ts`): Removed unused imports
    - Removed `paymentStatusSchema` import (line 9) - was declared but never used
    - Removed `ZodError` import (line 12) - was declared but never used
    - These imports were leftover from initial implementation and not needed in final code
  
  - **Payment Processor Interface** (`src/services/payment/PaymentProcessor.ts`): Cleaned up type imports
    - Removed unused type imports: `CreatePaymentIntentParams`, `PaymentIntentResult`, `ConfirmPaymentParams`, `PaymentResult`, `RetrievePaymentParams`, `PaymentDetails`, `WebhookVerificationResult`
    - Kept only `PaymentProcessor` type import which is actually re-exported
    - File now only imports and re-exports the `PaymentProcessor` interface type
  
  - **Stripe Processor** (`src/services/payment/StripeProcessor.ts`): Updated Stripe API version
    - Changed API version from `'2024-12-18.acacia'` to `'2025-06-30.basil'` (line 39)
    - Updated to match Stripe SDK type definitions requirement
    - Added comment noting API version requirement

- **Handlebars Template Error Fix**: Fixed checkout page rendering error
  - **Issue**: Handlebars templates do not support JavaScript method calls like `.toFixed()` directly in template expressions
  - **Error**: `Parse error on line 64: Expecting 'ID', got 'INVALID'` when trying to use `{{order.subtotal.toFixed(2)}}`
  
  - **Checkout Route** (`src/routes/checkout.ts`): Added server-side number formatting
    - Created `formatAmount()` helper function to format numbers with 2 decimal places
    - Added formatted amount properties to order object passed to template:
      - `subtotalFormatted`: Formatted subtotal amount
      - `surchargeFormatted`: Formatted surcharge amount
      - `totalAmountFormatted`: Formatted total amount
    - All amounts now formatted server-side before template rendering
  
  - **Checkout Template** (`src/views/wizard/checkout.hbs`): Updated to use pre-formatted values
    - Replaced `{{order.subtotal.toFixed(2)}}` with `{{order.subtotalFormatted}}` (line 64)
    - Replaced `{{order.surcharge.toFixed(2)}}` with `{{order.surchargeFormatted}}` (line 68)
    - Replaced `{{order.totalAmount.toFixed(2)}}` with `{{order.totalAmountFormatted}}` (lines 72, 104)
    - Template now uses server-formatted values instead of attempting JavaScript method calls

- **CSS Extraction and Externalization**: Moved checkout styles to external file
  - **Created Checkout Stylesheet** (`public/global/css/checkout.css`): New dedicated CSS file
    - Extracted all checkout-specific styles from inline `<style>` block
    - Includes styles for:
      - `.checkout-container`: Grid layout for order summary and payment form
      - `.checkout-section`: Section styling with padding, border-radius, box-shadow
      - `.summary-item`: Order summary item styling with borders
      - `.price-breakdown`: Price breakdown section with background styling
      - `.price-row`: Price row flexbox layout
      - `.stripe-element`: Stripe Elements container styling
      - `.form-error`: Error message styling
      - `.spinner`: Loading spinner animation
      - `@keyframes spin`: Spinner rotation animation
      - `@media (max-width: 768px)`: Responsive mobile layout
    - Follows project CSS file naming convention (matches `event__setup.css`, `date__picker.css` pattern)
  
  - **Checkout Template** (`src/views/wizard/checkout.hbs`): Removed inline styles
    - Added stylesheet link at top of template: `<link rel="stylesheet" href="/public/global/css/checkout.css">`
    - Removed entire `<style>` block (previously lines 251-339)
    - Template now loads external CSS file, matching pattern used in other wizard pages
    - Enables styling changes without application rebuild/redeployment

#### Technical Notes

⚠️⚠️⚠️ **Critical Fixes**:

- **TypeScript Build Errors**: All 10 TypeScript compilation errors resolved
  - 2 errors in `src/routes/api/payment.ts` (unused imports)
  - 7 errors in `src/services/payment/PaymentProcessor.ts` (unused type imports)
  - 1 error in `src/services/payment/StripeProcessor.ts` (API version type mismatch)

- **Handlebars Template Parsing**: Fixed template syntax error preventing checkout page rendering
  - Handlebars does not support JavaScript method chaining in expressions
  - Solution: Format all numeric values server-side before passing to template
  - This is the correct approach for Handlebars templates

- **CSS Externalization Benefits**:
  - **No Redeployment Required**: CSS changes can be made directly to `public/global/css/checkout.css` without rebuilding TypeScript or restarting the application
  - **Better Organization**: Separation of concerns - styles separated from markup
  - **Consistent Pattern**: Matches existing project structure for page-specific stylesheets
  - **Easier Maintenance**: CSS in dedicated file is easier to locate and modify

#### Files Affected

- `src/routes/api/payment.ts` (MODIFIED) - Removed unused imports (`paymentStatusSchema`, `ZodError`)
- `src/services/payment/PaymentProcessor.ts` (MODIFIED) - Removed unused type imports, kept only `PaymentProcessor` type export
- `src/services/payment/StripeProcessor.ts` (MODIFIED) - Updated Stripe API version from `'2024-12-18.acacia'` to `'2025-06-30.basil'` to match SDK type requirements
- `src/routes/checkout.ts` (MODIFIED) - Added `formatAmount()` helper function and formatted amount properties (`subtotalFormatted`, `surchargeFormatted`, `totalAmountFormatted`) to order object
- `src/views/wizard/checkout.hbs` (MODIFIED) - Replaced `.toFixed()` method calls with pre-formatted values, added external stylesheet link, removed inline `<style>` block
- `public/global/css/checkout.css` (CREATED) - New dedicated stylesheet file containing all checkout page styles extracted from template

---

### November 20, 2025 - Payment Integration Implementation

**Type**: 🟠 MAJOR CHANGE / 🟢 DIRECTION CHANGE

**Summary**: Implemented comprehensive payment integration with Stripe using a swappable payment processor architecture. The implementation follows a strategy pattern that allows easy switching between payment providers (Stripe, PayPal, Square, etc.) without changing core business logic. The system includes payment intent creation, payment confirmation, webhook handling, checkout page, and complete order status management. All payment operations are PCI-compliant using Stripe Elements, and the architecture supports future payment provider additions with minimal code changes.

#### Major Changes

- **Payment Processor Abstraction Layer**: Created swappable payment provider architecture
  - **Payment Types** (`src/services/payment/types.ts`): TypeScript interfaces and types for all payment operations
    - `PaymentProcessor` interface defining contract for all providers
    - `CreatePaymentIntentParams`, `PaymentIntentResult`, `PaymentResult` types
    - `PaymentStatus` enum: 'pending', 'succeeded', 'failed', 'canceled', 'refunded'
    - `PaymentProvider` type: 'stripe', 'paypal', 'square'
    - `WebhookEvent` and `WebhookVerificationResult` types for webhook handling
    - Currency types and payment details interfaces
  
  - **PaymentProcessor Interface** (`src/services/payment/PaymentProcessor.ts`): Abstract contract for all payment providers
    - Defines methods: `createPaymentIntent()`, `confirmPayment()`, `retrievePayment()`, `handleWebhook()`
    - Documents expected behavior and parameters with JSDoc comments
    - Ensures consistent API across all payment providers
  
  - **PaymentProcessorFactory** (`src/services/payment/PaymentProcessorFactory.ts`): Factory pattern implementation
    - Creates payment processor instances based on `PAYMENT_PROVIDER` environment variable
    - Supports provider switching via configuration (default: 'stripe')
    - Validates provider configuration before initialization
    - Provides helper methods: `getCurrentProvider()`, `isProviderAvailable()`
    - Throws descriptive errors for missing or unsupported providers

- **Stripe Payment Processor Implementation**: Complete Stripe integration
  - **StripeProcessor** (`src/services/payment/StripeProcessor.ts`): Stripe-specific implementation
    - Initializes Stripe client with `STRIPE_SECRET_KEY` using API version `2024-12-18.acacia`
    - Implements `createPaymentIntent()`: Creates Stripe payment intent, converts amounts to smallest currency unit (fils for AED)
    - Implements `confirmPayment()`: Confirms payment with payment method, handles 3D Secure flows
    - Implements `retrievePayment()`: Gets payment details from Stripe API, extracts paid timestamps
    - Implements `handleWebhook()`: Verifies webhook signatures using `STRIPE_WEBHOOK_SECRET`, parses events
    - Error handling: Maps Stripe errors to user-friendly messages (card_declined, insufficient_funds, etc.)
    - Status mapping: Converts Stripe payment intent statuses to standardized `PaymentStatus` enum
    - Comprehensive logging with emoji prefixes following project conventions

- **Payment Service**: Main business logic orchestrator
  - **paymentService** (`src/services/paymentService.ts`): High-level payment operations
    - `calculateTotalAmount()`: Calculates total from session data (subtotal + surcharge), server-side validation
    - `createPaymentIntent()`: Creates payment intent, updates order with payment tracking fields
    - `confirmPayment()`: Confirms payment after card entry, updates order status
    - `retrievePaymentStatus()`: Gets current payment status from provider, syncs with database
    - `processWebhook()`: Processes webhook events, updates order status (COMPLETED, failed, canceled)
    - Currency conversion: Handles AED to fils conversion (multiply by 100)
    - Database integration: Updates `kloiOrdersTable` with payment provider, payment intent ID, payment status, paid timestamp
    - Error handling: Comprehensive error handling with detailed logging

- **Payment Validation Schemas**: Zod schemas for API validation
  - **payment.schemas.ts** (`src/schemas/payment.schemas.ts`): Payment API validation
    - `createPaymentIntentSchema`: Validates orderId (UUID), optional amount/currency
    - `confirmPaymentSchema`: Validates orderId, paymentMethodId, optional returnUrl
    - `paymentStatusSchema`: Validates orderId for status queries
    - `orderIdParamSchema`: Validates orderId URL parameters
    - All schemas include descriptive error messages

- **Checkout Page Route**: Complete checkout flow implementation
  - **checkout.ts** (`src/routes/checkout.ts`): Checkout page route handler
    - `GET /checkout`: Renders checkout page with order summary and payment form
    - Validates session has required data (locationData, eventDetails, eventSetup)
    - Calculates final total server-side (subtotal + surcharge)
    - Retrieves or finds existing order by sessionId
    - Creates payment intent via payment service
    - Renders checkout template with Stripe publishable key and client secret
    - Handles payment intent reuse and error scenarios
    - Registered in `src/routes/index.ts` as protected wizard route

- **Checkout Page Template**: Frontend payment integration
  - **checkout.hbs** (`src/views/wizard/checkout.hbs`): Checkout page template
    - Order summary display: Location, customer info, event details, dates, price breakdown
    - Stripe Elements integration: PCI-compliant card input using Stripe.js
    - Payment form: Card element, optional cardholder name field, payment button
    - Client-side JavaScript:
      - Initializes Stripe with publishable key from server
      - Creates and mounts Stripe Elements card component
      - Handles real-time validation errors
      - Confirms payment with `stripe.confirmCardPayment()`
      - Shows loading states, success/error messages
      - Redirects to confirmation page on success
    - Responsive design: Grid layout for order summary and payment form
    - Error handling: User-friendly error messages for payment failures

- **Payment API Endpoints**: REST API for payment operations
  - **payment.ts** (`src/routes/api/payment.ts`): Payment API endpoints
    - `POST /api/payment/create-intent`: Creates payment intent (if not created on page load)
      - Validates orderId and session ownership
      - Creates payment intent via payment service
      - Returns client secret and payment intent ID
    - `POST /api/payment/confirm`: Confirms payment after card entry
      - Validates orderId, paymentMethodId
      - Confirms payment via payment service
      - Returns payment status and any required actions (3D Secure)
    - `GET /api/payment/status/:orderId`: Gets payment status for an order
      - Validates orderId parameter
      - Retrieves latest payment status from provider
      - Returns payment status, order status, paid timestamp
    - All endpoints include session validation and error handling
    - Registered in `src/routes/api/index.ts`

- **Stripe Webhook Handler**: Async payment status updates
  - **stripe.ts** (`src/routes/webhooks/stripe.ts`): Stripe webhook handler
    - `POST /webhooks/stripe`: Receives and processes Stripe webhook events
    - Signature verification: Verifies webhook signatures using `STRIPE_WEBHOOK_SECRET`
    - Idempotency: In-memory event ID tracking to prevent duplicate processing
    - Event handling:
      - `payment_intent.succeeded`: Updates order status to `COMPLETED`, sets `paidAt`, updates `paymentStatus` to 'succeeded'
      - `payment_intent.payment_failed`: Updates `paymentStatus` to 'failed', logs error
      - `payment_intent.canceled`: Updates `paymentStatus` to 'canceled'
    - Raw body handling: Configures content type parser to preserve raw body for signature verification
    - Error handling: Returns 200 to Stripe even on processing errors (prevents retries), logs errors for investigation
    - Registered in `src/app.ts` before session validation (webhooks bypass session)

- **Event Summary Page Update**: Navigation to checkout
  - **event-summary.hbs** (`src/views/wizard/event-summary.hbs`): Updated navigation
    - Changed "CONFIRM" button to "PROCEED TO CHECKOUT"
    - Links to `/checkout` route
    - Updated button handler to navigate to checkout page

#### Direction Changes

- **Swappable Payment Provider Architecture**: Strategy pattern implementation
  - **Business Benefit**: Easy switching between payment providers via environment variable
  - **Technical Benefit**: Isolated provider-specific code, no changes to business logic when switching
  - **Future-Proof**: Adding new providers (PayPal, Square) requires only implementing `PaymentProcessor` interface
  - **Maintainability**: Provider-specific code is isolated, easier to test and maintain

- **PCI Compliance**: Stripe Elements integration
  - **Security Benefit**: Card data never touches server (PCI compliant)
  - **User Experience**: Seamless payment form with real-time validation
  - **Compliance**: Meets PCI DSS requirements without additional certification

- **Server-Side Amount Validation**: Security best practice
  - **Security Benefit**: Amounts always calculated server-side, never trust client-provided amounts
  - **Reliability**: Prevents payment manipulation attacks
  - **Consistency**: Single source of truth for amount calculation

- **Webhook-Based Status Updates**: Async payment confirmation
  - **Reliability Benefit**: Webhooks ensure payment status is always up-to-date
  - **User Experience**: Payments confirmed even if user closes browser before confirmation
  - **Idempotency**: Prevents duplicate processing of webhook events

#### Files Affected

- `src/services/payment/types.ts` (CREATED) - TypeScript interfaces and types for payment operations
- `src/services/payment/PaymentProcessor.ts` (CREATED) - Abstract interface/contract for payment processors
- `src/services/payment/PaymentProcessorFactory.ts` (CREATED) - Factory pattern for creating payment processors
- `src/services/payment/StripeProcessor.ts` (CREATED) - Stripe implementation of PaymentProcessor interface
- `src/services/paymentService.ts` (CREATED) - Main payment service with business logic and database updates
- `src/schemas/payment.schemas.ts` (CREATED) - Zod validation schemas for payment API endpoints
- `src/routes/checkout.ts` (CREATED) - Checkout page route handler
- `src/routes/index.ts` (MODIFIED) - Registered checkout routes as protected wizard route
- `src/routes/api/payment.ts` (CREATED) - Payment API endpoints (create-intent, confirm, status)
- `src/routes/api/index.ts` (MODIFIED) - Registered payment API routes
- `src/routes/webhooks/stripe.ts` (CREATED) - Stripe webhook handler with signature verification
- `src/app.ts` (MODIFIED) - Registered webhook routes before session validation
- `src/views/wizard/checkout.hbs` (CREATED) - Checkout page template with Stripe Elements integration
- `src/views/wizard/event-summary.hbs` (MODIFIED) - Updated "CONFIRM" button to "PROCEED TO CHECKOUT" linking to checkout page

#### Technical Notes

⚠️⚠️⚠️ **Critical Implementation Details**:

- **Environment Variables Required**:
  - `PAYMENT_PROVIDER`: Payment provider identifier (default: 'stripe')
  - `STRIPE_SECRET_KEY`: Stripe secret key (starts with `sk_test_` for test, `sk_live_` for production)
  - `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (starts with `pk_test_` for test, `pk_live_` for production)
  - `STRIPE_WEBHOOK_SECRET`: Webhook signing secret from Stripe Dashboard (starts with `whsec_`)
  - `DEFAULT_CURRENCY`: Default currency code (default: 'AED')

- **Currency Handling**:
  - **AED (UAE Dirham)**: Smallest unit is "fils" (1 AED = 100 fils)
  - **USD**: Smallest unit is "cents" (1 USD = 100 cents)
  - All amounts converted to smallest unit when creating payment intents
  - Display amounts in major units (AED, USD) to users

- **Order Status Flow**:
  1. **PENDING**: Order created, payment not initiated
  2. **PENDING**: Payment intent created, awaiting payment
  3. **COMPLETED**: Payment succeeded (via webhook), order confirmed

- **Payment Intent Lifecycle**:
  - Payment intent created on checkout page load
  - Client secret passed to frontend for Stripe Elements
  - Payment confirmed via `stripe.confirmCardPayment()`
  - Webhook updates order status asynchronously
  - Idempotency prevents duplicate webhook processing

- **Security Measures**:
  - **Never Store Card Details**: Card data never touches server (PCI compliant via Stripe Elements)
  - **Webhook Signature Verification**: All webhooks verified using `STRIPE_WEBHOOK_SECRET`
  - **Server-Side Validation**: All payment amounts calculated server-side, never trust client
  - **Session Validation**: Payment API endpoints validate session ownership
  - **HTTPS Required**: All payment operations must use HTTPS in production

- **Error Handling**:
  - **User-Facing**: Friendly, actionable error messages
  - **Server Logs**: Detailed error information with emoji prefixes
  - **Stripe Errors**: Mapped to user-friendly messages (card_declined → "Your card was declined")
  - **Webhook Errors**: Logged but return 200 to prevent Stripe retries

- **Database Schema**:
  - Payment tracking fields already added to `kloiOrdersTable`:
    - `paymentProvider`: Provider identifier ('stripe', 'paypal', etc.)
    - `paymentIntentId`: Provider's payment intent/charge ID
    - `paymentStatus`: Status ('pending', 'succeeded', 'failed', 'refunded')
    - `paymentMethodId`: Saved payment method ID (optional, for future use)
    - `paidAt`: Timestamp when payment was completed

- **Webhook Raw Body Handling**:
  - Fastify content type parser configured to preserve raw body for signature verification
  - Raw body stored in `request.rawBody` for Stripe signature verification
  - Required for webhook security (Stripe requires raw body, not parsed JSON)

- **Future Enhancements**:
  - Save payment methods for returning customers
  - Support multiple payment methods (cards, bank transfer, etc.)
  - Implement refund functionality
  - Add payment analytics and reporting
  - Support subscription/recurring payments (if needed)
  - Add PayPal and Square processor implementations

---

### November 15, 2025 - Event-Driven Architecture Refactoring for Location Finder Map

**Type**: 🟠 MAJOR CHANGE / 🟢 DIRECTION CHANGE

**Summary**: Completely refactored the location finder map system from a monolithic, timing-dependent architecture to a modular, event-driven architecture. This refactoring eliminates race conditions, timing dependencies, and state synchronization issues that were causing validation failures and incorrect initial pin positioning. The new architecture uses a pub/sub event system for decoupled component communication, centralized state management, and separation of concerns. Key improvements include using polygon center for initial marker positioning (guaranteed to be within boundary), eliminating all setTimeout/retry patterns, and ensuring validation state is consistently available to all UI components.

#### Major Changes

- **Event-Driven Architecture Implementation**: New modular system
  - **EventBus Module** (`public/global/js/map-events.js`): Pub/sub pattern for decoupled component communication
    - Singleton instance `window.MapEventBus` for global event coordination
    - Supports `on()`, `off()`, `emit()`, `removeAllListeners()` methods
    - Event logging for debugging and monitoring
    - Error handling in event handlers to prevent cascading failures
  
  - **StateManager Module** (`public/global/js/map-state.js`): Single source of truth for all map state
    - Centralized state management with `getState()`, `set()`, `setState()` methods
    - Convenience methods: `setCoordinates()`, `setFormData()`, `setSelectedArea()`
    - Emits `state:changed` events on all state updates
    - Emits `coordinates:changed` events for coordinate updates
    - Immutable state access (returns copies to prevent direct mutation)
    - State reset functionality for cleanup
  
  - **PolygonManager Module** (`public/global/js/map-polygon.js`): Polygon operations and geometry
    - Normalizes polygon paths from various formats (arrays, objects, coordinate orders)
    - Calculates polygon center using bounding box (guaranteed to be within polygon)
    - Draws polygon on Google Maps with configurable styling
    - Point-in-polygon containment checks using Google Maps geometry library
    - Polygon styling for violation states (red) and normal states (blue)
    - Bounds fitting to polygon for optimal map view
    - Emits `polygon:ready` and `polygon:center:calculated` events
  
  - **ValidationService Module** (`public/global/js/map-validation.js`): Centralized validation logic
    - Single source of truth for all validation logic (DRY principle)
    - Polygon containment check as primary security check
    - Reverse geocoding as secondary verification
    - Fail-closed validation strategy (reject on error if polygon check didn't pass)
    - Prevents concurrent validations with `isValidationInProgress` flag
    - Emits `validation:start` and `validation:complete` events
    - Handles all edge cases: polygon not ready, API failures, null results
  
  - **UIManager Module** (`public/global/js/map-ui.js`): UI updates based on events
    - Listens to state changes and validation events
    - Updates form fields (display and hidden) from state
    - Updates confirm button state and label based on validation result
    - Shows/hides boundary violation popup
    - Updates polygon styling via events
    - Setup popup button handlers (reselect, dismiss)
    - No business logic - purely reactive UI updates

- **Refactored Main Controller** (`public/global/js/maps.js`):
  - **Removed Timing Dependencies**: Eliminated all `setTimeout()` retry patterns and polling mechanisms
  - **Event-Driven Initialization**: Components initialize and coordinate via events instead of timing
  - **Polygon Center for Initial Position**: Marker now starts at polygon center (calculated from bounding box) instead of geocoding address
    - **Critical Fix**: Ensures marker is always within polygon boundary on page load
    - Eliminates validation failures on initial load
    - Polygon center is calculated before map initialization
  - **Event Listeners Setup**: Coordinates all modules via event subscriptions
    - `polygon:ready` → Updates state, triggers validation
    - `polygon:center:calculated` → Sets marker position, fits bounds, reverse geocodes, validates
    - `coordinates:changed` → Triggers validation if area selected
    - `validation:complete` → Updates state, updates polygon styling
    - `boundary:violation` → Updates polygon styling
  - **Simplified Flow**: Map initialization → Polygon normalization → Center calculation → Marker positioning → Validation
  - **Removed Old Code**: Eliminated all old validation/polygon functions, timing retries, and state synchronization logic
  - **Preserved Functionality**: All original features maintained (detect location, drag marker, click map, form submission)

- **Template Updates** (`src/views/wizard/location-finder.hbs`):
  - Added script tags for all new modules in correct dependency order
  - Module loading order: `map-events.js` → `map-state.js` → `map-polygon.js` → `map-validation.js` → `map-ui.js` → `maps.js`
  - Ensures all dependencies are available before initialization

#### Direction Changes

- **Event-Driven Architecture**: Shift from imperative, timing-dependent code to declarative, event-driven coordination
  - **Business Benefit**: Eliminates race conditions and timing bugs that caused validation failures
  - **Technical Benefit**: Decoupled components are easier to test, maintain, and extend
  - **Reliability Benefit**: Events ensure proper execution order without fragile timing mechanisms
  
- **Separation of Concerns**: Each module has a single, well-defined responsibility
  - **EventBus**: Communication only
  - **StateManager**: State management only
  - **PolygonManager**: Polygon operations only
  - **ValidationService**: Validation logic only
  - **UIManager**: UI updates only
  - **maps.js**: Orchestration only
  - **Benefit**: Changes to one module don't affect others, easier debugging and testing
  
- **Centralized State Management**: Single source of truth for all map state
  - **Benefit**: Eliminates state synchronization issues between components
  - **Benefit**: All UI components (confirm button, popup, form fields) use same state
  - **Benefit**: State changes are observable via events
  
- **Polygon Center Positioning**: Initial marker position uses polygon center instead of geocoding
  - **Critical Fix**: Guarantees marker is within polygon boundary on page load
  - **Benefit**: Eliminates validation failures on initial load
  - **Benefit**: More reliable than geocoding which may return coordinates outside polygon
  - **Benefit**: Faster initialization (no geocoding API call needed)

#### Files Affected

- `public/global/js/map-events.js` (CREATED) - EventBus module for pub/sub communication
- `public/global/js/map-state.js` (CREATED) - StateManager module for centralized state management
- `public/global/js/map-polygon.js` (CREATED) - PolygonManager module for polygon operations
- `public/global/js/map-validation.js` (CREATED) - ValidationService module for centralized validation logic
- `public/global/js/map-ui.js` (CREATED/MODIFIED) - UIManager module for reactive UI updates; added minimum display time fix for boundary violation popup to prevent flashing
- `public/global/js/maps.js` (REFACTORED) - Main controller refactored to use event-driven architecture, removed timing dependencies, uses polygon center for initial positioning
- `src/views/wizard/location-finder.hbs` (MODIFIED) - Added script tags for all new modules in dependency order; fixed script paths to use `/public/global/js/` prefix
- `src/routes/api/index.ts` (MODIFIED) - Server-side validation aligned with client-side logic; polygon check is now authoritative, allows location if polygon check passed even when reverse geocoding fails

#### Technical Notes

⚠️⚠️⚠️ **Critical Architecture Implementation Details**:

- **Event Flow for Initialization**:
  1. `maps.js` initializes all modules (EventBus, StateManager, PolygonManager, ValidationService, UIManager)
  2. Polygon paths normalized from session data
  3. Polygon center calculated (bounding box center)
  4. `polygon:center:calculated` event emitted
  5. Event listener sets marker to center, fits bounds, reverse geocodes, validates
  6. Polygon drawn on map
  7. `polygon:ready` event emitted
  8. State updated, validation triggered if needed

- **Event Flow for User Interactions**:
  1. User clicks map or drags marker
  2. Coordinates extracted
  3. `coordinates:changed` event emitted
  4. Event listener triggers validation if area selected
  5. `validation:start` event emitted
  6. ValidationService validates (polygon check + reverse geocoding)
  7. `validation:complete` event emitted with result
  8. StateManager updates `isValid` state
  9. `state:changed` event emitted
  10. UIManager updates confirm button, popup, polygon styling

- **Polygon Center Calculation**:
  - Uses bounding box center: `(minLat + maxLat) / 2, (minLng + maxLng) / 2`
  - Guaranteed to be within polygon for convex polygons
  - For complex polygons, center is typically within boundary
  - More reliable than geocoding which may return coordinates outside polygon

- **State Synchronization**:
  - All state changes go through StateManager
  - StateManager emits events on changes
  - UI components listen to events and update reactively
  - No direct state mutations outside StateManager
  - Eliminates race conditions and stale state issues

- **Validation Coordination**:
  - ValidationService is the only module that performs validation
  - All validation logic centralized (DRY principle)
  - Validation results emitted as events
  - UI components react to validation events
  - No duplicate validation logic

- **Popup Display Fix** (`public/global/js/map-ui.js`):
  - **Minimum Display Time**: Added 2-second minimum display time for boundary violation popup to prevent flashing
  - **Problem**: When marker was auto-recentered after moving outside boundary, popup would flash and disappear immediately
  - **Solution**: Popup now tracks when it was shown (`popupShownAt`) and enforces minimum display time before allowing hide
  - **Implementation**:
    - `popupShownAt` timestamp recorded when popup is shown
    - `minPopupDisplayTime` set to 2000ms (2 seconds)
    - `handleValidationComplete()` checks if minimum time has passed before hiding
    - If popup was shown recently, hide is scheduled after remaining minimum time
    - User can still dismiss immediately via "OK" button (resets timestamp)
  - **Benefit**: Popup remains visible long enough to be read, even when marker is quickly auto-recentered
  - **Technical Details**:
    - Auto-hide timer properly cleared when popup is shown/hidden
    - Validation state checked before hiding to ensure popup only hides when location is actually valid
    - Prevents race conditions where popup hides before user can see it

- **Server-Side Validation Alignment** (`src/routes/api/index.ts`):
  - **Critical Fix**: Server-side validation now matches client-side logic - polygon check is authoritative
  - **Problem**: Server was rejecting valid locations within polygon boundaries when reverse geocoding failed (e.g., `REQUEST_DENIED` from Google API)
  - **Solution**: Server now tracks `polygonCheckPassed` flag and allows location if polygon check passed, even if reverse geocoding fails
  - **Implementation**:
    - Added `polygonCheckPassed` flag to track polygon containment check result
    - Flag set to `true` when polygon check passes (coordinates inside polygon)
    - When reverse geocoding fails (`REQUEST_DENIED`, `ZERO_RESULTS`, etc.):
      - If `polygonCheckPassed === true` → Allow location (polygon is authoritative)
      - If `polygonCheckPassed === false` → Fail closed (security)
    - When reverse geocoding returns null district/sublocality:
      - If `polygonCheckPassed === true` → Allow location (polygon is authoritative)
      - If `polygonCheckPassed === false` → Fail closed (security)
    - When validation error occurs:
      - If `polygonCheckPassed === true` → Allow location (polygon is authoritative)
      - If `polygonCheckPassed === false` → Fail closed (security)
  - **Benefit**: Consistent validation behavior between client and server
  - **Benefit**: Valid locations within polygon boundaries are no longer rejected due to reverse geocoding API failures
  - **Benefit**: Maintains security by failing closed only when polygon check didn't run
  - **Technical Details**:
    - Polygon check runs first (from database, authoritative source)
    - Reverse geocoding is secondary verification only
    - Fail-closed strategy only applies when polygon check didn't run
    - Aligns with client-side `ValidationService` logic for consistency

---

### November 13, 2025 - Security Hardening & Robustness Improvements for Boundary Validation System

**Type**: 🔴 BREAKING CHANGE / 🟠 MAJOR CHANGE

**Summary**: Implemented comprehensive security hardening and robustness improvements to the sublocality boundary validation system. Fixed critical vulnerabilities that could allow users to bypass boundary restrictions, added server-side polygon containment validation as the primary security check, implemented rate limiting, and removed insecure fallback mechanisms. These changes enforce fail-closed validation, prevent race conditions, and ensure polygon coordinates from the database are always the source of truth. Additionally, centralized coordinate order configuration via `MAP_POLYGON` environment variable allows switching between coordinate formats without code changes.

#### Major Changes
- **Client-Side Security Hardening**: `public/global/js/maps.js`
  - **Fail-Closed Validation**: Changed `validateFCoordinatesAgainstArea()` to reject moves when validation cannot be confirmed (API errors, network failures, null results) instead of allowing them
  - **Request Queuing**: Implemented validation request queue to prevent race conditions from rapid drags/clicks that could bypass validation
  - **Debounced Drag Events**: Added 400ms debounce to `handleMarkerDragEnd()` to prevent excessive API calls and reduce race condition vulnerabilities
  - **Strict Position Updates**: Marker position and `lastValidPosition` now only update when reverse geocoding confirms a match (district/sublocality present), preventing invalid positions from persisting
  - **Removed Circle Fallback**: Completely removed imprecise circle boundary fallback (1000m default) - polygon is now required for validation
  - **Removed Auto-Detection**: Coordinate order auto-detection removed - must be explicitly specified as `'lng-lat'` or `'lat-lng'` to prevent misclassification vulnerabilities
  - **Enhanced Validation Logic**: Validation now requires confirmed district/sublocality match before allowing marker position updates

- **Server-Side Security Enhancements**: `src/routes/api/index.ts`
  - **Polygon Containment as Primary Check**: Implemented `isPointInPolygon()` using ray casting algorithm - polygon from database is now the source of truth and checked first
  - **Database Validation**: Server validates that expected district/sublocality exists in database before processing validation requests
  - **Dual-Layer Validation**: Polygon containment check runs first, reverse geocoding serves as secondary verification
  - **Rate Limiting**: Added rate limiting to `/api/geo/reverse` endpoint (30 requests per minute per session) to prevent abuse and API quota exhaustion
  - **Fail-Closed Approach**: If polygon check passes but reverse geocoding fails, location is still allowed (polygon is authoritative); if polygon check fails, location is rejected regardless of reverse geocoding result

- **Service Layer Security Updates**: `src/services/areaPolygonService.ts` & `src/services/deliveryLocationsService.ts`
  - **Removed Auto-Detection**: Removed coordinate order auto-detection logic - must be explicitly configured
  - **Consistent Configuration**: Both services now require explicit `POLYGON_COORDINATE_ORDER` setting (`'lng-lat'` or `'lat-lng'`)
  - **Error Handling**: Invalid coordinate order configuration now logs errors and skips invalid points instead of attempting auto-detection

- **Centralized Coordinate Order Configuration**: Multiple files
  - **Environment Variable Configuration**: All coordinate order settings now read from `MAP_POLYGON` environment variable
  - **Client-Side**: `public/global/js/maps.js` receives `MAP_POLYGON` value via template from `src/routes/locationFinder.ts`
  - **Server-Side Services**: `src/services/areaPolygonService.ts` and `src/services/deliveryLocationsService.ts` read directly from `process.env.MAP_POLYGON`
  - **Import Script**: `src/scripts/importGeoJsonPolygon.ts` uses `MAP_POLYGON` for consistency when importing new polygons
  - **Route Handler**: `src/routes/locationFinder.ts` validates and passes `MAP_POLYGON` to client via template
  - **Template**: `src/views/wizard/location-finder.hbs` passes env variable value to `initLocationFinderMap()`
  - **Benefits**: Single source of truth - change `MAP_POLYGON` env variable and restart server to switch coordinate interpretation without code changes
  - **Validation**: All files validate env variable is `'lng-lat'` or `'lat-lng'`, defaulting to `'lng-lat'` if invalid or missing
  - **Logging**: All files log the configured coordinate order on initialization for debugging and verification

#### Direction Changes
- **Security-First Validation**: Shift from permissive validation (allow on error) to fail-closed validation (reject on error)
  - **Business Benefit**: Prevents surcharge manipulation by ensuring users cannot bypass boundary restrictions
  - **Technical Benefit**: Eliminates race conditions and reduces attack surface for boundary bypass attempts
  - **Security Benefit**: Polygon coordinates from database are authoritative source, preventing manipulation via API failures
- **Polygon-Required Policy**: Removed imprecise circle fallback - polygon data is now mandatory for boundary validation
  - **Business Benefit**: Ensures accurate boundary enforcement matching actual delivery area boundaries
  - **Technical Benefit**: Eliminates false positives/negatives from imprecise circular approximations
- **Explicit Configuration**: Removed auto-detection for coordinate order - requires explicit configuration
  - **Security Benefit**: Prevents misclassification vulnerabilities near coordinate boundaries
  - **Technical Benefit**: Eliminates ambiguity and ensures consistent coordinate interpretation across system
- **Centralized Configuration Management**: Coordinate order now managed via single `MAP_POLYGON` environment variable
  - **Business Benefit**: Switch between coordinate formats (e.g., when changing map platforms) without code deployment
  - **Technical Benefit**: Single source of truth eliminates configuration drift and ensures consistency across all files
  - **Operational Benefit**: No code changes required - update env variable and restart server

#### Files Affected
- `public/global/js/maps.js` (MODIFIED) - Security hardening: fail-closed validation, request queuing, debouncing, strict position updates, removed circle fallback, removed auto-detection, centralized coordinate order from MAP_POLYGON env variable
- `src/routes/api/index.ts` (MODIFIED) - Security enhancements: polygon containment validation, database validation, rate limiting, dual-layer validation
- `src/routes/locationFinder.ts` (MODIFIED) - Centralized configuration: reads MAP_POLYGON env variable, validates, and passes to template
- `src/views/wizard/location-finder.hbs` (MODIFIED) - Centralized configuration: passes MAP_POLYGON value to client-side maps.js initialization
- `src/services/areaPolygonService.ts` (MODIFIED) - Security updates: removed auto-detection, explicit coordinate order requirement, reads from MAP_POLYGON env variable
- `src/services/deliveryLocationsService.ts` (MODIFIED) - Security updates: removed auto-detection, explicit coordinate order requirement, reads from MAP_POLYGON env variable
- `src/scripts/importGeoJsonPolygon.ts` (MODIFIED) - Centralized configuration: uses MAP_POLYGON env variable for consistency with code interpretation

#### Technical Notes
⚠️⚠️⚠️ **Critical Security Implementation Details**:
- **Fail-Closed Validation Strategy**:
  - Client-side: Returns `{ valid: false }` on API errors, network failures, or null results
  - Server-side: Rejects locations if polygon containment check fails, even if reverse geocoding passes
  - Prevents boundary bypass attempts via API manipulation or network issues
- **Polygon Containment Algorithm**:
  - Uses ray casting algorithm for point-in-polygon checks
  - Polygon coordinates from database are always the source of truth
  - Checked before reverse geocoding to ensure authoritative validation
- **Rate Limiting**:
  - 30 requests per minute per session/IP for `/api/geo/reverse` endpoint
  - Prevents abuse and API quota exhaustion
  - Returns HTTP 429 with `retryAfter` header when limit exceeded
- **Request Queuing**:
  - Prevents race conditions from rapid user interactions
  - Queues validation requests when one is already in progress
  - Processes queue sequentially to ensure proper validation order
- **Debouncing**:
  - 400ms debounce on drag-end events
  - Reduces API calls during marker dragging
  - Prevents validation spam and improves performance
- **Coordinate Order Configuration**:
  - **BREAKING CHANGE**: Auto-detection removed - must explicitly set via `MAP_POLYGON` environment variable
  - **Centralized Configuration**: All files now read from single `MAP_POLYGON` env variable (`'lng-lat'` or `'lat-lng'`)
  - Client: `public/global/js/maps.js` - receives value from template (passed from `src/routes/locationFinder.ts`)
  - Server: `src/services/areaPolygonService.ts` - reads from `process.env.MAP_POLYGON`, default: `'lng-lat'`
  - Server: `src/services/deliveryLocationsService.ts` - reads from `process.env.MAP_POLYGON`, default: `'lng-lat'`
  - Import: `src/scripts/importGeoJsonPolygon.ts` - reads from `process.env.MAP_POLYGON`, default: `'lat-lng'` (for new imports)
  - Route: `src/routes/locationFinder.ts` - validates and passes `MAP_POLYGON` to client via template
  - Template: `src/views/wizard/location-finder.hbs` - injects env variable value into client initialization
  - **Validation**: All files validate env variable is `'lng-lat'` or `'lat-lng'`, defaulting to `'lng-lat'` if invalid/missing (except import script which defaults to `'lat-lng'`)
  - **Logging**: All files log configured coordinate order on initialization for verification
  - **No Code Changes Required**: Change `MAP_POLYGON` env variable and restart server to switch coordinate interpretation
- **Circle Fallback Removal**:
  - **BREAKING CHANGE**: Circle fallback completely removed
  - Polygon data is now required in session `components.polygon`
  - If polygon unavailable, boundary validation will fail (fail-closed)
  - Ensures accurate boundary enforcement matching actual delivery areas
- **Position Update Logic**:
  - Marker position only updates after validation confirms district/sublocality match
  - `lastValidPosition` only updates when reverse geocoding returns confirmed district/sublocality
  - Prevents invalid positions from persisting in state
- **Database Validation**:
  - Server validates expected district/sublocality exists in database before processing
  - Prevents validation against non-existent or manipulated session data
  - Ensures polygon data integrity

**Migration Notes**:
- ⚠️⚠️⚠️ **Action Required**: Set `MAP_POLYGON` environment variable to `'lng-lat'` or `'lat-lng'` to match your database coordinate format
  - Example: `MAP_POLYGON="lat-lng"` in your `.env` file or environment configuration
  - All files (client and server) will automatically use this value
  - No code changes needed - just set the env variable and restart the server
- ⚠️⚠️⚠️ **Action Required**: Ensure all delivery areas have polygon data in database - circle fallback no longer available
- ⚠️⚠️⚠️ **Testing Required**: Verify boundary validation works correctly with fail-closed approach - locations will be rejected more strictly than before
- ⚠️⚠️⚠️ **Verification**: Check server logs on startup - all services log the configured `MAP_POLYGON` coordinate order for verification
- ⚠️⚠️⚠️ **Note**: Database coordinate format remains unchanged - `MAP_POLYGON` only controls how code interprets existing database coordinates

**Related Documentation**: This builds upon the boundary validation system implemented in November 10, 2025 and the coordinate order system from November 12, 2025

---

### November 12, 2025 - Polygon Boundary Drawing Fixes & Configurable Coordinate Order System

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed polygon boundary drawing timing issues and implemented a configurable coordinate order system to support different coordinate formats (lng-lat vs lat-lng) without requiring database data recreation. Also fixed critical Fastify route registration bug that was causing runtime errors with geo API endpoints.

#### Major Changes
- **Polygon Boundary Drawing Fixes**: `public/global/js/maps.js`
  - Fixed polygon disappearing after brief appearance on page load
  - Resolved timing conflict where polygon was drawn before geocoding completed, causing it to disappear when map recentered
  - Polygon now draws after geocoding completes and coordinates are available
  - Improved coordinate normalization logic to correctly handle [lng, lat] format for UAE coordinates
  - Added proper Google Maps LatLng object conversion for polygon paths
  - Implemented delayed bounds fitting to avoid conflicts with geocoding recenter operations
  - Enhanced debugging logs throughout polygon drawing process
  - Polygon now persists correctly and remains visible after map initialization

- **Configurable Coordinate Order System**: Multiple files
  - **Client-Side Configuration**: `public/global/js/maps.js`
    - Added `POLYGON_COORDINATE_ORDER` constant with options: `'lng-lat'`, `'lat-lng'`, or `'auto'` (default)
    - Updated `normalizePolygonPaths()` to respect coordinate order configuration
    - Supports forced interpretation or auto-detection based on value ranges
  - **Server-Side Configuration**: `src/services/areaPolygonService.ts` & `src/services/deliveryLocationsService.ts`
    - Added `POLYGON_COORDINATE_ORDER` constant matching client-side options
    - Updated polygon normalization functions to use configured coordinate order
    - Maintains consistency across client and server-side processing
  - **Import Script Configuration**: `src/scripts/importGeoJsonPolygon.ts`
    - Added `DB_STORAGE_COORDINATE_ORDER` constant for controlling database storage format
    - Updated `normalizePolygonPairs()` to normalize coordinates to configured storage format
    - Ensures imported polygons match the expected database format

- **Route Registration Bug Fix**: `src/routes/api/index.ts`
  - Fixed critical Fastify route registration error: "Fastify instance is already listening. Cannot add route!"
  - Resolved nested route registration issue where `/geo/area` route was incorrectly defined inside `/geo/reverse` handler
  - Restructured route handlers to properly separate `/geo/reverse` and `/geo/area` as independent routes
  - Both routes now register correctly at module level during server startup
  - Eliminates runtime errors when accessing `/api/geo/reverse` endpoint

#### Direction Changes
- **Flexible Coordinate Handling**: Shift from hardcoded coordinate interpretation to configurable system
  - **Business Benefit**: Eliminates need to recreate database data when switching between coordinate formats
  - **Technical Benefit**: Single configuration change allows support for different external systems requiring different formats
  - **Future-Proofing**: Easy adaptation to new coordinate format requirements without data migration

#### Files Affected
- `public/global/js/maps.js` (MODIFIED) - Fixed polygon drawing timing, improved coordinate normalization, added coordinate order configuration
- `src/services/areaPolygonService.ts` (MODIFIED) - Added coordinate order configuration and updated normalization logic
- `src/services/deliveryLocationsService.ts` (MODIFIED) - Added coordinate order configuration and updated normalization logic
- `src/scripts/importGeoJsonPolygon.ts` (MODIFIED) - Added database storage coordinate order configuration
- `src/routes/api/index.ts` (MODIFIED) - Fixed route registration bug, restructured `/geo/reverse` and `/geo/area` routes

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- **Coordinate Order Configuration**:
  - `'lng-lat'`: Forces interpretation as [longitude, latitude] (e.g., [54.37, 24.46] for UAE)
  - `'lat-lng'`: Forces interpretation as [latitude, longitude] (e.g., [24.46, 54.37])
  - `'auto'`: Auto-detects based on value ranges (lat: -90 to 90, lng: -180 to 180)
- **Configuration Consistency**: 
  - Client-side variable in `public\global\js\maps.js` named `POLYGON_COORDINATE_ORDER` should match server-side `POLYGON_COORDINATE_ORDER` in services
  - Import script `DB_STORAGE_COORDINATE_ORDER` determines how coordinates are stored in database
  - Current default: `'auto'` for all files (most flexible, handles both formats)
- **Polygon Drawing Flow**:
  1. Map initializes with session data
  2. If coordinates exist immediately → polygon draws after map idle event
  3. If geocoding required → polygon draws after geocoding completes (300ms delay)
  4. Bounds fitting happens after polygon is drawn to ensure visibility
  5. Polygon persists through map center changes
- **Coordinate Normalization**:
  - Handles array format: `[[lng, lat], ...]` or `[[lat, lng], ...]`
  - Handles object format: `[{lat, lng}, ...]` or `[{latitude, longitude}, ...]`
  - Auto-detection uses heuristic: lat is between -90 and 90, lng is between -180 and 180
  - For UAE coordinates (lng ~54, lat ~24), [lng, lat] format is most common
- **No Database Changes Required**: Configuration changes handle coordinate interpretation without modifying existing database data

**Related Documentation**: This builds upon the polygon boundary system implemented in the November 10, 2025 entry

---

### November 10, 2025 - Location Boundary Enforcement & Surcharge Protection System

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented comprehensive geofence validation system to prevent users from selecting locations outside their chosen delivery area, protecting surcharge integrity. Added client-side and server-side validation with automatic marker recentering and user-friendly boundary violation popup.

**Reminder**: The reason why the sublocality selection via `/delivery-location` route must come first prrior to showing the google map on `/location` is that to allow sublocalities to be removed or added subject to service availibility and market requirements. This allows us to inform the user where we provide service so they are not forced to complete the wizard unnecessarily.

#### Major Changes
- **Server-Side Location Validation**: `src/routes/api/index.ts`
  - Created `validateLocationCoordinates()` helper function that reverse geocodes coordinates and validates against selected district/sublocality
  - Integrated validation into `/api/session/location` endpoint - validates coordinates before saving to session
  - Returns 400 error with detailed validation information if coordinates don't match selected area
  - Validation only runs for non-autosave requests to prevent blocking user progress
  - Uses Google Maps Geocoding API to extract district and sublocality from coordinates
- **Client-Side Geofence System**: `public/global/js/maps.js`
  - Stores last valid marker position from initial geocoding of selected area and maintains a canonical `initialSelectedCenter`
  - Initializes selected district/sublocality from session data for boundary validation
  - Validates coordinates on marker drag, map click, and "Detect My Location" button
  - Automatically recenters marker to the selected area's center (fallback to last valid position) when user moves outside boundary
  - Calls `/api/geo/reverse` endpoint to validate coordinates against selected area
  - Handles API failures gracefully - allows action but relies on server-side validation
  - Added `logWarn` function for consistent logging (was missing and causing errors)
- **Visual Boundary Indicator**: `public/global/js/maps.js`
  - Draws delivery area polygons when available, falling back to a semi-transparent circle centered on the selected area
  - Polygon data loads from session (persisted during `/delivery-location` selection) with `/api/geo/area` fallback if missing
  - Circle fallback radius is configurable via `initialLocationData.components.boundaryRadiusMeters` (default: 1000m)
  - Boundary styling toggles to red during violations and reverts to normal after recovery
- **Polygon Boundary Service**: `src/services/areaPolygonService.ts`, `public/global/js/delivery-location.js`
  - Reads polygon coordinates from `deliveryLocations.sublocalities[].polygon` in the database (supports [lng, lat] and [lat, lng] storage)
  - Persists normalized `{ lat, lng }` polygons into session components to avoid redundant API requests on map load
  - Keeps `/api/geo/area` endpoint as a fallback, including logging for missing polygons
- **Polygon Import Utility**: `src/scripts/importGeoJsonPolygon.ts`
  - CLI helper (`npm run polygon:import -- --district="..." --sublocality="..." --file=path`) to normalize GeoJSON polygons and update the `deliveryLocations` table
- **Boundary Violation Popup**: `src/views/wizard/location-finder.hbs` & `public/global/css/kloi_global.css`
  - Created popup UI component that appears when user moves marker outside selected area
  - Displays selected area name (sublocality, district) in popup message
  - "Change My Area" button redirects to `/delivery-location` for area reselection
  - Clicking the "OK" button recenters the pin to the user’s selected area center (canonical initial center; falls back to last valid position) and then dismisses the popup
  - Auto-dismisses after 10 seconds if user doesn't interact
  - Styled with animations and consistent with application design system
  - Popup appears on both client-side validation failures (drag/click) and server-side validation failures (form submit)
- **Form Submission Error Handling**: `public/global/js/maps.js`
  - Enhanced form submission handler to detect boundary validation errors from server
  - Automatically recenters marker to the selected area center and shows popup when server validation fails
  - Provides clear user feedback when location is outside selected delivery area

#### Direction Changes
- **Area Selection Requirement**: Users MUST select their delivery area via `/delivery-location` route before accessing the map page
  - **Business Reason**: Sublocalities can be added or removed from the system based on market demand, operational capacity, and business strategy
  - **Technical Reason**: The selected area determines the surcharge amount, and this must be locked in before map interaction to prevent surcharge manipulation
  - Map page (`/location`) now enforces this workflow - redirects to `/delivery-location` if no area is selected
- **Surcharge Protection**: Prevents users from selecting a lower surcharge area and then moving the marker to a higher surcharge area to avoid paying the correct delivery fee
- **User Experience**: Provides clear guidance when users attempt to move outside their selected area, with option to change their area selection if needed

#### Files Affected
- `src/routes/api/index.ts` (MODIFIED) - Added `validateLocationCoordinates()` function and integrated validation into location step handler
- `public/global/js/maps.js` (MODIFIED) - Added geofence validation, canonical selected area center, polygon/circle boundary rendering, guarded last-valid updates, popup display logic, and form submission error handling
- `public/global/js/delivery-location.js` (MODIFIED) - Persists selected sublocality polygon metadata to session components
- `src/services/areaPolygonService.ts` (NEW/MODIFIED) - Supplies polygons from `deliveryLocations` JSONB with DB fallback and format normalization
- `src/views/wizard/location-finder.hbs` (MODIFIED) - Added boundary violation popup HTML structure
- `public/global/css/kloi_global.css` (MODIFIED) - Added popup styling with animations and responsive design
- `src/services/deliveryLocationsService.ts` (MODIFIED) - Normalizes polygon coordinates when building city/sublocality payloads
- `src/schemas/wizard.schemas.ts` (MODIFIED) - Allows structured component metadata (e.g., polygons) in location session schema
- `src/scripts/importGeoJsonPolygon.ts` (NEW) - Imports GeoJSON polygons into `deliveryLocations` JSONB entries

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- **Validation Flow**:
  1. User selects area on `/delivery-location` → session stores district, sublocality, and surcharge
  2. User navigates to `/location` → map initializes with selected area, stores canonical `initialSelectedCenter`, and sets last valid position to this center
  3. User drags/clicks marker → client validates via `/api/geo/reverse` endpoint
  4. If outside boundary → marker recenters, popup appears
  5. User submits form → server validates coordinates again before saving
  6. If server validation fails → popup appears, marker recenters, error message displayed
- **Validation Strategy**: Dual-layer validation (client + server) ensures surcharge integrity
  - Client-side validation provides immediate feedback and prevents invalid marker positions
  - Server-side validation is the final authority and prevents API manipulation
- **Error Handling**: 
  - If reverse geocoding API fails (e.g., `REQUEST_DENIED`), client allows action but server will validate
  - If reverse geocoding returns null district/sublocality, client allows but server validates
  - Server validation failures trigger popup and marker recentering to the selected area center for better UX
- **Last Valid Position**: Stored when map initializes and only updated when a move is confirmed inside the selected area (district or sublocality match); guarded against updates when reverse geocoding cannot confirm area
- **Recenter Utilities**: Introduced `recenterToSelectedArea()` (prefers canonical center; falls back to last valid) and retained `recenterToLastValidPosition()` for internal uses
- **Visual Boundary**: Uses persisted polygon coordinates when available (with circle fallback); boundary styling switches to red during violations and resets after recenter/dismiss
- **Polygon Persistence**: `/delivery-location` injects `{ lat, lng }` polygon paths into session, avoiding additional area fetches on `/location`
- **Area Polygon Endpoint**: `/api/geo/area` reads polygons from `deliveryLocations` JSONB with tolerant matching (district+sublocality or sublocality-only) and coordinate normalization
- **Popup Display**: Shows selected area name dynamically from session data (sublocality, district)
- **Area Selection Requirement**: 
  - Users cannot access `/location` without first selecting an area on `/delivery-location`
  - This ensures surcharge is always tied to a valid delivery area from the database
  - Sublocalities are managed in the database and can be updated based on market conditions
- **Surcharge Integrity**: The surcharge amount is determined by the area selection on `/delivery-location` and cannot be changed by moving the marker on the map

**Related Documentation**: This builds upon the location finder integration (Nov 8, 2025 entry) and delivery location selector (Nov 7, 2025 entry)

---

### November 8, 2025 - Location Finder Integration with Delivery Locations & Enhanced Database Location Storage

**Type**: 🟠 MAJOR CHANGE

**Summary**: Integrated the location finder page with the delivery locations workflow, removed Google autocomplete functionality, and enhanced database location storage to include all delivery location metadata (country, city, sublocality, surcharge) collected from the delivery-locations page.

#### Major Changes
- **Location Finder Route Integration**: `src/routes/locationFinder.ts`
  - Now reads `locationData` from session (set by delivery-locations page)
  - Redirects to `/delivery-location` if no location data exists in session
  - Passes location data to template as JSON for map initialization
  - Removed query parameter dependency (district/sublocality from URL)
- **Google Maps Autocomplete Removal**: `src/views/wizard/location-finder.hbs` & `public/global/js/maps.js`
  - Removed autocomplete input container and clear button from template
  - Removed all autocomplete-related code from maps.js (input handlers, autocomplete instance, places library)
  - Map now centers on user's selected location from delivery-locations page using session data
  - Removed default center fallback - map always uses session location data
  - Added geocoding functionality to convert session address to coordinates if needed
- **Delivery Location Redirect Update**: `public/global/js/delivery-location.js`
  - Changed redirect from `/location?district=...&sublocality=...` to `/location`
  - Session data is now the single source of truth for location information
- **Route Reference Cleanup**: `src/routes/eventSetup.ts` & `src/hooks/sessionHooks.ts`
  - Updated eventSetup redirect from `/location-finder` to `/delivery-location`
  - Removed `/location-finder` from public routes (route is `/location`)
  - Updated session hook documentation to reflect new entry point
- **CSS Cleanup**: `public/global/css/kloi_global.css`
  - Removed unused autocomplete container and input styles
- **Enhanced Database Location Storage**: `src/routes/api/index.ts`
  - Created `buildLocationObject()` helper function to construct complete location object from session data
  - **Critical Component Preservation Logic**: When map page (`/location`) submits location data, the system preserves the `components` object from delivery-location page
    - Map page only sends: `latitude`, `longitude`, `fullAddress` (from geocoding)
    - Delivery-location `components` (country, city, sublocality, district, surcharge, selectionSource) are preserved in session
    - Merge logic: `{ ...mapData, components: existingComponents }` ensures delivery-location metadata is never lost
  - Location JSONB now includes all delivery location fields:
    - `latitude` and `longitude` (from map selection/geocoding)
    - `fullAddress` (from map geocoding, may differ from delivery-location address)
    - `country` (from delivery-locations selection via `components.country`)
    - `city` (from delivery-locations selection via `components.city`)
    - `sublocality` (from delivery-locations selection via `components.sublocality`)
    - `district` (from delivery-locations selection via `components.district`)
    - `surcharge` (from delivery-locations selection via `components.surcharge`, converted to number)
    - `selectionSource` (metadata about how location was selected, e.g., "manual-dropdown")
  - Updated all order creation points to use enhanced location object:
    - Event-details step order creation
    - Date-picker step order creation (when creating new order)
    - Event-setup step order creation (when creating new order)

#### Direction Changes
- **Workflow Integration**: Location finder is now a continuation of delivery-locations workflow rather than standalone
- **Session-First Architecture**: Session data is the primary source of location information, eliminating URL parameter dependencies
- **Simplified User Flow**: Removed redundant autocomplete search - users select area from delivery-locations page, then fine-tune on map
- **Complete Location Metadata**: Database now stores comprehensive location information including delivery surcharges for accurate pricing

#### Files Affected
- `src/routes/locationFinder.ts` (MODIFIED)
- `src/views/wizard/location-finder.hbs` (MODIFIED)
- `public/global/js/maps.js` (MODIFIED)
- `public/global/js/delivery-location.js` (MODIFIED)
- `src/routes/eventSetup.ts` (MODIFIED)
- `src/hooks/sessionHooks.ts` (MODIFIED)
- `public/global/css/kloi_global.css` (MODIFIED)
- `src/routes/api/index.ts` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Location finder page now requires valid `locationData` in session - redirects to `/delivery-location` if missing
- Google Maps Places library no longer loaded (autocomplete removed)
- Map initialization uses `initialLocationData` parameter from session
- **Component Preservation Flow**:
  1. Delivery-location page saves: `{ fullAddress, components: { city, country, district, sublocality, surcharge, selectionSource } }`
  2. Map page updates: `{ latitude, longitude, fullAddress }` (components NOT included in request)
  3. Server merge logic preserves existing `components` from session: `{ ...mapData, components: existingComponents }`
  4. Final session contains: map coordinates + delivery-location metadata
- Location object in database includes all delivery location metadata for complete order context
- `buildLocationObject()` function prioritizes `components.*` values over top-level fields (ensures delivery-location data takes precedence over map geocoding)
- Surcharge is converted from string to number for proper database storage
- **Critical**: Delivery-location metadata (country, city, sublocality, district, surcharge, selectionSource) MUST come from `/delivery-location` page, NOT from map geocoding

**Related Documentation**: This builds upon the delivery location selector implementation (Nov 7, 2025 entry)

---

### November 7, 2025 - Delivery Location City/Sublocality Selector

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Rebuilt the delivery location intake experience with city-first selection, searchable sublocality dropdown, and session persistence that now carries surcharge metadata pulled from the new `deliveryLocations` schema.

#### Major Changes
- **Delivery Locations Service Aggregation**: `src/services/deliveryLocationsService.ts`
  - Normalizes JSONB sublocalities into typed structures containing `name`, `district`, and `surcharge`
  - Aggregates rows per city so UI can render merged dropdowns even when districts live in separate DB rows
- **Delivery Location Route Payload**: `src/routes/deliveryLocation.ts`
  - Serializes the aggregated city payload safely for client consumption
  - Supplies JSON data for the city/sub-locality workflow
- **New Single-Page UI**: `src/views/delivery-locations.hbs`
  - Guides user through city selection, searchable/touch-friendly sublocality dropdown, and confirmation CTA
  - Hooks into centralized wizard progress utilities for session saves
- **Client Workflow Enhancements**: `public/global/js/delivery-location.js`
  - Implements city tabbing, autocomplete filter, confirm flow, and geolocation auto-select with surcharge persistence
  - Saves selected sublocality + surcharge into `session.locationData` via `/api/session/location`
- **Dedicated Styling**: `public/global/css/delivery_locations.css`
  - Moved inline CSS into standalone stylesheet following app-wide conventions
- **Session Typings**: `src/types/fastify-session.d.ts`
  - Expanded `locationData` shape to allow surcharge, district, and manual selection metadata

#### Migration Notes
- 🔵 `prisma/migrations/20251106120000_add_delivery_locations_table` must be deployed (or corresponding SQL executed) so new `country` and `city` columns exist alongside `sublocalities`
- Seed/update data using the new structure (see `ADD-DISTRICTS.sql` as reference)

#### Files Affected
- `src/services/deliveryLocationsService.ts`
- `src/routes/deliveryLocation.ts`
- `src/views/delivery-locations.hbs`
- `public/global/js/delivery-location.js`
- `public/global/css/delivery_locations.css`
- `src/types/fastify-session.d.ts`
- `prisma/migrations/20251106120000_add_delivery_locations_table`

---

### November 4, 2025 - Wizard Autosave Mode and Partial Session Merge

**Type**: 🟠 MAJOR CHANGE

**Summary**: Improved reliability of progress saving on back/refresh/navigation by introducing an autosave mode in the client module and lenient, partial-merge handling on the server. This prevents data loss when users use the browser back button or close/refresh mid-edit.

#### Major Changes
- **Client Autosave Mode**: `public/global/js/wizard__progress.js`
  - `saveWizardStep(step, payload, { autosave: true })` now appends `?autosave=1` and sends header `X-KLOI-AutoSave: 1`
  - `enableAutoSaveOnChange()` performs debounced autosaves using autosave mode
  - Unload/back-button flush posts with autosave markers and keepalive fallback
- **Server Partial Merge + Lenient Validation**: `POST /api/session/:step`
  - Detects autosave via query `?autosave=1` OR header `X-KLOI-AutoSave: 1`
  - Skips strict Zod validation for autosave requests
  - Merges partial payloads into existing `session[sessionKey]` instead of replacing
  - Skips DB writes in autosave context (e.g., for `event-details`)

#### Direction Changes
- **Resilience-first Persistence**: Treat navigation/back/unload saves as best-effort and non-blocking while still preserving user progress
- **Consistency**: Uniform autosave semantics across wizard steps via centralized module

#### Files Affected
- `public/global/js/wizard__progress.js` (MODIFIED)
- `src/routes/api/index.ts` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Autosave signals: query `?autosave=1` and header `X-KLOI-AutoSave: 1`
- Autosave merges into existing session state and avoids strict validation/DB writes
- Normal submissions retain strict validation and existing redirect behavior

---

### November 3, 2025 - Reusable Wizard Progress Module

**Type**: 🟠 MAJOR CHANGE

**Summary**: Any button or link that forces a page navigation or refresh must save the users progress to the session cookie, therefore a centralized JavaScript module has been introduced for single interception/save implementation across this wizard, ensuring consistent session persistence before any navigation or page refreshes.

#### Major Changes
- **New Module**: `public/global/js/wizard__progress.js`
  - `saveWizardStep(step, payload)`: Generic POST to `/api/session/:step`
  - `attachSaveBeforeNavigate(selector, step, payloadBuilder)`: Intercepts navigation, saves, then proceeds
  - `collectEventSetupFormData(form)`: Standard collector for event-setup page
- **Back Button/Data Loss Protection**: Added continuous auto-save and unload flush
  - `enableAutoSaveOnChange(form, step, payloadBuilder, options)`: Debounced auto-save on input changes
  - Final save attempt on `beforeunload`/`pagehide`/`visibilitychange` using `navigator.sendBeacon` with fetch keepalive fallback
- **Refactor**: `src/views/wizard/event-setup.hbs` now uses the centralized module
  - Removed duplicate local `collectFormData()` and `saveProgressToSession()`
  - Uses `attachSaveBeforeNavigate('.edit-date-btn', 'event', ...)` for the Edit Date link
  - Form submission collector unified via `collectEventSetupFormData()`

#### Direction Changes
- **Consolidation**: Progress saving logic moved from per-page scripts to a single reusable module
- **Consistency**: Unified logging and behavior across all wizard navigation points

#### Files Affected
- `public/global/js/wizard__progress.js` (NEW)
- `src/views/wizard/event-setup.hbs` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Navigation interception shows a warning but still proceeds if the save fails
- Designed to be extended with additional collectors for other steps (e.g., customer details)
- Emoji-prefixed logs included for observability per project standards
- Auto-save reduces risk of data loss when using browser back/forward or refresh

---

### November 3, 2025 - Wizard Progress Saving on Navigation

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented automatic progress saving when users navigate between wizard steps via links or buttons, ensuring user selections are preserved in session cookies before page navigation.

#### Major Changes
- **Progress Saving on Navigation**: Added automatic session save functionality for all navigation actions in the wizard
  - **Edit Event Date Link**: "Edit Event Date" link on `/event-setup` now saves form selections to session before navigating to `/date-picker`
  - **User Experience**: Users can now safely navigate back and forth between wizard steps without losing their progress
  - **Form Data Collection**: Created reusable `collectFormData()` function to gather radio selections, checkbox selections, and product quantities
  - **Session Save Function**: Implemented `saveProgressToSession()` function that saves current selections via `/api/session/event` endpoint

- **Navigation Handler**: Enhanced "Edit Event Date" link with click handler that:
  - Prevents default navigation
  - Collects current form state
  - Saves progress to session cookie via API
  - Navigates only after successful save
  - Provides user feedback if save fails

#### Direction Changes
- **Navigation Philosophy**: Shift from losing progress on navigation to preserving all user selections automatically
- **Session Management**: Centralized progress saving ensures consistent behavior across all navigation points
- **User Experience**: Improved confidence for users to explore and modify their selections throughout the wizard flow

#### Files Affected
- `src/views/wizard/event-setup.hbs` (MODIFIED) - Added progress saving functionality to "Edit Event Date" link

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Progress is saved automatically before any navigation that would cause data loss
- The `collectFormData()` function gathers:
  - `radioSelections`: All selected radio button choices grouped by name
  - `checkboxSelections`: All checked checkbox options
  - `productQuantities`: All product quantity inputs with values > 0
- Progress saving uses the same `/api/session/event` endpoint as form submission, ensuring consistency
- If save fails, user is warned but navigation still proceeds to prevent blocking user workflow
- This pattern should be applied to all navigation links/buttons throughout the wizard to maintain consistency

**Related Documentation**: This complements the back button fix implemented in the previous entry (Nov 2, 2025 - Back Button UX Fix)

---

### November 2, 2025 - Back Button UX Fix: PENDING Orders Don't Lock Dates

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical UX issue where customers hitting browser back button would see their own selected dates locked as "BOOKED", preventing them from modifying their date selection.

#### Major Changes
- **Booked Dates API Logic Update**: Modified `/api/booked-dates` endpoint to exclude `PENDING` orders from locking dates
  - **Before**: Dates from `PENDING` and `IN_PROGRESS` orders were locked
  - **After**: Only dates from `IN_PROGRESS`, `CANCELLED`, and `COMPLETED` orders lock dates
  - **Business Logic**: Dates remain available until checkout is completed (order status progresses beyond PENDING)

- **Session-Aware Query**: Enhanced booked dates endpoint to accept session context for better debugging and future enhancements
  - Extracts `sessionId` from request for logging and potential future optimizations
  - Added status breakdown logging for better monitoring

#### Direction Changes
- **Booking Availability Logic**: Shift from locking dates immediately upon selection to locking only after order confirmation
- **User Experience**: Improved flexibility for customers to modify selections before checkout completion
- **Order Status Integration**: Aligned date locking behavior with order status lifecycle

#### Files Affected
- `src/routes/api/index.ts` (MODIFIED) - Updated `/api/booked-dates` endpoint filtering logic

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Dates are locked only when order status is beyond `PENDING`:
  - `PENDING`: Does NOT lock dates (customer can still modify)
  - `IN_PROGRESS`: Locks dates (order confirmed/in progress)
  - `CANCELLED`: Locks dates (prevents immediate re-booking)
  - `COMPLETED`: Locks dates (event completed)
- This ensures dates remain selectable until checkout is fully completed
- Back button functionality now works correctly - customers can return to date picker and modify their selections if order is still PENDING

**Related Documentation**: Implementation aligns with `docs/ORDER_STATUS_SYSTEM.md` order status definitions

---

### Date Picker System with Booked Dates Integration

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented comprehensive date picker system with real-time booked dates synchronization, multi-day selection, and intelligent date reservation algorithm.

#### Major Changes
- **Date Picker Component**: Complete calendar-based date selection system (`date__picker.js`)
  - **Multi-Month Display**: Shows 7 months ahead (current month + 6 months) with month navigation pills
  - **6-Month Booking Window**: Limits date selection to 6 months from current date
  - **Multi-Day Selection**: Support for selecting multiple dates for extended events
  - **Time Range Selection**: Start and end time pickers (7:00 AM - 11:00 PM, with midnight option)
  - **Time Validation**: Automatic end time adjustment to ensure end time is after start time
  - **Past Date Prevention**: Disables selection of past dates and booked dates
  - **Visual Feedback**: Clear indication of booked dates, selected dates, and unavailable dates

- **Server Time Synchronization**: 
  - **New API Endpoint**: `GET /api/server-time` - Provides server time for accurate date calculations
  - Prevents client-side timezone issues
  - Graceful fallback to client time with warning message

- **Booked Dates Integration**:
  - **New API Endpoint**: `GET /api/booked-dates` - Retrieves booked dates from database
  - Real-time synchronization of booked dates from `KloiOrders` table
  - Filters bookings by status (`IN_PROGRESS`, `CANCELLED`, `COMPLETED`) to show only confirmed bookings
  - ⚠️⚠️⚠️ **UPDATED**: Excludes `PENDING` orders - dates only lock after checkout completion (see Nov 2, 2025 entry)
  - Extracts dates from `eventDateTime` JSONB field
  - Automatic deduplication of dates from multiple orders

- **Reserved Dates "Snake Pick" Algorithm**:
  - Automatically reserves the next N unbooked days from current date (default: 3 days)
  - Prevents double-booking by reserving upcoming days not yet in database
  - Distinguishes between database-booked dates and system-reserved dates
  - Configurable via `defaultBookedDays` property
  - Fallback logic when booked dates API fails

- **Booking Submission**:
  - **API Integration**: `POST /api/session/date` - Submits selected dates and times
  - Maintains booking data in session for wizard flow
  - Loading states and success/error handling
  - Automatic redirect to next wizard step on success

- **User Experience Enhancements**:
  - Auto-hiding warning messages (8-second display)
  - Full month name display (e.g., "January 2025")
  - Formatted date display in booking summary
  - Error handling with user-friendly messages
  - Session validation integration

#### Direction Changes
- **Real-Time Availability**: Shift from static availability to dynamic database-driven booking system
- **Date Management**: Centralized date booking logic with server-side validation
- **User Interface**: Calendar-based booking experience replacing simple form inputs
- **Data Flow**: Integration of frontend calendar with backend order system

#### Files Affected
- `public/global/js/date__picker.js` (NEW/MODIFIED)
- `src/routes/api/index.ts` (MODIFIED) - Added `/api/booked-dates` and `/api/server-time` endpoints
- `src/routes/api/index.ts` (MODIFIED) - Enhanced `/api/session/date` endpoint
- `src/routes/datePicker.ts` (MODIFIED)
- `src/views/wizard/date-picker.hbs` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Booked dates API filters orders by status: only `IN_PROGRESS`, `CANCELLED`, and `COMPLETED` orders lock dates
- ⚠️⚠️⚠️ **UPDATED (Nov 2, 2025)**: `PENDING` orders are excluded - dates remain available until checkout completion
- Date format: `YYYY-MM-DD` (ISO format)
- Reserved dates are computed client-side to avoid unnecessary API calls
- Server time endpoint ensures accurate date comparisons across timezones
- The "snake pick" algorithm has a 365-day safety window to prevent infinite loops

**Related Documentation**: Implementation comments in `date__picker.js` provide detailed code documentation

---

### October 21, 2025 - Customer Conflict Resolution System

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Implemented email sanitization and customer conflict resolution with composite uniqueness constraint.

#### Breaking Changes
- **Database Schema**: Added composite unique constraint on `(phone, email)` in `Customers` table
  - **Impact**: Existing duplicate phone-email combinations will cause migration failure
  - **Action Required**: Clean duplicate data before migration
  - **Migration**: `20251021192122_add_composite_unique_phone_email`

#### Major Changes
- **New Service**: `conflictResolutionService.ts` - Handles customer conflict detection and resolution
- **New API Endpoint**: `/api/resolve-conflict` - POST endpoint for user-confirmed conflict resolution
- **New UI Component**: `conflict-popup.hbs` - Reusable conflict resolution modal
- **Email Sanitization**: New `sanitizeEmail()` utility function in `src/lib/utils.ts`
  - Normalizes emails to lowercase
  - Trims whitespace
  - Converts empty strings to `null`

#### Direction Changes
- **Customer Data Integrity**: Shifted from allowing duplicates to enforcing composite uniqueness
- **Conflict Handling**: Introduced user-driven conflict resolution flow instead of automatic overwrite
- **Email Normalization**: Standardized email handling across the application

#### Files Affected
- `src/services/conflictResolutionService.ts` (NEW)
- `src/views/partials/conflict-popup.hbs` (NEW)
- `src/lib/utils.ts` (MODIFIED)
- `src/routes/api/index.ts` (MODIFIED)
- `src/views/wizard/event-details.hbs` (MODIFIED)
- `prisma/schema.prisma` (MODIFIED)

#### Migration Notes
⚠️⚠️⚠️ **Pre-Migration Check Required**:
```sql
SELECT phone, email, COUNT(*) 
FROM "Customers" 
GROUP BY phone, email 
HAVING COUNT(*) > 1;
```

**Related Documentation**: `21-OCT-2025_CONFLICT_RESOLUTION_IMPLEMENTATION.md`

---

### October 21, 2025 - Order Status Enum System

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Centralized order status management with enum type and helper functions.

#### Breaking Changes
- **Database Schema**: Added `OrderStatus` enum type
  - **Impact**: Status values must now match enum values exactly
  - **Migration**: `20251021193000_add_order_status_enum`

#### Major Changes
- **Centralized Status System**: Single source of truth for order statuses
  - **Status Values**: `pending`, `confirmed`, `cancelled`, `completed`, `refunded`
  - **Status Groups**: Active, Final, etc.
  - **Helper Functions**: Type-safe status checking and validation

#### Direction Changes
- **Type Safety**: Moved from string-based status to enum-based system
- **Centralization**: Replaced hardcoded status values with centralized constants
- **Standardization**: Enforced consistent status handling across application

#### Migration Notes
⚠️⚠️⚠️ **IMPORTANT**: Any hardcoded status values in the codebase should be replaced with the centralized system.

**Related Documentation**: `docs/ORDER_STATUS_SYSTEM.md`

---

### September 16, 2025 - Email Field Made Nullable

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Email field in Customers table made optional to support phone-only registrations.

#### Breaking Changes
- **Database Schema**: `email` field in `Customers` table changed to nullable
  - **Impact**: Code assuming email is always present may break
  - **Migration**: `20250916110500_make_email_nullable`

#### Major Changes
- **Flexible Registration**: Customers can now register with phone number only
- **Data Validation**: Updated validation logic to handle null emails

#### Direction Changes
- **Customer Data Model**: Shift from email-required to email-optional model
- **Accessibility**: Support for users without email addresses

---

### July 8, 2025 - Customer Name Schema Update

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Separated customer name into first and last name fields.

#### Breaking Changes
- **Database Schema**: Replaced single `name` field with `firstName` and `lastName`
  - **Impact**: All queries using `name` field must be updated
  - **Migration**: `20250707185421_update_customers_schema_for_first_last_name`

#### Major Changes
- **Data Structure**: Improved customer name handling with separate fields
- **Form Updates**: Updated customer information forms to use separate fields

#### Migration Notes
⚠️⚠️⚠️ **Data Migration**: Existing `name` values may need to be split into `firstName` and `lastName`.

---

### July 7, 2025 - Event Time Schema Refactoring

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Refactored event datetime handling from single field to separate start/end times.

#### Breaking Changes
- **Database Schema**: 
  - Replaced `eventDatetime` with `eventStartTime` and `eventEndTime`
  - **Impact**: All queries and code referencing `eventDatetime` must be updated
  - **Migrations**: 
    - `20250707172119_update_event_time_to_start_end_times`
    - `20250707172807_remove_redundant_event_datetime_column`
    - `20250708171636_merge_event_datetime_columns`

#### Major Changes
- **Time Range Support**: Applications now support events with duration (start and end times)
- **Validation**: Updated validation to handle time ranges

#### Direction Changes
- **Event Model**: Shift from point-in-time events to time-range events
- **Booking System**: Enhanced support for multi-hour events

---

### July 5, 2025 - Session Foreign Key Removal

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Removed foreign key constraint on session references.

#### Breaking Changes
- **Database Schema**: Removed session foreign key relationship
  - **Migration**: `20250705094422_remove_session_foreign_key`

#### Major Changes
- **Session Management**: Decoupled session references from strict database constraints
- **Flexibility**: Allows for more flexible session handling

#### Direction Changes
- **Session Handling**: Move from database-enforced to application-enforced session management

---

### July 4, 2025 - Order Number Sequence Reset

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Order number sequence updated to start from 1000.

#### Major Changes
- **Order Numbering**: Order numbers now start from 1000 instead of 1
  - **Migration**: `20250704124406_update_order_number_start_1000`

#### Direction Changes
- **Order Presentation**: Professional order numbering starting from 1000

---

### July 4, 2025 - Initial Orders Table Creation

**Type**: 🔵 MIGRATION REQUIRED

**Summary**: Created initial KloiOrders table structure.

#### Major Changes
- **New Table**: `KloiOrders` table created with initial schema
  - **Migration**: `20250704123452_create_kloi_orders_table`

---

### June 4, 2025 - Initial Database Schema

**Type**: 🔵 MIGRATION REQUIRED

**Summary**: Initial database migration with core schema.

#### Major Changes
- **Initial Schema**: Complete database structure established
  - **Migration**: `20250604221735_init`

---

## Change Log Guidelines

### How to Add New Entries

When documenting changes, follow this format:

```markdown
### [Date] - [Brief Title]

**Type**: [Category tags]

**Summary**: One-line description of the change.

#### Breaking Changes
- **Component**: Description of breaking change
  - **Impact**: What will break
  - **Action Required**: What needs to be done
  - **Migration**: Migration name if applicable

#### Major Changes
- **Feature/Component**: Description of major change
- Additional changes...

#### Direction Changes
- **Theme**: Description of strategic shift

#### Files Affected
- List of modified/new files

#### Migration Notes
Any special migration instructions
```

### Categories

- **BREAKING CHANGE**: Code changes required, functionality may break
- **MAJOR CHANGE**: Significant feature/modification, may require updates
- **DIRECTION CHANGE**: Strategic shift in architecture or approach
- **MIGRATION REQUIRED**: Database or schema changes
- **DEPRECATED**: Phased-out features

---

## Quick Reference

### Active Migrations (Most Recent First)
1. `20251021193000_add_order_status_enum` - Order status enum system
2. `20251021192122_add_composite_unique_phone_email` - Composite uniqueness constraint
3. `20250916110500_make_email_nullable` - Email field nullable
4. `20250708171636_merge_event_datetime_columns` - Event time refactoring
5. `20250707185421_update_customers_schema_for_first_last_name` - Name field split

### Recent UX Improvements
1. Wizard progress saving on navigation - automatic session save when navigating between steps (Nov 2, 2025)
2. Back button fix - PENDING orders don't lock dates (Nov 2, 2025)

### Active Breaking Changes
1. Customer composite uniqueness constraint (Oct 21, 2025)
2. Order status enum system (Oct 21, 2025)
3. Customer name field split (July 8, 2025)
4. Event time refactoring (July 7, 2025)

### Strategic Direction Changes
1. Automatic progress saving on navigation - preserve user selections across wizard steps (Nov 2, 2025)
2. Calendar-based booking experience with real-time availability
3. Booking availability tied to order status lifecycle - dates unlockable until checkout (Nov 2, 2025)
4. Email-optional customer registration (Sept 16, 2025)
5. User-driven conflict resolution (Oct 21, 2025)
6. Centralized order status management (Oct 21, 2025)
7. Time-range event support (July 7, 2025)

---

## Notes

- ⚠️⚠️⚠️ Always check this document before planning migrations
- 🔵 Review related migration files in `prisma/migrations/`
- 📋 Check for related documentation in `docs/` directory
- 🔍 Search codebase for deprecated patterns before removing features

---