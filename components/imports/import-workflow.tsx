'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import type { ImportField, ImportMapping } from '@/lib/imports/mapping';
import styles from './import-workflow.module.css';

type Preview = {
  importId: string;
  filename: string;
  headers: string[];
  sampleRows: (string | number | boolean | null)[][];
  rowCount: number;
  suggestions: ImportMapping;
};

type ImportHistoryRow = {
  id: string;
  filename: string;
  format: string;
  status: string;
  importedRecords: number;
  createdAt: string;
  completedAt: string | null;
};

const columnFields: { field: ImportField; label: string }[] = [
  { field: 'date', label: 'Transaction date' },
  { field: 'amount', label: 'Single amount column' },
  { field: 'type', label: 'Transaction type (optional)' },
  { field: 'salesAmount', label: 'Sales amount column' },
  { field: 'expenseAmount', label: 'Expense amount column' },
  { field: 'currency', label: 'Currency code (optional)' },
  { field: 'description', label: 'Description (optional)' },
  { field: 'category', label: 'Category (optional)' },
  { field: 'customerName', label: 'Customer name (optional)' },
  { field: 'productName', label: 'Product or service (optional)' },
  { field: 'quantity', label: 'Quantity (optional)' },
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

export function ImportWorkflow({ businessId, businessName, businessCurrency }: {
  businessId: string;
  businessName: string;
  businessCurrency: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [defaultCurrency, setDefaultCurrency] = useState(businessCurrency || '');
  const [defaultType, setDefaultType] = useState<'sale' | 'expense'>('sale');
  const [dateFormat, setDateFormat] = useState<'iso' | 'mdy' | 'dmy'>('iso');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<ImportHistoryRow[]>([]);
  const [historyError, setHistoryError] = useState('');

  const hasSplitAmounts = mapping.salesAmount != null || mapping.expenseAmount != null;
  const canConfirm = useMemo(() => !!preview && !busy, [preview, busy]);

  async function loadHistory() {
    try {
      const response = await fetch(`/api/imports?business=${encodeURIComponent(businessId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load import history.');
      setHistory(data.imports || []);
      setHistoryError('');
    } catch (loadError) {
      setHistoryError(loadError instanceof Error ? loadError.message : 'Could not load import history.');
    }
  }

  useEffect(() => { void loadHistory(); }, [businessId]);

  async function uploadFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    setPreview(null);
    const formData = new FormData();
    formData.set('file', file);
    formData.set('businessId', businessId);
    try {
      const response = await fetch('/api/imports/preview', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not preview this file.');
      setPreview(data);
      setMapping(data.suggestions || {});
      setDefaultCurrency((current) => current || businessCurrency || '');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not preview this file.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!preview || busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/imports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, importId: preview.importId, mapping, defaultCurrency, defaultType, dateFormat }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not confirm this import.');
      setSuccess(`${data.importedRecords} transaction records were added to ${businessName}.`);
      setPreview(null);
      setFile(null);
      await loadHistory();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Could not confirm this import.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} href={`/workspace?business=${encodeURIComponent(businessId)}`}><ArrowLeft size={15} /> Back to overview</Link>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>BUSINESS DATA</p><h1>Import transactions</h1><p>Upload a sales or expense file for <strong>{businessName}</strong>. Review the columns before anything is saved as a transaction.</p></div>
        <span className={styles.headerIcon}><FileSpreadsheet size={22} /></span>
      </header>

      {success && <div className={styles.success} role="status"><CheckCircle2 size={18} />{success}</div>}
      {error && <div className={styles.error} role="alert">{error}</div>}

      <section className={styles.panel} aria-labelledby="upload-heading">
        <div className={styles.panelHeading}><span className={styles.step}>1</span><div><h2 id="upload-heading">Choose a file</h2><p>CSV or XLSX · up to 2 MB · 500 data rows · one worksheet</p></div></div>
        <form className={styles.uploadForm} onSubmit={uploadFile}>
          <label className={styles.filePicker}>
            <Upload size={19} />
            <span>{file ? file.name : 'Choose a .csv or .xlsx file'}</span>
            <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button className={styles.primaryButton} type="submit" disabled={!file || busy}>{busy ? <><LoaderCircle className={styles.spin} size={15} /> Working…</> : 'Preview file'}</button>
        </form>
        <p className={styles.privacyNote}>The original file is not retained. The private preview expires after 24 hours and is deleted after confirmation or by the daily cleanup.</p>
      </section>

      {preview && (
        <section className={styles.panel} aria-labelledby="mapping-heading">
          <div className={styles.panelHeading}><span className={styles.step}>2</span><div><h2 id="mapping-heading">Review and map columns</h2><p>{preview.rowCount} data rows found in {preview.filename}. Check the suggested columns and correct them where needed.</p></div></div>
          <div className={styles.mappingGrid}>
            {columnFields.map(({ field, label }) => {
              const hidden = (field === 'amount' && hasSplitAmounts) || ((field === 'salesAmount' || field === 'expenseAmount') && mapping.amount != null);
              if (hidden || (field === 'type' && hasSplitAmounts)) return null;
              return (
                <label key={field}>
                  <span>{label}</span>
                  <select value={mapping[field] ?? ''} onChange={(event) => {
                    const value = event.target.value === '' ? null : Number(event.target.value);
                    setMapping((current) => {
                      const next: ImportMapping = { ...current, [field]: value };
                      if (field === 'amount' && value !== null) {
                        next.salesAmount = null;
                        next.expenseAmount = null;
                      } else if ((field === 'salesAmount' || field === 'expenseAmount') && value !== null) {
                        next.amount = null;
                        next.type = null;
                      }
                      return next;
                    });
                  }}>
                    <option value="">Not mapped</option>
                    {preview.headers.map((header, index) => <option key={`${index}-${header}`} value={index}>{header}</option>)}
                  </select>
                </label>
              );
            })}
            <label><span>Default currency code</span><input value={defaultCurrency} onChange={(event) => setDefaultCurrency(event.target.value.toUpperCase().slice(0, 3))} placeholder="e.g. INR" maxLength={3} autoComplete="off" /></label>
            <label><span>Untyped amount means</span><select value={defaultType} onChange={(event) => setDefaultType(event.target.value as 'sale' | 'expense')}><option value="sale">Sales / revenue</option><option value="expense">Expense / cost</option></select></label>
            <label><span>Date format</span><select value={dateFormat} onChange={(event) => setDateFormat(event.target.value as 'iso' | 'mdy' | 'dmy')}><option value="iso">YYYY-MM-DD</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label>
          </div>
          <div className={styles.tableWrap}>
            <table><thead><tr>{preview.headers.map((header, index) => <th key={`${index}-${header}`}>{header}</th>)}</tr></thead><tbody>{preview.sampleRows.map((row, rowIndex) => <tr key={rowIndex}>{preview.headers.map((_, columnIndex) => <td key={columnIndex}>{row[columnIndex] == null ? '—' : String(row[columnIndex])}</td>)}</tr>)}</tbody></table>
          </div>
          <div className={styles.confirmRow}><p>Formula cells and invalid values are rejected. Only confirmed rows are added to this business.</p><button className={styles.primaryButton} type="button" onClick={confirmImport} disabled={!canConfirm}>{busy ? <><LoaderCircle className={styles.spin} size={15} /> Importing…</> : 'Confirm import'}</button></div>
        </section>
      )}

      <section className={styles.panel} aria-labelledby="history-heading">
        <div className={styles.panelHeading}><span className={styles.step}>3</span><div><h2 id="history-heading">Import history</h2><p>Recent imports for this business.</p></div></div>
        {historyError ? <p className={styles.historyError}>{historyError}</p> : history.length ? (
          <div className={styles.historyList}>{history.map((item) => <article key={item.id}><span className={styles.historyIcon}><FileSpreadsheet size={16} /></span><span className={styles.historyText}><strong>{item.filename}</strong><small>{item.format.toUpperCase()} · {dateLabel(item.createdAt)}</small></span><span className={`${styles.status} ${item.status === 'completed' ? styles.statusDone : ''}`}>{item.status === 'completed' ? `${item.importedRecords} records` : 'Preview saved'}</span></article>)}</div>
        ) : <p className={styles.emptyHistory}>No imports yet. Choose a file above to get started.</p>}
      </section>
    </div>
  );
}
