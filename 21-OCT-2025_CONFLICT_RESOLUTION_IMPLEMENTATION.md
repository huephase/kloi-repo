# Customer Conflict Resolution Implementation

## Overview
This document outlines the implementation of email sanitization and customer conflict resolution features for the KLOI ordering system.

## Task 1: Email Sanitization ✅

### Implementation
- **Location**: `src/lib/utils.ts`
- **Function**: `sanitizeEmail(email: string | undefined | null): string | null`

### Features
- Trims whitespace from email addresses
- Converts to lowercase for consistency
- Converts empty strings to `null`
- Returns `null` for undefined/null inputs

### Usage
```typescript
const sanitizedEmail = sanitizeEmail(validatedData.email);
// Example: "  User@Example.COM  " → "user@example.com"
// Example: "" → null
// Example: null → null
```

## Task 2: Composite Uniqueness & Conflict Resolution ✅

### Database Schema Changes
- **File**: `prisma/schema.prisma`
- **Migration**: `20251021192122_add_composite_unique_phone_email`

#### Added Composite Unique Constraint
```prisma
model Customers {
  // ... existing fields ...
  
  @@unique([phone, email], name: "unique_phone_email")
}
```

### Conflict Resolution Service
- **File**: `src/services/conflictResolutionService.ts`

#### Key Functions

1. **detectCustomerConflicts**
   - Checks for existing customers with matching phone or email
   - Returns conflict type: 'phone', 'email', or 'both'
   - Provides existing customer data for conflict resolution

2. **resolveCustomerConflict**
   - Updates existing customer with new information
   - Handles merging of duplicate customers
   - Confirms user's intent to proceed with existing data

3. **createCustomerSafely**
   - Creates customer with conflict detection
   - Returns conflict information if detected
   - Creates new customer only if no conflicts exist

### API Endpoints

#### New Endpoint: `/api/resolve-conflict`
- **Method**: POST
- **Purpose**: Resolve customer conflicts after user confirmation
- **Request Body**:
  ```json
  {
    "phone": "0503344556",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "conflictType": "phone" | "email" | "both"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "customerId": "uuid",
    "message": "Customer conflict resolved successfully"
  }
  ```

#### Updated Endpoint: `/api/session/event-details`
- Now detects conflicts before customer creation
- Returns HTTP 409 (Conflict) when conflicts detected
- Includes conflict details for client-side handling

### User Interface Components

#### Conflict Popup Component
- **File**: `src/views/partials/conflict-popup.hbs`
- **Features**:
  - Reusable modal for conflict resolution
  - Displays existing customer information
  - Allows customization for future enhancements
  - Simple "CONFIRM TO PROCEED" button
  - Graceful handling of conflicts

#### Integration
- **File**: `src/views/wizard/event-details.hbs`
- Automatically shows conflict popup when conflicts detected
- Handles user confirmation before proceeding
- Seamless integration with existing form submission flow

### JavaScript Functions

```javascript
// Show conflict popup with existing customer data
showConflictPopup(conflictData, callback);

// Handle conflict resolution
handleCustomerConflict(conflictData);

// Resolve conflict via API
resolveConflict(conflictData);

// Submit form after conflict resolution
submitEventDetailsForm();
```

## Flow Diagram

```
User Submits Form
    ↓
Email Sanitization
    ↓
Conflict Detection
    ↓
┌─────────────┬─────────────┐
│             │             │
No Conflict   Conflict      
│             Detected      
│             ↓             
│         Show Popup        
│             ↓             
│      User Confirms        
│             ↓             
│    Resolve Conflict       
│             ↓             
└─────────────┴─────────────┘
                ↓
        Create/Update Customer
                ↓
        Create Order
                ↓
        Redirect to Next Step
```

## Benefits

1. **Data Integrity**
   - Prevents duplicate customers with same phone/email
   - Ensures email consistency (lowercase, trimmed)
   - Allows multiple customers without email (NULL values)

2. **User Experience**
   - Graceful conflict handling
   - Clear communication about existing data
   - User control over conflict resolution
   - No data loss or confusion

3. **Future Extensibility**
   - Reusable conflict popup component
   - Abstracted conflict resolution service
   - Easy to add more conflict types
   - Customizable popup content

4. **Best Practices**
   - Follows database normalization principles
   - Implements proper error handling
   - Uses TypeScript for type safety
   - Comprehensive logging for debugging

## Migration Notes

⚠️ **Breaking Change Potential**: The composite unique constraint may fail if existing data has duplicate phone-email combinations.

### Pre-Migration Checks
Before running the migration, check for existing duplicates:

```sql
SELECT phone, email, COUNT(*) 
FROM "Customers" 
GROUP BY phone, email 
HAVING COUNT(*) > 1;
```

### Migration Steps
1. Review and clean up any duplicate data
2. Run the migration:
   ```bash
   npx prisma migrate deploy
   ```
3. Verify constraint was added successfully

## Testing Recommendations

1. **Email Sanitization**
   - Test with various email formats
   - Test with empty strings and null values
   - Test with whitespace and mixed case

2. **Conflict Detection**
   - Test phone conflict scenario
   - Test email conflict scenario
   - Test both phone and email conflict
   - Test with NULL emails

3. **Conflict Resolution**
   - Test user confirmation flow
   - Test cancellation flow
   - Test data merge scenarios
   - Test error handling

## Files Modified

### New Files
- `src/services/conflictResolutionService.ts`
- `src/views/partials/conflict-popup.hbs`
- `prisma/migrations/20251021192122_add_composite_unique_phone_email/migration.sql`

### Modified Files
- `src/lib/utils.ts` - Added `sanitizeEmail()` function
- `src/routes/api/index.ts` - Updated customer creation logic
- `src/views/wizard/event-details.hbs` - Added conflict handling
- `prisma/schema.prisma` - Added composite unique constraint

## Logging & Debugging

All functions include comprehensive logging with emoji prefixes:
- 🟡🟡🟡 - Information and monitoring
- ✅✅✅ - Success messages
- ❗❗❗ - Errors and warnings
- ❌❌❌ - Critical errors

Example logs:
```
🟡🟡🟡 - [EMAIL SANITIZATION] Input email: User@Example.COM
✅✅✅ - [EMAIL SANITIZATION] Normalized email: user@example.com
❗❗❗ - [CONFLICT DETECTION] Phone conflict detected
✅✅✅ - [CONFLICT RESOLUTION] Conflict resolved successfully: uuid-123
```

## Conclusion

Both tasks have been completed successfully:
1. ✅ Email sanitization implemented with normalization
2. ✅ Composite uniqueness with graceful conflict handling
3. ✅ Reusable conflict popup component created
4. ✅ Database schema updated with migration
5. ✅ Comprehensive logging and error handling

The implementation follows best practices, is fully abstracted for future enhancements, and provides a smooth user experience for handling customer data conflicts.

