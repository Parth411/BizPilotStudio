import type { ImportCell } from '@/lib/imports/parse';

export const IMPORT_FIELDS = [
  'date', 'amount', 'type', 'salesAmount', 'expenseAmount', 'currency',
  'description', 'category', 'customerName', 'productName', 'quantity',
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];
export type ImportMapping = Partial<Record<ImportField, number | null>>;
export type ImportRecordType = 'sale' | 'expense';
export type DateFormat = 'iso' | 'mdy' | 'dmy';
export type NormalizedTransaction = {
  sourceRowNumber: number;
  recordType: ImportRecordType;
  transactionDate: string;
  amount: string;
  currency: string;
  description: string | null;
  category: string | null;
  customerName: string | null;
  productName: string | null;
  quantity: string | null;
};

const HEADER_HINTS: Record<ImportField, string[]> = {
  date: ['date', 'transaction date', 'order date', 'invoice date'],
  amount: ['amount', 'total', 'value', 'price'],
  type: ['type', 'transaction type', 'kind'],
  salesAmount: ['sales amount', 'sale amount', 'revenue', 'sales', 'income'],
  expenseAmount: ['expense amount', 'expenses', 'expense', 'cost', 'spend'],
  currency: ['currency', 'currency code'],
  description: ['description', 'details', 'memo', 'notes', 'item'],
  category: ['category', 'expense category', 'account'],
  customerName: ['customer', 'customer name', 'client', 'client name'],
  productName: ['product', 'product name', 'service', 'service name'],
  quantity: ['quantity', 'qty', 'units'],
};

export function suggestMapping(headers: string[]): ImportMapping {
  const mapping: ImportMapping = {};
  for (const field of IMPORT_FIELDS) {
    const index = headers.findIndex((header) => {
      const normalized = header.trim().toLowerCase().replace(/[_-]+/g, ' ');
      return HEADER_HINTS[field].some((hint) => normalized === hint || normalized.includes(hint));
    });
    mapping[field] = index >= 0 ? index : null;
  }
  if (mapping.amount != null && (mapping.salesAmount != null || mapping.expenseAmount != null)) {
    mapping.amount = null;
  }
  if (mapping.salesAmount != null || mapping.expenseAmount != null) mapping.type = null;
  return mapping;
}

function cellAt(row: ImportCell[], mapping: ImportMapping, field: ImportField): ImportCell {
  const index = mapping[field];
  return typeof index === 'number' ? row[index] ?? null : null;
}

function textAt(value: ImportCell, field: string, maxLength: number): string | null {
  if (value === null || String(value).trim() === '') return null;
  const text = String(value).trim();
  if (text.length > maxLength) throw new Error(`${field} is longer than ${maxLength} characters.`);
  if (/^\s*=/.test(text)) throw new Error(`${field} contains a formula-like value.`);
  return text;
}

function parseDate(value: ImportCell, format: DateFormat): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 2958466) {
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0, 10);
  }
  const text = String(value ?? '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
  if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  if (format === 'iso') throw new Error('Use YYYY-MM-DD dates or choose a date format.');

  const parts = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (!parts) throw new Error('Date is not in the selected date format.');
  const first = Number(parts[1]);
  const second = Number(parts[2]);
  const year = Number(parts[3]);
  return format === 'mdy' ? validDate(year, first, second) : validDate(year, second, first);
}

function validDate(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error('Date is not a real calendar date.');
  }
  return date.toISOString().slice(0, 10);
}

function parseAmount(value: ImportCell, field: string): string | null {
  if (value === null || String(value).trim() === '') return null;
  const text = String(value).trim();
  if (!/^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,4})?$/.test(text)) {
    throw new Error(`${field} must be a plain number with up to four decimal places.`);
  }
  const amount = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) {
    throw new Error(`${field} must be greater than zero and no more than 1 trillion.`);
  }
  return amount.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function parseCurrency(value: ImportCell, fallback: string): string {
  const currency = String(value ?? '').trim().toUpperCase() || fallback;
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Currency must be a three-letter code such as INR or USD.');
  return currency;
}

function parseQuantity(value: ImportCell): string | null {
  if (value === null || String(value).trim() === '') return null;
  const text = String(value).trim();
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,4})?$/.test(text)) throw new Error('Quantity must be a positive number.');
  const quantity = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000_000) throw new Error('Quantity must be greater than zero.');
  return String(quantity);
}

function parseRecordType(value: ImportCell, fallback: ImportRecordType): ImportRecordType {
  const type = String(value ?? '').trim().toLowerCase();
  if (!type) return fallback;
  if (['sale', 'sales', 'revenue', 'income', 'inflow'].includes(type)) return 'sale';
  if (['expense', 'expenses', 'cost', 'purchase', 'spend', 'outflow'].includes(type)) return 'expense';
  throw new Error('Type must identify a sale/revenue or an expense/cost.');
}

function validIndex(value: unknown, width: number): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) < width;
}

export function normalizeImportRows(args: {
  headers: string[];
  rows: ImportCell[][];
  mapping: ImportMapping;
  defaultCurrency: string;
  defaultType: ImportRecordType;
  dateFormat: DateFormat;
}): NormalizedTransaction[] {
  const { headers, rows, mapping, defaultType, dateFormat } = args;
  const defaultCurrency = args.defaultCurrency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(defaultCurrency)) throw new Error('Choose a valid three-letter default currency code.');
  if (!['sale', 'expense'].includes(defaultType)) throw new Error('Choose whether untyped amounts are sales or expenses.');
  if (!['iso', 'mdy', 'dmy'].includes(dateFormat)) throw new Error('Choose a supported date format.');
  for (const field of IMPORT_FIELDS) {
    const value = mapping[field];
    if (value !== null && value !== undefined && !validIndex(value, headers.length)) {
      throw new Error(`The selected ${field} column is invalid.`);
    }
  }
  const hasAmount = mapping.amount != null;
  const hasSplitAmounts = mapping.salesAmount != null || mapping.expenseAmount != null;
  if (mapping.date == null || (!hasAmount && !hasSplitAmounts)) {
    throw new Error('Map a date column and at least one amount column.');
  }
  if (hasAmount && hasSplitAmounts) throw new Error('Map either one amount column or separate sales and expense columns, not both.');
  if (mapping.type != null && !hasAmount) throw new Error('A transaction type column is only used with a single amount column.');

  const records: NormalizedTransaction[] = [];
  const errors: string[] = [];
  rows.forEach((row, rowIndex) => {
    const sourceRowNumber = rowIndex + 2;
    const addRecord = (recordType: ImportRecordType, amountValue: ImportCell) => {
      const amount = parseAmount(amountValue, recordType === 'sale' ? 'Sales amount' : 'Expense amount');
      if (!amount) return;
      const dateValue = cellAt(row, mapping, 'date');
      if (dateValue === null || String(dateValue).trim() === '') throw new Error('Date is required.');
      const description = textAt(cellAt(row, mapping, 'description'), 'Description', 500)
        ?? textAt(cellAt(row, mapping, 'productName'), 'Product name', 200);
      records.push({
        sourceRowNumber,
        recordType,
        transactionDate: parseDate(dateValue, dateFormat),
        amount,
        currency: parseCurrency(cellAt(row, mapping, 'currency'), defaultCurrency),
        description,
        category: textAt(cellAt(row, mapping, 'category'), 'Category', 100),
        customerName: textAt(cellAt(row, mapping, 'customerName'), 'Customer name', 200),
        productName: textAt(cellAt(row, mapping, 'productName'), 'Product name', 200),
        quantity: parseQuantity(cellAt(row, mapping, 'quantity')),
      });
    };

    try {
      if (hasAmount) {
        const amountValue = cellAt(row, mapping, 'amount');
        if (amountValue === null || String(amountValue).trim() === '') return;
        addRecord(parseRecordType(cellAt(row, mapping, 'type'), defaultType), amountValue);
      } else {
        addRecord('sale', cellAt(row, mapping, 'salesAmount'));
        addRecord('expense', cellAt(row, mapping, 'expenseAmount'));
      }
    } catch (error) {
      errors.push(`Row ${sourceRowNumber}: ${error instanceof Error ? error.message : 'Invalid row.'}`);
    }
  });

  if (errors.length) throw new Error(`Some rows need correction:\n${errors.slice(0, 12).join('\n')}${errors.length > 12 ? `\nAnd ${errors.length - 12} more row errors.` : ''}`);
  if (!records.length) throw new Error('No rows with a valid amount were found.');
  return records;
}
