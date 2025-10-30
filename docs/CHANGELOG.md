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

## 2025

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

### Active Breaking Changes
1. Customer composite uniqueness constraint (Oct 21, 2025)
2. Order status enum system (Oct 21, 2025)
3. Customer name field split (July 8, 2025)
4. Event time refactoring (July 7, 2025)

### Strategic Direction Changes
1. Email-optional customer registration (Sept 16, 2025)
2. User-driven conflict resolution (Oct 21, 2025)
3. Centralized order status management (Oct 21, 2025)
4. Time-range event support (July 7, 2025)

---

## Notes

- ⚠️⚠️⚠️ Always check this document before planning migrations
- 🔵 Review related migration files in `prisma/migrations/`
- 📋 Check for related documentation in `docs/` directory
- 🔍 Search codebase for deprecated patterns before removing features

---

*Last Updated: October 21, 2025*

