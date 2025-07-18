# Order Status System Documentation

## 🟡🟡🟡 Overview

The KLOI application uses a centralized order status system to ensure consistency and type safety across the entire codebase. This system prevents errors from hardcoded status values and provides a single source of truth for order status management.

## 🟡🟡🟡 Order Status Values

The system supports exactly **4 order statuses**:

| Status | Value | Description |
|--------|-------|-------------|
| `PENDING` | `'PENDING'` | Order has been created and is waiting for processing |
| `IN_PROGRESS` | `'IN_PROGRESS'` | Order is currently being processed or prepared |
| `CANCELLED` | `'CANCELLED'` | Order has been cancelled and will not be processed |
| `COMPLETED` | `'COMPLETED'` | Order has been successfully completed |

## 🟡🟡🟡 Implementation Details

### 1. Database Level (Prisma Schema)

```prisma
// prisma/schema.prisma
enum OrderStatus {
  PENDING
  IN_PROGRESS
  CANCELLED
  COMPLETED
}

model kloiOrdersTable {
  // ... other fields
  status OrderStatus @default(PENDING)
  // ... other fields
}
```

**Benefits:**
- ✅ Database-level constraint prevents invalid status values
- ✅ Type safety at the database level
- ✅ Clear documentation of allowed values

### 2. TypeScript Level (Type Definitions)

```typescript
// src/types/index.d.ts
export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS', 
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export type OrderStatusType = `${OrderStatus}`;
export const VALID_ORDER_STATUSES: OrderStatusType[] = Object.values(OrderStatus);
```

**Benefits:**
- ✅ Type safety in TypeScript code
- ✅ IntelliSense support
- ✅ Compile-time error checking

### 3. Status Groups for Common Operations

```typescript
export const ORDER_STATUS_GROUPS = {
  // Orders that are still being processed
  ACTIVE: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] as const,
  
  // Orders that have reached a final state
  FINAL: [OrderStatus.CANCELLED, OrderStatus.COMPLETED] as const,
  
  // Orders that should be considered for booking conflicts
  BOOKABLE: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] as const,
  
  // Orders that have been cancelled
  CANCELLED: [OrderStatus.CANCELLED] as const,
  
  // Orders that have been completed
  COMPLETED: [OrderStatus.COMPLETED] as const
} as const;
```

**Benefits:**
- ✅ Logical grouping for common operations
- ✅ Prevents hardcoded arrays throughout codebase
- ✅ Easy to maintain and update

### 4. Utility Functions

```typescript
export const OrderStatusHelpers = {
  // Check if a status is valid
  isValid: (status: string): status is OrderStatusType => {
    return VALID_ORDER_STATUSES.includes(status as OrderStatusType);
  },
  
  // Check if an order is still active
  isActive: (status: OrderStatusType): boolean => {
    return ORDER_STATUS_GROUPS.ACTIVE.includes(status);
  },
  
  // Check if an order has reached final state
  isFinal: (status: OrderStatusType): boolean => {
    return ORDER_STATUS_GROUPS.FINAL.includes(status);
  },
  
  // Check if an order should be considered for booking conflicts
  isBookable: (status: OrderStatusType): boolean => {
    return ORDER_STATUS_GROUPS.BOOKABLE.includes(status);
  },
  
  // Get human-readable status name
  getDisplayName: (status: OrderStatusType): string => {
    const displayNames: Record<OrderStatusType, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.IN_PROGRESS]: 'In Progress',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.COMPLETED]: 'Completed'
    };
    return displayNames[status];
  }
};
```

## 🟡🟡🟡 Usage Examples

### 1. Creating Orders

```typescript
// ✅ CORRECT - Using centralized enum
const newOrder = await prisma.kloiOrdersTable.create({
  data: {
    // ... other fields
    status: OrderStatus.PENDING
  }
});

// ❌ WRONG - Hardcoded string
const newOrder = await prisma.kloiOrdersTable.create({
  data: {
    // ... other fields
    status: 'pending' // This will cause TypeScript errors
  }
});
```

### 2. Filtering Orders

```typescript
// ✅ CORRECT - Using status groups
const activeOrders = await prisma.kloiOrdersTable.findMany({
  where: {
    status: {
      in: [...ORDER_STATUS_GROUPS.ACTIVE]
    }
  }
});

// ✅ CORRECT - Using status groups for booking conflicts
const bookableOrders = await prisma.kloiOrdersTable.findMany({
  where: {
    status: {
      in: [...ORDER_STATUS_GROUPS.BOOKABLE]
    }
  }
});

// ❌ WRONG - Hardcoded array
const activeOrders = await prisma.kloiOrdersTable.findMany({
  where: {
    status: {
      in: ['pending', 'inprogress'] // Hard to maintain
    }
  }
});
```

### 3. Status Validation

```typescript
// ✅ CORRECT - Using helper functions
if (OrderStatusHelpers.isActive(order.status)) {
  // Process active order
}

if (OrderStatusHelpers.isBookable(order.status)) {
  // Consider for booking conflicts
}

// ✅ CORRECT - Validation
if (!OrderStatusHelpers.isValid(userInputStatus)) {
  throw new Error('Invalid order status');
}
```

### 4. Display Names

```typescript
// ✅ CORRECT - Using helper for display
const displayName = OrderStatusHelpers.getDisplayName(order.status);
// Returns: "Pending", "In Progress", "Cancelled", or "Completed"
```

## 🟡🟡🟡 Migration Guide

### Before (Scattered Hardcoded Values)

```typescript
// Multiple files with hardcoded values
status: 'pending'
status: 'inprogress'
status: 'cancelled'
status: 'completed'

// Hardcoded arrays
notIn: ['cancelled', 'completed']
in: ['pending', 'inprogress']
```

### After (Centralized System)

```typescript
// Single import
import { OrderStatus, ORDER_STATUS_GROUPS, OrderStatusHelpers } from '../../types';

// Consistent usage
status: OrderStatus.PENDING
status: OrderStatus.IN_PROGRESS

// Using groups
in: [...ORDER_STATUS_GROUPS.BOOKABLE]
notIn: [...ORDER_STATUS_GROUPS.FINAL]

// Using helpers
if (OrderStatusHelpers.isActive(order.status)) {
  // ...
}
```

## 🟡🟡🟡 Benefits

1. **Type Safety**: TypeScript prevents invalid status values at compile time
2. **Database Constraints**: Prisma enum prevents invalid values at database level
3. **Maintainability**: Single source of truth for all status-related logic
4. **Consistency**: All parts of the codebase use the same status values
5. **Documentation**: Clear documentation of what each status means
6. **Extensibility**: Easy to add new statuses or modify existing ones
7. **IDE Support**: Full IntelliSense and autocomplete support

## 🟡🟡🟡 Best Practices

1. **Always use the enum**: Never hardcode status strings
2. **Use status groups**: For common operations like filtering
3. **Use helper functions**: For validation and display logic
4. **Import from types**: Always import from `src/types/index.d.ts`
5. **Document changes**: Update this documentation when adding new statuses

## 🟡🟡🟡 Adding New Statuses

To add a new order status:

1. **Update Prisma schema** (`prisma/schema.prisma`):
   ```prisma
   enum OrderStatus {
     PENDING
     IN_PROGRESS
     CANCELLED
     COMPLETED
     NEW_STATUS  // Add here
   }
   ```

2. **Update TypeScript enum** (`src/types/index.d.ts`):
   ```typescript
   export enum OrderStatus {
     PENDING = 'PENDING',
     IN_PROGRESS = 'IN_PROGRESS', 
     CANCELLED = 'CANCELLED',
     COMPLETED = 'COMPLETED',
     NEW_STATUS = 'NEW_STATUS'  // Add here
   }
   ```

3. **Update status groups** if needed
4. **Update helper functions** if needed
5. **Create database migration**: `npx prisma migrate dev --name add_new_status`
6. **Update documentation**

## 🟡🟡🟡 Testing

The system includes comprehensive testing to ensure:

- ✅ All status values are valid
- ✅ Status groups contain correct values
- ✅ Helper functions work correctly
- ✅ Database constraints are enforced
- ✅ TypeScript compilation succeeds

---

**⚠️⚠️⚠️ IMPORTANT**: This system is now the single source of truth for order statuses. Any hardcoded status values found in the codebase should be replaced with the centralized system. 