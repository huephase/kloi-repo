// 2025-11-06 🟡🟡🟡 Service to read delivery districts and sublocalities
import { prisma } from '../lib/prisma';

export type DeliveryLocationRow = {
  id: bigint;
  country: string;
  city: string;
  district: string;
  sublocalities: any;
  created_at: Date;
  updated_at: Date;
};

export type DeliveryLocationsView = Array<{
  country: string;
  city: string;
  district: string;
  sublocalities: string[];
}>;

export async function getAllDeliveryLocations(): Promise<DeliveryLocationsView> {
  // 🟡🟡🟡 - [deliveryLocationsService] Fetch all rows and map for template consumption
  console.log('🟡🟡🟡 - [deliveryLocationsService] Fetching all delivery locations');
  // ⚠️⚠️⚠️ - [PRISMA CLIENT] Type assertion needed until Prisma client is regenerated with: npm run prisma:generate
  const rows = await (prisma as any).deliveryLocations.findMany({
    select: {
      country: true,
      city: true,
      district: true,
      sublocalities: true,
    }
  }) as unknown as Array<{ country: string; city: string; district: string; sublocalities: string[] }>;

  console.log('✅✅✅ - [deliveryLocationsService] Rows fetched:', rows.length);
  return rows.map(r => ({
    country: r.country || '',
    city: r.city || '',
    district: r.district,
    sublocalities: (r.sublocalities as unknown as string[]) || []
  }));
}


