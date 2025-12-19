// src/services/taxesFeesService.ts
// Service to fetch and process taxes and fees data from database
import { prisma } from '../lib/prisma';

// 🟡🟡🟡 - [TAXES FEES TYPES] Type definitions for taxes and fees structure
export type CalculationType = 'PERCENTAGE' | 'FIXED';
export type TaxFeeType = 'TAX' | 'FEE';
export type AppliesTo = 'ORDER_TOTAL' | 'SUBTOTAL';

export interface TaxFee {
  id: string;
  code: string;
  name: string;
  type: TaxFeeType;
  category: string;
  country_code: string;
  applies_to: AppliesTo;
  calculation_type: CalculationType;
  rate_value: number;
  currency: string;
  active: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 🟡🟡🟡 - [TAXES FEES SERVICE] Main service class for taxes and fees operations
export class TaxesFeesService {
  
  // 🟡🟡🟡 - [GET TAXES FEES BY COUNTRY] Fetch all active taxes/fees for a country
  static async getTaxesFeesByCountry(countryCode: string, effectiveDate?: Date): Promise<TaxFee[]> {
    console.log('🟡🟡🟡 - [TAXES FEES SERVICE] Fetching taxes/fees for country:', countryCode);
    
    try {
      const now = effectiveDate || new Date();
      
      // Query taxesFees table with filters for active status and date ranges
      const taxesFees = await prisma.taxesFees.findMany({
        where: {
          country_code: countryCode,
          active: true,
          AND: [
            {
              OR: [
                { startDate: null },
                { startDate: { lte: now } }
              ]
            },
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } }
              ]
            }
          ]
        },
        orderBy: [
          { type: 'asc' }, // TAX first, then FEE
          { createdAt: 'asc' } // Then by creation date
        ]
      });

      console.log('✅✅✅ - [TAXES FEES SERVICE] Found', taxesFees.length, 'active taxes/fees for country:', countryCode);
      
      // Convert Prisma Decimal to number for rate_value
      return taxesFees.map(tf => ({
        ...tf,
        rate_value: Number(tf.rate_value),
        startDate: tf.startDate,
        endDate: tf.endDate
      }));
      
    } catch (error) {
      console.error('❗❗❗ - [TAXES FEES SERVICE] Error fetching taxes/fees for country:', countryCode, error);
      return [];
    }
  }

  // 🟡🟡🟡 - [GET COUNTRY CODE FROM LOCATION] Extract country code from location data
  static getCountryCodeFromLocation(locationData: any): string {
    console.log('🟡🟡🟡 - [TAXES FEES SERVICE] Extracting country code from location data');
    
    if (!locationData) {
      console.log('⚠️⚠️⚠️ - [TAXES FEES SERVICE] No location data provided, defaulting to AE');
      return 'AE';
    }

    // Check components.country first (from delivery-location page)
    let country = locationData.components?.country || locationData.country || null;
    
    if (!country) {
      console.log('⚠️⚠️⚠️ - [TAXES FEES SERVICE] No country found in location data, defaulting to AE');
      return 'AE';
    }

    // Map country names to codes
    const countryMap: Record<string, string> = {
      'UAE': 'AE',
      'United Arab Emirates': 'AE',
      'AE': 'AE',
      'U.S.': 'US',
      'United States': 'US',
      'USA': 'US',
      'US': 'US'
    };

    const normalizedCountry = String(country).trim();
    const countryCode = countryMap[normalizedCountry] || normalizedCountry.toUpperCase().substring(0, 2);
    
    console.log('✅✅✅ - [TAXES FEES SERVICE] Country code extracted:', countryCode, 'from country:', country);
    return countryCode;
  }
}

