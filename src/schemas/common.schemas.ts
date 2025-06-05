// Common Zod schemas
import { z } from 'zod';

console.log('🟡🟡🟡 - [common.schemas] Defining common schemas');

export const uuidSchema = z.string().uuid();
console.log('🟡🟡🟡 - [common.schemas] uuidSchema created');

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});
console.log('🟡🟡🟡 - [common.schemas] paginationSchema created');

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.number().optional(),
});
console.log('🟡🟡🟡 - [common.schemas] errorResponseSchema created');
