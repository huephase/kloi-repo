// Global types and declarations
// 🟡🟡🟡 - [SESSION DATA] Define session data structure
export interface SessionData {
  sessionId: string;
  lastVisited: string;
  touch(): void;
  [key: string]: any; // Allow dynamic session keys
}

// 🟡🟡🟡 - [ORDER STATUS] Centralized order status definitions matching Prisma enum
export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS', 
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

// 🟡🟡🟡 - [ORDER STATUS UTILS] Type-safe order status utilities
export type OrderStatusType = `${OrderStatus}`;

// 🟡🟡🟡 - [ORDER STATUS VALIDATION] Array of valid order statuses for validation
export const VALID_ORDER_STATUSES: OrderStatusType[] = Object.values(OrderStatus);

// 🟡🟡🟡 - [ORDER STATUS GROUPS] Grouped statuses for common operations
export const ORDER_STATUS_GROUPS = {
  // 🟡🟡🟡 - [ACTIVE ORDERS] Orders that are still being processed
  ACTIVE: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] as const,
  
  // 🟡🟡🟡 - [FINAL ORDERS] Orders that have reached a final state
  FINAL: [OrderStatus.CANCELLED, OrderStatus.COMPLETED] as const,
  
  // 🟡🟡🟡 - [BOOKABLE ORDERS] Orders that should be considered for booking conflicts
  BOOKABLE: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] as const,
  
  // 🟡🟡🟡 - [CANCELLED ORDERS] Orders that have been cancelled
  CANCELLED: [OrderStatus.CANCELLED] as const,
  
  // 🟡🟡🟡 - [COMPLETED ORDERS] Orders that have been completed
  COMPLETED: [OrderStatus.COMPLETED] as const
} as const;

// 🟡🟡🟡 - [ORDER STATUS HELPERS] Utility functions for order status operations
export const OrderStatusHelpers = {
  // 🟡🟡🟡 - [VALIDATION] Check if a status is valid
  isValid: (status: string): status is OrderStatusType => {
    return VALID_ORDER_STATUSES.includes(status as OrderStatusType);
  },
  
  // 🟡🟡🟡 - [ACTIVE CHECK] Check if an order is still active
  isActive: (status: OrderStatusType): boolean => {
    return (ORDER_STATUS_GROUPS.ACTIVE as readonly string[]).includes(status);
  },
  
  // 🟡🟡🟡 - [FINAL CHECK] Check if an order has reached final state
  isFinal: (status: OrderStatusType): boolean => {
    return (ORDER_STATUS_GROUPS.FINAL as readonly string[]).includes(status);
  },
  
  // 🟡🟡🟡 - [BOOKABLE CHECK] Check if an order should be considered for booking conflicts
  isBookable: (status: OrderStatusType): boolean => {
    return (ORDER_STATUS_GROUPS.BOOKABLE as readonly string[]).includes(status);
  },
  
  // 🟡🟡🟡 - [DISPLAY NAME] Get human-readable status name
  getDisplayName: (status: OrderStatusType): string => {
    const displayNames: Record<OrderStatusType, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.IN_PROGRESS]: 'In Progress',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.COMPLETED]: 'Completed'
    };
    return displayNames[status];
  },
  
  // 🟡🟡🟡 - [DESCRIPTION] Get status description
  getDescription: (status: OrderStatusType): string => {
    const descriptions: Record<OrderStatusType, string> = {
      [OrderStatus.PENDING]: 'Order has been created and is waiting for processing',
      [OrderStatus.IN_PROGRESS]: 'Order is currently being processed or prepared',
      [OrderStatus.CANCELLED]: 'Order has been cancelled and will not be processed',
      [OrderStatus.COMPLETED]: 'Order has been successfully completed'
    };
    return descriptions[status];
  }
} as const;

// 🟡🟡🟡 - [WIZARD STEP CONFIG] Type for wizard step configuration
export interface WizardStepConfig {
  sessionKey: string;
  redirectTo: string;
}

// 🟡🟡🟡 - [SESSION EXTENSION] Note: Session is handled by @fastify/session plugin
// The session property is automatically added to FastifyRequest by the session plugin

