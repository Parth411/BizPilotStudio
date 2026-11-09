import 'server-only';

import ExcelJS from 'exceljs';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_COLUMNS = 40;
const MAX_CELL_LENGTH = 1000;
const MAX_XLSX_EXPANDED_BYTES = 4 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 250;

export type ImportCell = string | number | boolean | null;
export type ParsedImport = {
  headers: string[];
  rows: ImportCell[][];
  format: 'csv' | 'xlsx';
};

function fail(message: string): never {
  throw new Error(message);
}

function checkCell(value: string): string {
  if (value.length > MAX_CELL_LENGTH) fail(`A cell exceeds the ${MAX_CELL_LENGTH}-character limit.`);
  if (/^\s*=/.test(value)) fail('Formula-like cells are not accepted. Remove formulas and upload the values-only file.');
  return value;
}

function normalizeRows(rows: ImportCell[][], format: ParsedImport['format']): ParsedImport {
  while (rows.length && rows[rows.length - 1].every((value) => value === null || String(value).trim() === '')) rows.pop();
  if (rows.length < 2) fail('The file needs a header row and at least one data row.');
  if (rows.length > MAX_IMPORT_ROWS + 1) fail(`Files can contain up to ${MAX_IMPORT_ROWS} data rows per import.`);

  const headers = rows[0].map((value) => String(value ?? '').trim());
  if (!headers.length || headers.length > MAX_IMPORT_COLUMNS) fail(`Files can contain up to ${MAX_IMPORT_COLUMNS} columns.`);
  if (headers.some((header) => !header)) fail('Every column needs a header.');
  const normalizedHeaders = headers.map((header) => header.toLocaleLowerCase());
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) fail('Column headers must be unique. Rename duplicate columns and upload again.');
  if (headers.some((header) => header.length > 100)) fail('Column headers must be 100 characters or fewer.');

  const width = headers.length;
  const dataRows = rows.slice(1).map((row) => {
    if (row.length > MAX_IMPORT_COLUMNS) fail(`Files can contain up to ${MAX_IMPORT_COLUMNS} columns.`);
    if (row.slice(width).some((value) => value !== null && String(value).trim() !== '')) {
      fail('A data row contains values beyond the last header. Add a header for every populated column.');
    }
    const normalized = Array.from({ length: width }, (_, index) => row[index] ?? null);
    return normalized;
  }).filter((row) => row.some((value) => value !== null && String(value).trim() !== ''));
  if (!dataRows.length) fail('No data rows were found under the headers.');

  return { headers, rows: dataRows, format };
}

function parseCsv(buffer: Buffer): ParsedImport {
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '');
  } catch {
    return fail('CSV files must use UTF-8 encoding.');
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(source)) fail('The CSV contains unsupported control characters.');

  const rows: ImportCell[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let closedQuote = false;
  const pushCell = () => {
    row.push(checkCell(cell));
    if (row.length > MAX_IMPORT_COLUMNS) fail(`Files can contain up to ${MAX_IMPORT_COLUMNS} columns.`);
    cell = '';
    closedQuote = false;
  };
  const pushRow = () => {
    pushCell();
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    if (rows.length > MAX_IMPORT_ROWS + 1) fail(`Files can contain up to ${MAX_IMPORT_ROWS} data rows per import.`);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        cell += character;
      }
    } else if (character === '"') {
      if (cell.length || closedQuote) fail('The CSV has an unexpected quote. Check the file formatting.');
      quoted = true;
    } else if (character === ',') {
      pushCell();
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      pushRow();
    } else {
      if (closedQuote && character.trim()) fail('Unexpected text after a quoted CSV value.');
      if (!closedQuote) cell += character;
    }
    if (cell.length > MAX_CELL_LENGTH) fail(`A cell exceeds the ${MAX_CELL_LENGTH}-character limit.`);
  }
  if (quoted) fail('The CSV has an unclosed quoted value.');
  if (cell.length || row.length || closedQuote) pushRow();

  return normalizeRows(rows, 'csv');
}

function validateXlsxArchive(buffer: Buffer) {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) fail('This is not a valid .xlsx workbook.');
  const searchStart = Math.max(0, buffer.length - 22 - 0xffff);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) fail('The Excel workbook is incomplete or invalid.');

  const diskNumber = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  let offset = buffer.readUInt32LE(eocd + 16);
  if (diskNumber || centralDisk || entryCount > MAX_ZIP_ENTRIES || offset + centralSize > eocd) {
    fail('This workbook uses an unsupported or oversized ZIP structure.');
  }

  let expandedTotal = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) fail('The Excel workbook has an invalid ZIP directory.');
    const flags = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const expandedSize = buffer.readUInt32LE(offset + 24);
    const filenameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const nextOffset = offset + 46 + filenameLength + extraLength + commentLength;
    if (nextOffset > buffer.length || localOffset >= eocd || (flags & 1) !== 0 || expandedSize === 0xffffffff || compressedSize === 0xffffffff) {
      fail('The Excel workbook has an unsupported ZIP entry.');
    }
    const filename = buffer.toString('utf8', offset + 46, offset + 46 + filenameLength).replace(/\\/g, '/').toLowerCase();
    if (/^xl\/(?:externallinks\/|connections\.xml$|querytables\/|vbaproject\.bin$|embeddings\/|drawings\/|activex\/|customui\/)/.test(filename)) {
      fail('Workbooks with macros, external links, embedded files, or drawings are not accepted. Save a values-only workbook and upload again.');
    }
    if (expandedSize > MAX_XLSX_EXPANDED_BYTES || (compressedSize > 0 && expandedSize / compressedSize > 200)) {
      fail('The Excel workbook expands beyond the safe file-size limit.');
    }
    expandedTotal += expandedSize;
    if (expandedTotal > MAX_XLSX_EXPANDED_BYTES) fail('The Excel workbook expands beyond the safe file-size limit.');
    offset = nextOffset;
  }
}

async function parseXlsx(buffer: Buffer): Promise<ParsedImport> {
  validateXlsxArchive(buffer);
  let workbook: ExcelJS.Workbook;
  try {
    workbook = new ExcelJS.Workbook();
    // ExcelJS' declaration uses a legacy Buffer interface; Node 22's generic
    // Buffer is runtime-compatible but fails structural type-checking here.
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    return fail('The Excel workbook could not be read. Save it as a standard .xlsx file and try again.');
  }

  if (workbook.worksheets.length !== 1) fail('Use a workbook with one worksheet containing the data to import.');
  const sheet = workbook.worksheets[0];
  if (sheet.state !== 'visible') fail('The worksheet must be visible.');
  if (sheet.rowCount > MAX_IMPORT_ROWS + 1 || sheet.columnCount > MAX_IMPORT_COLUMNS) {
    fail(`Workbooks can contain up to ${MAX_IMPORT_ROWS} data rows and ${MAX_IMPORT_COLUMNS} columns.`);
  }

  const rows: ImportCell[][] = [];
  sheet.eachRow({ includeEmpty: false }, (worksheetRow) => {
    const row = Array.from({ length: worksheetRow.cellCount }, (_, index) => {
      const value = worksheetRow.getCell(index + 1).value;
      if (value === null || value === undefined) return null;
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      if (typeof value === 'string') return checkCell(value);
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'object') {
        if ('formula' in value || 'sharedFormula' in value) {
          fail('Formula cells are not accepted. Replace formulas with their values and upload again.');
        }
        fail('Rich text, links, and special cell types are not accepted. Use plain values and upload again.');
      }
      return null;
    });
    if (row.some((value) => value !== null && String(value).trim() !== '')) rows.push(row);
    if (rows.length > MAX_IMPORT_ROWS + 1) fail(`Workbooks can contain up to ${MAX_IMPORT_ROWS} data rows.`);
  });
  return normalizeRows(rows, 'xlsx');
}

export async function parseImportFile(buffer: Buffer, filename: string): Promise<ParsedImport> {
  if (!buffer.length) fail('Choose a non-empty file to upload.');
  if (buffer.length > MAX_IMPORT_BYTES) fail('Files must be 2 MB or smaller.');
  const extension = filename.toLowerCase().split('.').pop();
  if (extension === 'csv') return parseCsv(buffer);
  if (extension === 'xlsx') return parseXlsx(buffer);
  return fail('Upload a .csv or .xlsx file.');
}
