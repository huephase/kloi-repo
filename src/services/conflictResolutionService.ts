// 🟡🟡🟡 - [CONFLICT RESOLUTION SERVICE] Service to handle customer conflict resolution
import { prisma } from '../lib/prisma';
import { sanitizeEmail } from '../lib/utils';

export interface ConflictData {
  phone: string | null;
  email: string | null | undefined;
  firstName: string;
  lastName: string;
}

export interface ConflictResolutionResult {
  success: boolean;
  customerId?: string;
  conflictType?: 'phone' | 'email' | 'both';
  existingCustomer?: ConflictData;
  message?: string;
}

// 🟡🟡🟡 - [CONFLICT DETECTION] Check for existing customers with phone or email conflicts
export async function detectCustomerConflicts(
  phone: string, 
  email: string | null
): Promise<ConflictResolutionResult> {
  console.log('🟡🟡🟡 - [CONFLICT DETECTION] Checking for conflicts with phone:', phone, 'email:', email);
  
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log('🟡🟡🟡 - [CONFLICT DETECTION] Sanitized email:', sanitizedEmail);
    
    // Check for existing customer by phone
    const existingByPhone = await prisma.customers.findFirst({
      where: { phone: phone }
    });
    
    // Check for existing customer by email (if email provided)
    let existingByEmail = null;
    if (sanitizedEmail) {
      existingByEmail = await prisma.customers.findFirst({
        where: { email: sanitizedEmail }
      });
    }
    
    console.log('🟡🟡🟡 - [CONFLICT DETECTION] Existing by phone:', existingByPhone?.id);
    console.log('🟡🟡🟡 - [CONFLICT DETECTION] Existing by email:', existingByEmail?.id);
    
    // Determine conflict type
    if (existingByPhone && existingByEmail && existingByPhone.id !== existingByEmail.id) {
      // Both phone and email exist but belong to different customers
      console.log('❗❗❗ - [CONFLICT DETECTION] Both phone and email conflicts detected');
      const conflictData: ConflictData = {
        phone: existingByPhone.phone,
        email: existingByPhone.email ?? null,
        firstName: existingByPhone.firstName || '',
        lastName: existingByPhone.lastName || ''
      };
      return {
        success: false,
        conflictType: 'both',
        existingCustomer: conflictData,
        message: 'Both phone number and email address are already in use by different customers'
      };
    } else if (existingByPhone) {
      // Phone conflict
      console.log('❗❗❗ - [CONFLICT DETECTION] Phone conflict detected');
      const conflictData: ConflictData = {
        phone: existingByPhone.phone,
        email: existingByPhone.email ?? null,
        firstName: existingByPhone.firstName || '',
        lastName: existingByPhone.lastName || ''
      };
      return {
        success: false,
        conflictType: 'phone',
        existingCustomer: conflictData,
        message: 'Phone number is already in use'
      };
    } else if (existingByEmail) {
      // Email conflict
      console.log('❗❗❗ - [CONFLICT DETECTION] Email conflict detected');
      const conflictData: ConflictData = {
        phone: existingByEmail.phone,
        email: existingByEmail.email ?? null,
        firstName: existingByEmail.firstName || '',
        lastName: existingByEmail.lastName || ''
      };
      return {
        success: false,
        conflictType: 'email',
        existingCustomer: conflictData,
        message: 'Email address is already in use'
      };
    }
    
    // No conflicts found
    console.log('✅✅✅ - [CONFLICT DETECTION] No conflicts found');
    return {
      success: true,
      message: 'No conflicts detected'
    };
    
  } catch (error) {
    console.error('❌❌❌ - [CONFLICT DETECTION] Error checking conflicts:', error);
    return {
      success: false,
      message: 'Error checking for conflicts'
    };
  }
}

// 🟡🟡🟡 - [CONFLICT RESOLUTION] Resolve conflicts by updating existing customer or creating new one
export async function resolveCustomerConflict(
  phone: string,
  email: string | null,
  firstName: string,
  lastName: string,
  conflictType: 'phone' | 'email' | 'both'
): Promise<ConflictResolutionResult> {
  console.log('🟡🟡🟡 - [CONFLICT RESOLUTION] Resolving conflict for phone:', phone, 'email:', email);
  
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log('🟡🟡🟡 - [CONFLICT RESOLUTION] Sanitized email:', sanitizedEmail);
    
    let customer = null;
    
    if (conflictType === 'phone') {
      // Update existing customer by phone
      console.log('🟡🟡🟡 - [CONFLICT RESOLUTION] Updating existing customer by phone');
      customer = await prisma.customers.update({
        where: { id: (await prisma.customers.findFirst({ where: { phone: phone } }))!.id },
        data: {
          firstName: firstName,
          lastName: lastName,
          email: sanitizedEmail,
        }
      });
    } else if (conflictType === 'email') {
      // Update existing customer by email
      console.log('🟡🟡🟡 - [CONFLICT RESOLUTION] Updating existing customer by email');
      customer = await prisma.customers.update({
        where: { id: (await prisma.customers.findFirst({ where: { email: sanitizedEmail } }))!.id },
        data: {
          firstName: firstName,
          lastName: lastName,
          phone: phone,
        }
      });
    } else if (conflictType === 'both') {
      // For both conflicts, we need to merge or choose which customer to update
      // For now, we'll update the phone-based customer and remove the email conflict
      console.log('🟡🟡🟡 - [CONFLICT RESOLUTION] Resolving both phone and email conflicts');
      
      // First, get the phone-based customer
      const phoneCustomer = await prisma.customers.findFirst({
        where: { phone: phone }
      });
      
      if (phoneCustomer) {
        // Update the phone customer with new email
        customer = await prisma.customers.update({
          where: { id: phoneCustomer.id },
          data: {
            firstName: firstName,
            lastName: lastName,
            email: sanitizedEmail,
          }
        });
        
        // Delete the email-based customer to resolve the conflict
        const emailCustomer = await prisma.customers.findFirst({
          where: { email: sanitizedEmail }
        });
        
        if (emailCustomer && emailCustomer.id !== phoneCustomer.id) {
          console.log('🟡🟡🟡 - [CONFLICT RESOLUTION] Removing duplicate email customer:', emailCustomer.id);
          await prisma.customers.delete({
            where: { id: emailCustomer.id }
          });
        }
      }
    }
    
    if (customer) {
      console.log('✅✅✅ - [CONFLICT RESOLUTION] Customer conflict resolved successfully:', customer.id);
      return {
        success: true,
        customerId: customer.id,
        message: 'Customer conflict resolved successfully'
      };
    } else {
      console.log('❗❗❗ - [CONFLICT RESOLUTION] Failed to resolve conflict');
      return {
        success: false,
        message: 'Failed to resolve customer conflict'
      };
    }
    
  } catch (error) {
    console.error('❌❌❌ - [CONFLICT RESOLUTION] Error resolving conflict:', error);
    return {
      success: false,
      message: 'Error resolving customer conflict'
    };
  }
}

// 🟡🟡🟡 - [SAFE CUSTOMER CREATION] Create customer with conflict detection and resolution
export async function createCustomerSafely(
  phone: string,
  email: string | null,
  firstName: string,
  lastName: string
): Promise<ConflictResolutionResult> {
  console.log('🟡🟡🟡 - [SAFE CUSTOMER CREATION] Creating customer safely with conflict detection');
  
  try {
    // First, check for conflicts
    const conflictCheck = await detectCustomerConflicts(phone, email);
    
    if (conflictCheck.success) {
      // No conflicts, create new customer
      console.log('🟡🟡🟡 - [SAFE CUSTOMER CREATION] No conflicts, creating new customer');
      const sanitizedEmail = sanitizeEmail(email);
      
      const customer = await prisma.customers.create({
        data: {
          phone: phone,
          firstName: firstName,
          lastName: lastName,
          email: sanitizedEmail,
        }
      });
      
      console.log('✅✅✅ - [SAFE CUSTOMER CREATION] New customer created:', customer.id);
      return {
        success: true,
        customerId: customer.id,
        message: 'Customer created successfully'
      };
    } else {
      // Conflicts detected, return conflict information
      console.log('❗❗❗ - [SAFE CUSTOMER CREATION] Conflicts detected, returning conflict info');
      return conflictCheck;
    }
    
  } catch (error) {
    console.error('❌❌❌ - [SAFE CUSTOMER CREATION] Error creating customer safely:', error);
    return {
      success: false,
      message: 'Error creating customer safely'
    };
  }
}
