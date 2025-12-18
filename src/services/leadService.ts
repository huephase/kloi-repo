// 🟡🟡🟡 - [LEAD SERVICE] Service to handle lead creation and conversion to customers
import { prisma } from '../lib/prisma';
import { sanitizeEmail } from '../lib/utils';
import { createCustomerSafely, ConflictResolutionResult } from './conflictResolutionService';

// 🟡🟡🟡 - [LEAD CREATION] Create a lead (no conflict detection, allows duplicates)
export async function createLead(
  phone: string,
  email: string | null,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; leadId?: string; message?: string }> {
  console.log('🟡🟡🟡 - [LEAD SERVICE] Creating lead with phone:', phone, 'email:', email);
  
  try {
    // 🟡🟡🟡 - [EMAIL SANITIZATION] Sanitize email input
    const sanitizedEmail = sanitizeEmail(email);
    console.log('🟡🟡🟡 - [LEAD SERVICE] Sanitized email:', sanitizedEmail);
    
    // 🟡🟡🟡 - [LEAD CREATION] Create lead (no conflict detection needed, allows duplicates)
    const lead = await prisma.leads.create({
      data: {
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        email: sanitizedEmail,
      }
    });
    
    console.log('✅✅✅ - [LEAD SERVICE] Lead created successfully:', lead.id);
    return {
      success: true,
      leadId: lead.id,
      message: 'Lead created successfully'
    };
    
  } catch (error) {
    console.error('❌❌❌ - [LEAD SERVICE] Error creating lead:', error);
    return {
      success: false,
      message: 'Error creating lead'
    };
  }
}

// 🟡🟡🟡 - [LEAD TO CUSTOMER CONVERSION] Convert lead to customer with conflict detection
export async function convertLeadToCustomer(
  leadId: string
): Promise<ConflictResolutionResult & { converted?: boolean }> {
  console.log('🟡🟡🟡 - [LEAD SERVICE] Converting lead to customer:', leadId);
  
  try {
    // 🟡🟡🟡 - [LEAD FETCH] Get lead data
    const lead = await prisma.leads.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      console.error('❗❗❗ - [LEAD SERVICE] Lead not found:', leadId);
      return {
        success: false,
        message: 'Lead not found'
      };
    }
    
    if (!lead.phone) {
      console.error('❗❗❗ - [LEAD SERVICE] Lead missing phone number:', leadId);
      return {
        success: false,
        message: 'Lead missing required phone number'
      };
    }
    
    console.log('🟡🟡🟡 - [LEAD SERVICE] Lead data retrieved:', {
      phone: lead.phone,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName
    });
    
    // 🟡🟡🟡 - [CUSTOMER CREATION] Use existing safe customer creation with conflict detection
    // This reuses the DRY principle - existing conflict detection logic
    const customerResult = await createCustomerSafely(
      lead.phone,
      lead.email,
      lead.firstName || '',
      lead.lastName || ''
    );
    
    if (customerResult.success && customerResult.customerId) {
      console.log('✅✅✅ - [LEAD SERVICE] Lead converted to customer successfully:', customerResult.customerId);
      return {
        ...customerResult,
        converted: true
      };
    } else {
      // 🟡🟡🟡 - [CONFLICT DETECTION] Conflict detected during conversion
      console.log('❗❗❗ - [LEAD SERVICE] Conflict detected during lead conversion:', customerResult.message);
      return {
        ...customerResult,
        converted: false
      };
    }
    
  } catch (error) {
    console.error('❌❌❌ - [LEAD SERVICE] Error converting lead to customer:', error);
    return {
      success: false,
      message: 'Error converting lead to customer'
    };
  }
}

// 🟡🟡🟡 - [LEAD CONFLICT DETECTION] Check for existing leads (for conflict resolution UI)
export async function detectLeadConflicts(
  phone: string, 
  email: string | null
): Promise<ConflictResolutionResult> {
  console.log('🟡🟡🟡 - [LEAD SERVICE] Checking for lead conflicts with phone:', phone, 'email:', email);
  
  try {
    const sanitizedEmail = sanitizeEmail(email);
    console.log('🟡🟡🟡 - [LEAD SERVICE] Sanitized email:', sanitizedEmail);
    
    // 🟡🟡🟡 - [LEAD CONFLICT CHECK] Check for existing leads by phone
    const existingByPhone = await prisma.leads.findFirst({
      where: { phone: phone }
    });
    
    // 🟡🟡🟡 - [LEAD CONFLICT CHECK] Check for existing leads by email (if email provided)
    let existingByEmail = null;
    if (sanitizedEmail) {
      existingByEmail = await prisma.leads.findFirst({
        where: { email: sanitizedEmail }
      });
    }
    
    console.log('🟡🟡🟡 - [LEAD SERVICE] Existing lead by phone:', existingByPhone?.id);
    console.log('🟡🟡🟡 - [LEAD SERVICE] Existing lead by email:', existingByEmail?.id);
    
    // 🟡🟡🟡 - [LEAD CONFLICT CHECK] Note: Leads allow duplicates, but we check for UI purposes
    // This is mainly for the conflict resolution UI to show existing leads
    if (existingByPhone && existingByEmail && existingByPhone.id !== existingByEmail.id) {
      // Both phone and email exist but belong to different leads
      console.log('🟡🟡🟡 - [LEAD SERVICE] Both phone and email conflicts detected in leads');
      return {
        success: false,
        conflictType: 'both',
        existingCustomer: {
          phone: existingByPhone.phone,
          email: existingByPhone.email ?? null,
          firstName: existingByPhone.firstName || '',
          lastName: existingByPhone.lastName || ''
        },
        message: 'Both phone number and email address are already in use by different leads'
      };
    } else if (existingByPhone) {
      // Phone conflict
      console.log('🟡🟡🟡 - [LEAD SERVICE] Phone conflict detected in leads');
      return {
        success: false,
        conflictType: 'phone',
        existingCustomer: {
          phone: existingByPhone.phone,
          email: existingByPhone.email ?? null,
          firstName: existingByPhone.firstName || '',
          lastName: existingByPhone.lastName || ''
        },
        message: 'Phone number is already in use by another lead'
      };
    } else if (existingByEmail) {
      // Email conflict
      console.log('🟡🟡🟡 - [LEAD SERVICE] Email conflict detected in leads');
      return {
        success: false,
        conflictType: 'email',
        existingCustomer: {
          phone: existingByEmail.phone,
          email: existingByEmail.email ?? null,
          firstName: existingByEmail.firstName || '',
          lastName: existingByEmail.lastName || ''
        },
        message: 'Email address is already in use by another lead'
      };
    }
    
    // 🟡🟡🟡 - [LEAD CONFLICT CHECK] No conflicts found (but leads allow duplicates anyway)
    console.log('✅✅✅ - [LEAD SERVICE] No lead conflicts found');
    return {
      success: true,
      message: 'No lead conflicts detected'
    };
    
  } catch (error) {
    console.error('❌❌❌ - [LEAD SERVICE] Error checking lead conflicts:', error);
    return {
      success: false,
      message: 'Error checking for lead conflicts'
    };
  }
}

