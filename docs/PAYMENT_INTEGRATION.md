# Payment Integration Implementation Plan

## Overview

This document outlines the step-by-step plan for implementing checkout and credit card processing with a swappable payment processor architecture. The implementation uses a strategy pattern to abstract payment processing, allowing easy switching between providers (Stripe, PayPal, Square, etc.) without changing core business logic.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Requirements](#data-requirements)
3. [Database Schema Updates](#database-schema-updates)
4. [External Dependencies & API Keys](#external-dependencies--api-keys)
5. [Implementation Phases](#implementation-phases)
6. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
7. [Frontend Integration](#frontend-integration)
8. [Security Considerations](#security-considerations)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Testing Strategy](#testing-strategy)
11. [Swapping Payment Providers](#swapping-payment-providers)

---

## Architecture Overview

### File Structure

```
src/
├── services/
│   ├── payment/
│   │   ├── PaymentProcessor.ts          # Abstract interface
│   │   ├── StripeProcessor.ts           # Stripe implementation
│   │   ├── PaymentProcessorFactory.ts   # Factory to switch providers
│   │   └── types.ts                     # Shared payment types
│   └── paymentService.ts                # Main service (uses abstraction)
├── routes/
│   ├── checkout.ts                      # Checkout page route
│   ├── api/
│   │   └── payment.ts                   # Payment API endpoints
│   └── webhooks/
│       └── stripe.ts                     # Stripe webhook handler
└── schemas/
    └── payment.schemas.ts                # Payment validation schemas
```

### Design Pattern

The implementation uses the **Strategy Pattern** with a factory to create payment processors. This allows:
- Easy swapping of payment providers via environment variable
- Consistent interface across all providers
- Isolated provider-specific code
- No changes to business logic when switching providers

---

## Data Requirements

### Data Needed from Event Summary

The checkout process requires the following data from the wizard session:

1. **Order Total Amount** - From `eventSetup.calculator.totals.total`
2. **Delivery Surcharge** - From `locationData.surcharge` or `location.components.surcharge`
3. **Currency** - Default: "AED" (configurable)
4. **Customer Information** - From `eventDetails`:
   - Email
   - First Name
   - Last Name
   - Phone
5. **Order ID** - From database `kloiOrdersTable.id` or `orderNumber`
6. **Session ID** - For tracking and session management

### Payment Flow Requirements

1. Create payment intent/charge request
2. Collect payment method (card details via Stripe Elements)
3. Confirm payment
4. Handle webhooks for async status updates
5. Update order status in database
6. Send confirmation email

---

## Database Schema Updates

### Required Fields

Add the following payment tracking fields to `kloiOrdersTable` in `prisma/schema.prisma`:

- `paymentProvider` (String?) - Provider identifier: 'stripe', 'paypal', etc.
- `paymentIntentId` (String?) - Provider's payment intent/charge ID
- `paymentStatus` (String?) - Status: 'pending', 'succeeded', 'failed', 'refunded'
- `paymentMethodId` (String?) - Saved payment method ID (optional, for future use)
- `paidAt` (DateTime?) - Timestamp when payment was completed

### Migration Steps

1. Update `prisma/schema.prisma` with new fields
2. Run `npm run prisma:migrate` to create migration
3. Verify migration file is created correctly
4. Apply migration to database

---

## External Dependencies & API Keys

### Required API Keys & Configuration

The following external inputs are required before implementation:

#### Stripe Account Setup

1. **Stripe Account** - Create account at https://stripe.com
2. **API Keys** (from Stripe Dashboard):
   - `STRIPE_SECRET_KEY` - Secret key (starts with `sk_test_` for test, `sk_live_` for production)
   - `STRIPE_PUBLISHABLE_KEY` - Publishable key (starts with `pk_test_` for test, `pk_live_` for production)
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (from Stripe Dashboard → Webhooks)

#### Environment Variables

Add to `.env` file and `docker-compose.yml`:

```env
# Payment Provider Configuration
PAYMENT_PROVIDER=stripe                    # Options: 'stripe', 'paypal', 'square', etc.

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...              # ⚠️ REQUIRED: Get from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_...         # ⚠️ REQUIRED: Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...            # ⚠️ REQUIRED: Get from Stripe Dashboard → Webhooks

# Currency Configuration
DEFAULT_CURRENCY=AED                       # Default currency code
```

#### Stripe Webhook Setup

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Add endpoint: `https://yourdomain.com/webhooks/stripe`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy the **Signing Secret** (starts with `whsec_`) for `STRIPE_WEBHOOK_SECRET`

#### Testing Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- Use any future expiry date and any 3-digit CVC

---

## Implementation Phases

### Phase 1: Payment Processor Abstraction Layer

Create the core abstraction that all payment providers will implement.

**Files to Create:**
- `src/services/payment/types.ts` - TypeScript interfaces and types
- `src/services/payment/PaymentProcessor.ts` - Abstract interface/contract
- `src/services/payment/PaymentProcessorFactory.ts` - Factory pattern implementation

**Key Interfaces:**
- `PaymentProcessor` - Main interface with methods: `createPaymentIntent()`, `confirmPayment()`, `retrievePayment()`, `handleWebhook()`
- `CreatePaymentIntentParams` - Parameters for creating payment intent
- `PaymentIntentResult` - Result containing `paymentIntentId`, `clientSecret`, `status`
- `PaymentResult` - Result from payment confirmation

### Phase 2: Stripe Implementation

Implement the Stripe-specific processor that conforms to the abstraction.

**Files to Create:**
- `src/services/payment/StripeProcessor.ts` - Stripe implementation of `PaymentProcessor`

**Key Implementation Details:**
- Initialize Stripe client with `STRIPE_SECRET_KEY`
- Use Stripe API version: `2024-12-18.acacia` (or latest stable)
- Convert amounts to smallest currency unit (cents for USD, fils for AED)
- Handle Stripe-specific error codes and responses

### Phase 3: Payment Service

Create the main payment service that uses the abstraction layer.

**Files to Update:**
- `src/services/paymentService.ts` - Main service that orchestrates payment operations

**Key Methods:**
- `createPaymentIntent()` - Creates payment intent using selected processor
- `confirmPayment()` - Confirms payment after card entry
- `retrievePaymentStatus()` - Gets current payment status
- `processWebhook()` - Processes webhook events

### Phase 4: Checkout Page Route

Create the checkout page that displays order summary and payment form.

**Files to Create:**
- `src/routes/checkout.ts` - Route handler for checkout page
- `src/views/wizard/checkout.hbs` - Checkout page template

**Route Endpoints:**
- `GET /checkout` - Display checkout page with order summary
- Calculate final total (subtotal + surcharge)
- Create payment intent server-side
- Pass `clientSecret` to frontend for Stripe Elements

### Phase 5: Payment API Endpoints

Create REST API endpoints for payment operations.

**Files to Create:**
- `src/routes/api/payment.ts` - Payment API endpoints

**Endpoints:**
- `POST /api/payment/create-intent` - Create payment intent (if not created on page load)
- `POST /api/payment/confirm` - Confirm payment after card entry
- `GET /api/payment/status/:orderId` - Get payment status for an order

### Phase 6: Webhook Handler

Implement webhook handler for async payment status updates.

**Files to Update:**
- `src/routes/webhooks/stripe.ts` - Stripe webhook handler

**Key Events to Handle:**
- `payment_intent.succeeded` - Update order status to `COMPLETED`, set `paidAt`
- `payment_intent.payment_failed` - Update order status, log error
- `payment_intent.canceled` - Handle cancellation

**Security:**
- Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
- Implement idempotency to prevent duplicate processing

---

## Step-by-Step Implementation Guide

### Step 1: Update Database Schema

1. Open `prisma/schema.prisma`
2. Add payment fields to `kloiOrdersTable` model (see [Database Schema Updates](#database-schema-updates))
3. Run migration: `npm run prisma:migrate`
4. Verify migration was applied successfully

**⚠️ Note:** Backup database before running migration in production.

### Step 2: Create Payment Abstraction Layer

1. Create `src/services/payment/types.ts`
   - Define all TypeScript interfaces and types
   - Export shared types for use across modules

2. Create `src/services/payment/PaymentProcessor.ts`
   - Define abstract interface/contract
   - Document method signatures and expected behavior

3. Create `src/services/payment/PaymentProcessorFactory.ts`
   - Implement factory pattern
   - Support switching providers via `PAYMENT_PROVIDER` env var
   - Throw error if provider not found

### Step 3: Implement Stripe Processor

1. Create `src/services/payment/StripeProcessor.ts`
2. Implement `PaymentProcessor` interface:
   - `createPaymentIntent()` - Use Stripe API to create payment intent
   - `confirmPayment()` - Confirm payment with payment method
   - `retrievePayment()` - Get payment details from Stripe
   - `handleWebhook()` - Verify and parse webhook events
3. Add error handling for Stripe-specific errors
4. Add logging with emoji prefixes (following project conventions)

### Step 4: Implement Payment Service

1. Update `src/services/paymentService.ts`
2. Initialize payment processor using factory
3. Implement business logic methods:
   - Calculate total amount (subtotal + surcharge)
   - Create payment intent with order metadata
   - Handle payment confirmation
   - Process webhook events
4. Add database updates for order status

### Step 5: Create Checkout Route

1. Create `src/routes/checkout.ts`
2. Implement `GET /checkout` route:
   - Validate session has required data
   - Calculate final total (from `eventSetup.calculator.totals.total` + `locationData.surcharge`)
   - Get or create order in database
   - Create payment intent via payment service
   - Render checkout page with order summary and `clientSecret`
3. Register route in `src/routes/index.ts`

### Step 6: Create Checkout Page Template

1. Create `src/views/wizard/checkout.hbs`
2. Display order summary:
   - Location details
   - Customer information
   - Event details
   - Date selection
   - Event setup selections
   - **Total amount breakdown** (subtotal + surcharge = total)
3. Add Stripe Elements container for card input
4. Add payment confirmation button
5. Include client-side JavaScript for Stripe integration

### Step 7: Create Payment API Endpoints

1. Create `src/routes/api/payment.ts`
2. Implement endpoints:
   - `POST /api/payment/create-intent` - Create payment intent
   - `POST /api/payment/confirm` - Confirm payment
   - `GET /api/payment/status/:orderId` - Get payment status
3. Add validation using existing payment schemas
4. Register routes in `src/routes/api/index.ts`

### Step 8: Implement Webhook Handler

1. Update `src/routes/webhooks/stripe.ts`
2. Implement webhook verification:
   - Verify signature using `STRIPE_WEBHOOK_SECRET`
   - Parse webhook event
3. Handle events:
   - `payment_intent.succeeded` → Update order status to `COMPLETED`, set `paidAt`, send confirmation email
   - `payment_intent.payment_failed` → Update order status, log error
   - `payment_intent.canceled` → Handle cancellation
4. Implement idempotency (check if event already processed)
5. Register webhook route (no session validation needed)

### Step 9: Update Event Summary Page

1. Update `src/routes/eventSummary.ts`
   - Ensure all required data is available for checkout
2. Update `src/views/wizard/event-summary.hbs`
   - Change "CONFIRM" button to "PROCEED TO CHECKOUT"
   - Link button to `/checkout`
   - Update button handler to navigate to checkout

### Step 10: Frontend Stripe Integration

1. Add Stripe.js script to checkout page template
2. Create client-side JavaScript:
   - Initialize Stripe with `STRIPE_PUBLISHABLE_KEY`
   - Create Stripe Elements instance
   - Mount card element to container
   - Handle form submission
   - Confirm payment with `clientSecret`
   - Show loading/success/error states
   - Redirect on success

### Step 11: Environment Configuration

1. Update `.env` file with all required variables (see [External Dependencies & API Keys](#external-dependencies--api-keys))
2. Update `docker-compose.yml` environment section
3. Verify all environment variables are loaded correctly
4. Test with Stripe test mode keys first

### Step 12: Testing & Validation

1. Test payment flow end-to-end:
   - Create order through wizard
   - Navigate to checkout
   - Enter test card details
   - Confirm payment
   - Verify order status updated
   - Verify webhook received
2. Test error scenarios:
   - Declined card
   - Network errors
   - Invalid payment data
3. Test webhook handling:
   - Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/webhooks/stripe`
   - Trigger test events
   - Verify order updates

---

## Frontend Integration

### Checkout Page Components

1. **Order Summary Section**
   - Display all wizard selections (location, customer, event details, dates, setup)
   - Show price breakdown: subtotal, surcharge, total
   - Read-only display (edit links to previous steps)

2. **Payment Form Section**
   - Stripe Elements card input (PCI compliant)
   - Cardholder name field (optional)
   - Payment button with loading state

3. **JavaScript Integration**
   - Load Stripe.js from CDN: `https://js.stripe.com/v3/`
   - Initialize with `STRIPE_PUBLISHABLE_KEY` (passed from server)
   - Create and mount card element
   - Handle payment confirmation
   - Show success/error messages
   - Redirect to success page on completion

### User Experience Flow

1. User clicks "PROCEED TO CHECKOUT" on event summary
2. Checkout page loads with order summary
3. Payment intent created server-side (transparent to user)
4. User enters card details in Stripe Elements
5. User clicks "PAY NOW" button
6. Payment confirmed via Stripe API
7. On success: redirect to confirmation page
8. On error: display error message, allow retry

---

## Security Considerations

### Critical Security Measures

1. **Never Store Card Details**
   - Card data never touches your server
   - Use Stripe Elements (PCI compliant)
   - All card processing handled by Stripe

2. **Webhook Signature Verification**
   - Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
   - Reject webhooks with invalid signatures
   - Prevent webhook replay attacks

3. **HTTPS Required**
   - All payment operations must use HTTPS
   - Set `SESSION_COOKIE_SECURE=true` in production
   - Use secure cookies for session management

4. **Server-Side Validation**
   - Always validate payment amounts server-side
   - Never trust client-provided amounts
   - Recalculate totals from database/session data

5. **Idempotency Keys**
   - Use idempotency keys for payment intent creation
   - Prevent duplicate charges from retries
   - Store idempotency keys with orders

6. **Audit Logging**
   - Log all payment events with timestamps
   - Log webhook events received
   - Log payment status changes
   - Use emoji prefixes for log categorization

7. **Error Handling**
   - Never expose sensitive error details to clients
   - Log detailed errors server-side
   - Return user-friendly error messages

---

## Error Handling Strategy

### Payment Failure Scenarios

1. **Card Declined**
   - Display user-friendly message: "Your card was declined. Please try a different payment method."
   - Allow user to retry with different card
   - Log decline reason server-side

2. **Network Errors**
   - Show retry option
   - Implement exponential backoff for retries
   - Store payment intent ID for retry

3. **Webhook Failures**
   - Implement retry queue for failed webhook processing
   - Store webhook events for manual review
   - Alert administrators of persistent failures

4. **Order Status Sync**
   - Periodic reconciliation job to sync order status
   - Check payment status with provider if order stuck in pending
   - Manual status update endpoint for administrators

### Error Messages

- **User-Facing**: Friendly, actionable messages
- **Server Logs**: Detailed error information with context
- **Monitoring**: Alert on critical payment failures

---

## Testing Strategy

### Test Environment Setup

1. **Use Stripe Test Mode**
   - Use test API keys (`sk_test_`, `pk_test_`)
   - Test webhook secret from test mode webhook endpoint

2. **Stripe CLI for Webhooks**
   - Install Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks/stripe`
   - Forward test webhooks to local development server
   - Trigger test events: `stripe trigger payment_intent.succeeded`

### Test Scenarios

1. **Successful Payment Flow**
   - Use test card: `4242 4242 4242 4242`
   - Verify payment intent created
   - Verify payment confirmed
   - Verify order status updated
   - Verify webhook received and processed

2. **Declined Card**
   - Use test card: `4000 0000 0000 0002`
   - Verify error message displayed
   - Verify order remains in pending status

3. **3D Secure Authentication**
   - Use test card: `4000 0025 0000 3155`
   - Verify 3D Secure flow works
   - Verify payment completes after authentication

4. **Webhook Events**
   - Test `payment_intent.succeeded` event
   - Test `payment_intent.payment_failed` event
   - Test `payment_intent.canceled` event
   - Verify idempotency (send same event twice)

5. **Error Scenarios**
   - Test with invalid API keys
   - Test with missing webhook secret
   - Test with malformed payment data
   - Test network timeouts

### Test Data

- **Test Cards**: See [External Dependencies & API Keys](#external-dependencies--api-keys)
- **Test Amounts**: Use small amounts (e.g., 100 AED = 10000 fils)
- **Test Orders**: Create test orders through wizard flow

---

## Swapping Payment Providers

### Architecture Benefits

The abstraction layer allows switching payment providers by:
1. Creating a new processor class implementing `PaymentProcessor`
2. Updating the factory to support the new provider
3. Changing the `PAYMENT_PROVIDER` environment variable
4. No changes to business logic or routes required

### Example: Adding PayPal

1. **Create PayPal Processor**
   - Create `src/services/payment/PayPalProcessor.ts`
   - Implement `PaymentProcessor` interface
   - Use PayPal SDK for implementation

2. **Update Factory**
   - Add `case 'paypal'` to `PaymentProcessorFactory`
   - Initialize with PayPal credentials

3. **Update Environment**
   - Add PayPal API keys to `.env`
   - Set `PAYMENT_PROVIDER=paypal`

4. **Update Webhook Handler**
   - Create `src/routes/webhooks/paypal.ts` if needed
   - Register webhook route

### Provider-Specific Considerations

- **Stripe**: Uses payment intents, client secrets, Elements
- **PayPal**: May use different flow (redirect, SDK, etc.)
- **Square**: Different API structure and webhook format
- **Other Providers**: Adapt interface implementation as needed

**Note**: Some providers may require additional frontend changes (e.g., PayPal redirect flow), but core business logic remains unchanged.

---

## Implementation Checklist

### Pre-Implementation
- [ ] Stripe account created
- [ ] Stripe API keys obtained (test mode)
- [ ] Stripe webhook endpoint configured
- [ ] Webhook signing secret obtained
- [ ] Environment variables added to `.env` and `docker-compose.yml`

### Database
- [ ] Payment fields added to `kloiOrdersTable` schema
- [ ] Migration created and tested
- [ ] Migration applied to database

### Backend Implementation
- [ ] Payment abstraction layer created (`types.ts`, `PaymentProcessor.ts`, `PaymentProcessorFactory.ts`)
- [ ] Stripe processor implemented (`StripeProcessor.ts`)
- [ ] Payment service implemented (`paymentService.ts`)
- [ ] Checkout route created (`checkout.ts`)
- [ ] Payment API endpoints created (`api/payment.ts`)
- [ ] Webhook handler implemented (`webhooks/stripe.ts`)

### Frontend Implementation
- [ ] Checkout page template created (`checkout.hbs`)
- [ ] Stripe Elements integrated
- [ ] Payment confirmation JavaScript implemented
- [ ] Event summary page updated with checkout button

### Testing
- [ ] End-to-end payment flow tested
- [ ] Error scenarios tested
- [ ] Webhook events tested
- [ ] Order status updates verified
- [ ] Security measures verified

### Production Readiness
- [ ] Production Stripe keys configured
- [ ] Production webhook endpoint configured
- [ ] HTTPS enabled
- [ ] Error monitoring set up
- [ ] Payment logging verified
- [ ] Documentation updated

---

## Additional Notes

### Currency Handling

- **AED (UAE Dirham)**: Smallest unit is "fils" (1 AED = 100 fils)
- **USD**: Smallest unit is "cents" (1 USD = 100 cents)
- Always convert to smallest unit when creating payment intents
- Display amounts in major units (AED, USD) to users

### Order Status Flow

1. **PENDING** - Order created, payment not initiated
2. **PENDING** - Payment intent created, awaiting payment
3. **COMPLETED** - Payment succeeded, order confirmed
4. **CANCELLED** - Payment canceled or order canceled

### Future Enhancements

- Save payment methods for returning customers
- Support multiple payment methods (cards, bank transfer, etc.)
- Implement refund functionality
- Add payment analytics and reporting
- Support subscription/recurring payments (if needed)

---

## Support & Resources

### Stripe Documentation
- **API Reference**: https://stripe.com/docs/api
- **Stripe Elements**: https://stripe.com/docs/stripe-js
- **Webhooks Guide**: https://stripe.com/docs/webhooks
- **Testing**: https://stripe.com/docs/testing

### Internal Resources
- Payment service code: `src/services/paymentService.ts`
- Payment schemas: `src/schemas/payment.schemas.ts`
- Order service: `src/services/orderService.ts`

---

**Last Updated**: 2025-01-XX  
**Status**: Planning Phase  
**Next Steps**: Begin with Step 1 (Database Schema Updates)
