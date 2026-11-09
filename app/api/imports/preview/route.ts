import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, getCurrentCustomer } from '@/lib/auth';
import { getMyBusiness, type BusinessMembership } from '@/lib/business';
import { sql } from '@/lib/db';
import { MAX_IMPORT_BYTES, parseImportFile } from '@/lib/imports/parse';
import { suggestMapping } from '@/lib/imports/mapping';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'Sign in to import business data.' }, { status: 401 });
  const rateLimit = await consumeRateLimit(`business_import_preview:${customer.id}`, 10, 60, 60);
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many import previews. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    });
  }

  let businessId = '';
  let filename = '';
  let file: File;
  try {
    const form = await request.formData();
    businessId = String(form.get('businessId') || '');

    const submittedFile = form.get('file');
    if (!submittedFile || typeof submittedFile === 'string' || typeof submittedFile.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Choose a .csv or .xlsx file.' }, { status: 400 });
    }
    file = submittedFile;
  } catch (error) {
    console.error('[imports/preview] Could not read upload form', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Could not read this upload. Choose a .csv or .xlsx file and try again.' }, { status: 400 });
  }

  let business: BusinessMembership | null;
  try {
    business = await getMyBusiness(businessId);
    if (!business) return NextResponse.json({ error: 'This business is not available to your account.' }, { status: 403 });
  } catch (error) {
    console.error('[imports/preview] Could not authorize business', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Import preview is temporarily unavailable.' }, { status: 503 });
  }

  let parsedFile: Awaited<ReturnType<typeof parseImportFile>>;
  try {
    if (file.size > MAX_IMPORT_BYTES) return NextResponse.json({ error: 'Files must be 2 MB or smaller.' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    filename = file.name.replace(/[\u0000-\u001f]/g, '').split(/[\\/]/).pop()?.slice(0, 255) || 'business-import';
    parsedFile = await parseImportFile(buffer, file.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read this file.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await sql`
      DELETE FROM business_imports
      WHERE business_id = ${business.businessId}
        AND status = 'preview'
        AND created_at < NOW() - INTERVAL '24 hours'
    `;
    const created = await sql`
      INSERT INTO business_imports (
        business_id, created_by, source_filename, source_format, headers, preview_rows
      ) VALUES (
        ${business.businessId}, ${customer.id}, ${filename}, ${parsedFile.format},
        ${JSON.stringify(parsedFile.headers)}::jsonb, ${JSON.stringify(parsedFile.rows)}::jsonb
      )
      RETURNING id, created_at
    `;
    const importId = String(created[0].id);

    return NextResponse.json({
      importId,
      filename,
      format: parsedFile.format,
      headers: parsedFile.headers,
      sampleRows: parsedFile.rows.slice(0, 5),
      rowCount: parsedFile.rows.length,
      suggestions: suggestMapping(parsedFile.headers),
      expiresInHours: 24,
    }, { status: 201 });
  } catch (error) {
    console.error('[imports/preview] Database operation failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Import preview is temporarily unavailable.' }, { status: 503 });
  }
}
