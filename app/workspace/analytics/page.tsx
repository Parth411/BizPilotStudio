import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, BarChart3, FileSpreadsheet, Sparkles } from 'lucide-react';
import { getCurrentCustomer } from '@/lib/auth';
import { listMyBusinesses } from '@/lib/business';
import { sql } from '@/lib/db';
import styles from './analytics.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Business Analytics', robots: { index: false, follow: false } };

type AnalyticsPageProps = {
  searchParams: Promise<{ business?: string | string[]; month?: string | string[] }>;
};

function monthDate(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10);
}

function monthLabel(month: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
}

function money(value: number | string, currency: string) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: currency.trim(), maximumFractionDigits: 4 }).format(Number(value || 0));
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency.trim()}`;
  }
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 'No change' : 'New this month';
  const percent = ((current - previous) / previous) * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}% vs previous month`;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/account/login?next=/workspace/analytics');

  const params = await searchParams;
  const requestedBusiness = Array.isArray(params.business) ? params.business[0] : params.business;
  const requestedMonth = Array.isArray(params.month) ? params.month[0] : params.month;
  const businesses = await listMyBusinesses();
  const business = requestedBusiness
    ? businesses.find((entry) => entry.businessId === requestedBusiness)
    : businesses.find((entry) => entry.isDefault) ?? businesses[0];
  if (!business) redirect('/workspace');

  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth || '') ? requestedMonth! : defaultMonth;
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStart = monthDate(year, month - 1);
  const monthEnd = monthDate(year, month);
  const previousStart = monthDate(year, month - 2);
  const trendStart = monthDate(year, month - 6);
  const trendMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 6 + index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  });

  const [summary, previous, trends, products, customers, categories] = await Promise.all([
    sql`
      SELECT currency,
        COALESCE(SUM(amount) FILTER (WHERE record_type = 'sale'), 0) AS revenue,
        COALESCE(SUM(amount) FILTER (WHERE record_type = 'expense'), 0) AS expenses,
        COUNT(*) AS transaction_count
      FROM business_transactions
      WHERE business_id = ${business.businessId}
        AND transaction_date >= ${monthStart}::date
        AND transaction_date < ${monthEnd}::date
      GROUP BY currency ORDER BY currency
    `,
    sql`
      SELECT currency,
        COALESCE(SUM(amount) FILTER (WHERE record_type = 'sale'), 0) AS revenue,
        COALESCE(SUM(amount) FILTER (WHERE record_type = 'expense'), 0) AS expenses
      FROM business_transactions
      WHERE business_id = ${business.businessId}
        AND transaction_date >= ${previousStart}::date
        AND transaction_date < ${monthStart}::date
      GROUP BY currency ORDER BY currency
    `,
    sql`
      SELECT to_char(date_trunc('month', transaction_date), 'YYYY-MM') AS month,
             currency,
             COALESCE(SUM(amount) FILTER (WHERE record_type = 'sale'), 0) AS revenue,
             COALESCE(SUM(amount) FILTER (WHERE record_type = 'expense'), 0) AS expenses
      FROM business_transactions
      WHERE business_id = ${business.businessId}
        AND transaction_date >= ${trendStart}::date
        AND transaction_date < ${monthEnd}::date
      GROUP BY 1, currency ORDER BY 1, currency
    `,
    sql`
      WITH totals AS (
        SELECT currency, COALESCE(NULLIF(product_name, ''), NULLIF(description, ''), 'Unlabelled') AS label,
               SUM(amount) AS total
        FROM business_transactions
        WHERE business_id = ${business.businessId}
          AND record_type = 'sale'
          AND transaction_date >= ${monthStart}::date
          AND transaction_date < ${monthEnd}::date
        GROUP BY currency, 2
      ), ranked AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY currency ORDER BY total DESC, label ASC) AS rank
        FROM totals
      ) SELECT currency, label, total, rank FROM ranked WHERE rank <= 5 ORDER BY currency, rank
    `,
    sql`
      WITH totals AS (
        SELECT currency, COALESCE(NULLIF(customer_name, ''), 'Unlabelled') AS label,
               SUM(amount) AS total
        FROM business_transactions
        WHERE business_id = ${business.businessId}
          AND record_type = 'sale'
          AND transaction_date >= ${monthStart}::date
          AND transaction_date < ${monthEnd}::date
        GROUP BY currency, 2
      ), ranked AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY currency ORDER BY total DESC, label ASC) AS rank
        FROM totals
      ) SELECT currency, label, total, rank FROM ranked WHERE rank <= 5 ORDER BY currency, rank
    `,
    sql`
      WITH totals AS (
        SELECT currency, COALESCE(NULLIF(category, ''), 'Uncategorised') AS label,
               SUM(amount) AS total
        FROM business_transactions
        WHERE business_id = ${business.businessId}
          AND record_type = 'expense'
          AND transaction_date >= ${monthStart}::date
          AND transaction_date < ${monthEnd}::date
        GROUP BY currency, 2
      ), ranked AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY currency ORDER BY total DESC, label ASC) AS rank
        FROM totals
      ) SELECT currency, label, total, rank FROM ranked WHERE rank <= 5 ORDER BY currency, rank
    `,
  ]);

  const previousByCurrency = new Map(previous.map((row: any) => [String(row.currency).trim(), row]));
  const currencies = Array.from(new Set([
    ...summary.map((row: any) => String(row.currency).trim()),
    ...trends.map((row: any) => String(row.currency).trim()),
  ])).sort();
  const trendLookup = new Map(trends.map((row: any) => [`${row.month}:${String(row.currency).trim()}`, row]));
  const datasets = currencies.map((currency) => {
    const current = summary.find((row: any) => String(row.currency).trim() === currency);
    const prior = previousByCurrency.get(currency) as any;
    const revenue = Number(current?.revenue || 0);
    const expenses = Number(current?.expenses || 0);
    return {
      currency,
      revenue,
      expenses,
      profit: revenue - expenses,
      transactionCount: Number(current?.transaction_count || 0),
      change: percentChange(revenue, Number(prior?.revenue || 0)),
    };
  });
  const topRows = (rows: any[]) => rows.map((row) => ({
    currency: String(row.currency).trim(),
    label: String(row.label),
    total: Number(row.total || 0),
    rank: Number(row.rank),
  }));
  const productRows = topRows(products);
  const customerRows = topRows(customers);
  const categoryRows = topRows(categories);

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href={`/workspace?business=${business.businessId}`}><ArrowLeft size={15} /> Business workspace</Link>
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>BUSINESS PERFORMANCE</p><h1>Analytics</h1><p>Deterministic totals calculated from confirmed transactions for <strong>{business.name}</strong>.</p></div>
          <form className={styles.periodForm} action="/workspace/analytics" method="get">
            <input type="hidden" name="business" value={business.businessId} />
            <label htmlFor="analytics-month">Reporting month</label>
            <input id="analytics-month" type="month" name="month" defaultValue={selectedMonth} />
            <button type="submit">Apply</button>
          </form>
        </header>

        {!currencies.length ? (
          <section className={styles.empty}>
            <span><BarChart3 size={22} /></span><h2>No transactions for {monthLabel(selectedMonth)}</h2>
            <p>Import a sales or expense file to see verified totals and trends here.</p>
            <Link className={styles.button} href={`/workspace/imports?business=${business.businessId}`}><FileSpreadsheet size={15} /> Import business data</Link>
          </section>
        ) : (
          <>
            <section className={styles.currencyGrid} aria-label="Monthly totals by currency">
              {datasets.map((item) => (
                <article className={styles.currencyCard} key={item.currency}>
                  <div className={styles.cardTitle}><span>{item.currency}</span><small>{item.transactionCount} transactions</small></div>
                  <div className={styles.kpis}>
                    <div><small>SALES</small><strong>{money(item.revenue, item.currency)}</strong><span>{item.change}</span></div>
                    <div><small>EXPENSES</small><strong>{money(item.expenses, item.currency)}</strong><span>Recorded this month</span></div>
                    <div><small>SALES LESS EXPENSES</small><strong>{money(item.profit, item.currency)}</strong><span>Simple operating difference</span></div>
                  </div>
                </article>
              ))}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}><div><p className={styles.eyebrow}>LAST SIX MONTHS</p><h2>Sales and expenses</h2></div><span className={styles.calculationNote}>Totals are grouped by currency</span></div>
              {currencies.map((currency) => {
                const values = trendMonths.map((monthKey) => {
                  const value: any = trendLookup.get(`${monthKey}:${currency}`);
                  return { month: monthKey, revenue: Number(value?.revenue || 0), expenses: Number(value?.expenses || 0) };
                });
                const maxValue = Math.max(1, ...values.flatMap((value) => [value.revenue, value.expenses]));
                return <div className={styles.chartGroup} key={currency}>
                  <h3>{currency}</h3>
                  <div className={styles.chart} aria-label={`${currency} sales and expenses for six months`}>
                    {values.map((value) => <div className={styles.chartColumn} key={value.month}>
                      <div className={styles.bars}>
                        <span className={styles.revenueBar} title={`Sales ${money(value.revenue, currency)}`} style={{ height: `${Math.max(value.revenue > 0 ? 3 : 0, value.revenue / maxValue * 100)}%` }} />
                        <span className={styles.expenseBar} title={`Expenses ${money(value.expenses, currency)}`} style={{ height: `${Math.max(value.expenses > 0 ? 3 : 0, value.expenses / maxValue * 100)}%` }} />
                      </div><small>{monthLabel(value.month)}</small>
                    </div>)}
                  </div>
                </div>;
              })}
              <div className={styles.legend}><span><i className={styles.revenueSwatch} />Sales</span><span><i className={styles.expenseSwatch} />Expenses</span></div>
            </section>

            <section className={styles.rankGrid}>
              <RankPanel title="Top products & services" subtitle="Sales in the selected month" rows={productRows} empty="No product details were mapped." />
              <RankPanel title="Top customers" subtitle="Sales in the selected month" rows={customerRows} empty="No customer names were mapped." />
              <RankPanel title="Expense categories" subtitle="Expenses in the selected month" rows={categoryRows} empty="No expense categories were mapped." />
            </section>
          </>
        )}

        <p className={styles.note}><Sparkles size={14} /> These totals come from imported records. AI explanations and recommendations will be added in the Business Analyst milestone.</p>
      </div>
    </section>
  );
}

function RankPanel({ title, subtitle, rows, empty }: { title: string; subtitle: string; rows: { currency: string; label: string; total: number; rank: number }[]; empty: string }) {
  return <section className={styles.rankPanel}><div><h2>{title}</h2><p>{subtitle}</p></div>{rows.length ? <ol>{rows.map((row) => <li key={`${row.currency}:${row.label}`}><span className={styles.rank}>{row.rank}</span><span className={styles.rankText}><strong>{row.label}</strong><small>{row.currency}</small></span><b>{money(row.total, row.currency)}</b></li>)}</ol> : <p className={styles.rankEmpty}>{empty}</p>}</section>;
}
