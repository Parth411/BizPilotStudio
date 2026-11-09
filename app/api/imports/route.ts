import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { getMyBusiness, type BusinessMembership } from '@/lib/business';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'Sign in to view import history.' }, { status: 401 });
  const businessId = request.nextUrl.searchParams.get('business') || '';
  let business: BusinessMembership | null;
  try {
    business = await getMyBusiness(businessId);
  } catch (error) {
    console.error('[imports/list] Could not authorize business', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Import history is temporarily unavailable.' }, { status: 503 });
  }
  if (!business) return NextResponse.json({ error: 'This business is not available to your account.' }, { status: 403 });

  try {
    await sql`
      DELETE FROM business_imports
      WHERE business_id = ${business.businessId}
        AND status = 'preview'
        AND created_at <= NOW() - INTERVAL '24 hours'
    `;
    const rows = await sql`
      SELECT id, source_filename AS filename, source_format AS format, status,
             imported_records AS "importedRecords", created_at AS "createdAt",
             completed_at AS "completedAt"
      FROM business_imports
      WHERE business_id = ${business.businessId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ imports: rows });
  } catch (error) {
    console.error('[imports/list] Could not load history', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Could not load import history.' }, { status: 503 });
  }
}
