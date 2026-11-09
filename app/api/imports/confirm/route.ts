import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { getMyBusiness, type BusinessMembership } from '@/lib/business';
import { sql } from '@/lib/db';
import type { ImportCell } from '@/lib/imports/parse';
import {
  IMPORT_FIELDS,
  normalizeImportRows,
  type DateFormat,
  type ImportMapping,
  type ImportRecordType,
  type NormalizedTransaction,
} from '@/lib/imports/mapping';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseMapping(value: unknown, width: number): ImportMapping {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Column mapping is missing.');
  const source = value as Record<string, unknown>;
  const mapping: ImportMapping = {};
  for (const key of Object.keys(source)) {
    if (!(IMPORT_FIELDS as readonly string[]).includes(key)) throw new Error('Column mapping contains an unsupported field.');
  }
  for (const field of IMPORT_FIELDS) {
    const index = source[field];
    if (index === null || index === undefined || index === '') mapping[field] = null;
    else if (Number.isInteger(index) && Number(index) >= 0 && Number(index) < width) mapping[field] = Number(index);
    else throw new Error(`The selected ${field} column is invalid.`);
  }
  return mapping;
}

export async function POST(request: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'Sign in to import business data.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Import confirmation data is invalid.' }, { status: 400 });
  }

  let business: BusinessMembership | null;
  try {
    business = await getMyBusiness(String(body.businessId || ''));
  } catch (error) {
    console.error('[imports/confirm] Could not authorize business', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Import confirmation is temporarily unavailable.' }, { status: 503 });
  }
  if (!business) return NextResponse.json({ error: 'This business is not available to your account.' }, { status: 403 });

  const importId = String(body.importId || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(importId)) {
    return NextResponse.json({ error: 'Import preview was not found. Upload the file again.' }, { status: 404 });
  }

  let pending: Record<string, unknown>[];
  try {
    pending = await sql`
      SELECT headers, preview_rows
      FROM business_imports
      WHERE id = ${importId}
        AND business_id = ${business.businessId}
        AND created_by = ${customer.id}
        AND status = 'preview'
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `;
  } catch (error) {
    console.error('[imports/confirm] Could not load preview', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Import confirmation is temporarily unavailable.' }, { status: 503 });
  }
  if (!pending.length) return NextResponse.json({ error: 'This import preview expired or was already confirmed. Upload the file again.' }, { status: 404 });

  let transactions: NormalizedTransaction[];
  try {
    const pendingImport = pending[0];
    if (!Array.isArray(pendingImport.headers) || !Array.isArray(pendingImport.preview_rows)) {
      return NextResponse.json({ error: 'The import preview is invalid. Upload the file again.' }, { status: 409 });
    }
    const headers = pendingImport.headers as string[];
    const rows = pendingImport.preview_rows as ImportCell[][];
    const mapping = parseMapping(body.mapping, headers.length);
    const defaultType = body.defaultType === 'expense' ? 'expense' : body.defaultType === 'sale' ? 'sale' : null;
    if (!defaultType) return NextResponse.json({ error: 'Choose whether unmapped transaction types are sales or expenses.' }, { status: 400 });
    const dateFormat = body.dateFormat as DateFormat;
    transactions = normalizeImportRows({
      headers,
      rows,
      mapping,
      defaultCurrency: String(body.defaultCurrency || ''),
      defaultType: defaultType as ImportRecordType,
      dateFormat,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The import mapping is invalid.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let result: Record<string, unknown>[];
  try {
    result = await sql`
      WITH completed_import AS (
        UPDATE business_imports
        SET status = 'completed',
            imported_records = ${transactions.length},
            completed_at = NOW(),
            preview_rows = '[]'::jsonb
        WHERE id = ${importId}
          AND business_id = ${business.businessId}
          AND created_by = ${customer.id}
          AND status = 'preview'
          AND created_at > NOW() - INTERVAL '24 hours'
        RETURNING id
      ), normalized_rows AS (
        SELECT *
        FROM jsonb_to_recordset(${JSON.stringify(transactions)}::jsonb) AS x(
          "sourceRowNumber" INTEGER,
          "recordType" TEXT,
          "transactionDate" DATE,
          amount NUMERIC,
          currency CHAR(3),
          description TEXT,
          category TEXT,
          "customerName" TEXT,
          "productName" TEXT,
          quantity NUMERIC
        )
      )
      INSERT INTO business_transactions (
        business_id, source_import_id, created_by, source_row_number,
        record_type, transaction_date, amount, currency, description,
        category, customer_name, product_name, quantity
      )
      SELECT ${business.businessId}, completed_import.id, ${customer.id},
             normalized_rows."sourceRowNumber", normalized_rows."recordType",
             normalized_rows."transactionDate", normalized_rows.amount,
             normalized_rows.currency, normalized_rows.description,
             normalized_rows.category, normalized_rows."customerName",
             normalized_rows."productName", normalized_rows.quantity
      FROM completed_import CROSS JOIN normalized_rows
      ON CONFLICT (source_import_id, source_row_number, record_type) DO NOTHING
      RETURNING id
    `;
  } catch (error) {
    console.error('[imports/confirm] Could not save transactions', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Import confirmation is temporarily unavailable.' }, { status: 503 });
  }
  if (!result.length) return NextResponse.json({ error: 'This import preview expired or was already confirmed.' }, { status: 409 });

  return NextResponse.json({ success: true, importId, importedRecords: result.length });
}
