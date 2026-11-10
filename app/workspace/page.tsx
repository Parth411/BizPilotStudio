import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CircleHelp,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  Settings2,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { getCurrentCustomer } from '@/lib/auth';
import { listMyBusinesses } from '@/lib/business';
import { sql } from '@/lib/db';
import styles from './workspace.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Business Workspace',
  robots: { index: false, follow: false },
};

type WorkspacePageProps = {
  searchParams: Promise<{ business?: string | string[]; period?: string | string[] }>;
};

const upcomingSections = [
  { label: 'AI Business Analyst', icon: Sparkles },
  { label: 'Customers & CRM', icon: UsersRound },
  { label: 'Sales & Orders', icon: CreditCard },
  { label: 'Products & Inventory', icon: Package },
  { label: 'Invoices & Expenses', icon: FileSpreadsheet },
  { label: 'Business Settings', icon: Settings2 },
];

function displayValue(value: string | null) {
  return value || 'Not set yet';
}

function money(value: number | string, currency: string) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: currency.trim(), maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.trim()}`;
  }
}

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/account/login?next=/workspace');

  const params = await searchParams;
  const requestedId = Array.isArray(params.business) ? params.business[0] : params.business;
  const requestedPeriod = Array.isArray(params.period) ? params.period[0] : params.period;
  const period = requestedPeriod === 'all' ? 'all' : 'month';
  const businesses = await listMyBusinesses();
  if (!businesses.length) {
    return (
      <section className={styles.page}>
        <div className={styles.emptyState}>
          <span className={styles.iconBadge}><BriefcaseBusiness size={20} /></span>
          <p className={styles.eyebrow}>BIZPILOT STUDIO WORKSPACE</p>
          <h1>Your business workspace is being set up</h1>
          <p>We couldn’t find an active business for this account. Please refresh in a moment or contact support if this continues.</p>
          <Link className={styles.secondaryButton} href="/account">Go to My Account <ArrowRight size={15} /></Link>
        </div>
      </section>
    );
  }

  const selected = requestedId
    ? businesses.find((business) => business.businessId === requestedId)
    : businesses.find((business) => business.isDefault) ?? businesses[0];
  if (!selected) redirect('/workspace');

  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  const rangeStart = period === 'all' ? '0001-01-01' : monthStart;
  const rangeEnd = period === 'all' ? '9999-12-31' : nextMonth;
  const [monthlyTotals, customerRows] = await Promise.all([
    sql`
      SELECT currency,
        COALESCE(SUM(amount) FILTER (WHERE record_type = 'sale'), 0) AS sales,
        COALESCE(SUM(amount) FILTER (WHERE record_type = 'expense'), 0) AS expenses,
        COUNT(*) AS records
      FROM business_transactions
      WHERE business_id = ${selected.businessId}
        AND transaction_date >= ${rangeStart}::date
        AND transaction_date < ${rangeEnd}::date
      GROUP BY currency
      ORDER BY currency
    `,
    sql`
      SELECT COUNT(DISTINCT NULLIF(BTRIM(customer_name), '')) AS customers
      FROM business_transactions
      WHERE business_id = ${selected.businessId}
        AND record_type = 'sale'
        AND transaction_date >= ${rangeStart}::date
        AND transaction_date < ${rangeEnd}::date
    `,
  ]);
  const hasPeriodData = monthlyTotals.length > 0;
  const salesValue = hasPeriodData
    ? monthlyTotals.map((row: any) => money(row.sales, String(row.currency))).join(' · ')
    : `No records ${period === 'all' ? 'yet' : 'this month'}`;
  const expensesValue = hasPeriodData
    ? monthlyTotals.map((row: any) => money(row.expenses, String(row.currency))).join(' · ')
    : `No records ${period === 'all' ? 'yet' : 'this month'}`;
  const customerCount = Number((customerRows[0] as any)?.customers || 0);

  return (
    <section className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Business workspace navigation">
          <div className={styles.brandBlock}>
            <span className={styles.brandMark}><LayoutDashboard size={17} /></span>
            <span><strong>BUSINESS WORKSPACE</strong><small>BizPilot Studio</small></span>
          </div>
          <nav className={styles.navigation} aria-label="Workspace sections">
            <Link className={`${styles.navItem} ${styles.active}`} href={`/workspace?business=${selected.businessId}`} aria-current="page">
              <LayoutDashboard size={17} /> Overview
            </Link>
            <Link className={styles.navItem} href={`/workspace/imports?business=${selected.businessId}`}>
              <FileSpreadsheet size={17} /> Imports
            </Link>
            <Link className={styles.navItem} href={`/workspace/analytics?business=${selected.businessId}`}>
              <BarChart3 size={17} /> Analytics
            </Link>
            {upcomingSections.map(({ label, icon: Icon }) => (
              <span className={styles.navItemDisabled} key={label} aria-disabled="true" title="This workspace section is coming soon">
                <Icon size={17} /> <span>{label}</span><small>Soon</small>
              </span>
            ))}
            <Link className={styles.navItem} href="/account"><Package size={17} /> My Product Library</Link>
          </nav>
          <div className={styles.sidebarFooter}>
            <Link href="/faq"><CircleHelp size={16} /> Help & Support</Link>
            <span>{customer.first_name} {customer.last_name}</span>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>YOUR BUSINESS, AT A GLANCE</p>
              <h1>Welcome, {customer.first_name}.</h1>
              <p className={styles.subtitle}>A current view of imported business activity and insights.</p>
            </div>
            <form className={styles.businessPicker} action="/workspace" method="get">
              <label htmlFor="business-picker">Active business</label>
              <div>
                <select id="business-picker" name="business" defaultValue={selected.businessId}>
                  {businesses.map((business) => (
                    <option key={business.businessId} value={business.businessId}>{business.name}</option>
                  ))}
                </select>
                <button type="submit">Open</button>
              </div>
            </form>
          </header>

          <section className={styles.businessCard} aria-labelledby="business-heading">
            <div className={styles.businessIdentity}>
              <span className={styles.businessIcon}><BriefcaseBusiness size={21} /></span>
              <div>
                <p className={styles.eyebrow}>ACTIVE BUSINESS</p>
                <h2 id="business-heading">{selected.name}</h2>
                <span className={styles.roleBadge}>{selected.role}</span>
              </div>
            </div>
            <dl className={styles.businessDetails}>
              <div><dt>Business type</dt><dd>{selected.businessType.replaceAll('_', ' ')}</dd></div>
              <div><dt>Country</dt><dd>{displayValue(selected.country)}</dd></div>
              <div><dt>Currency</dt><dd>{displayValue(selected.currency)}</dd></div>
              <div><dt>Time zone</dt><dd>{selected.timezone}</dd></div>
            </dl>
          </section>

          <div className={styles.snapshotHeader}><div><p className={styles.eyebrow}>BUSINESS SNAPSHOT</p><span>See confirmed records for a period</span></div><nav className={styles.periodToggle} aria-label="Choose summary period"><Link href={`/workspace?business=${selected.businessId}&period=month`} aria-current={period === 'month' ? 'page' : undefined} className={period === 'month' ? styles.periodActive : undefined}>This month</Link><Link href={`/workspace?business=${selected.businessId}&period=all`} aria-current={period === 'all' ? 'page' : undefined} className={period === 'all' ? styles.periodActive : undefined}>All time</Link></nav></div>
          <section className={styles.metrics} aria-label="Business data summary">
            <article><span>SALES · {period === 'all' ? 'ALL TIME' : 'THIS MONTH'}</span><strong className={styles.metricValue}>{salesValue}</strong><small>{hasPeriodData ? 'From confirmed imported records' : 'Import a sales file to see your total'}</small></article>
            <article><span>EXPENSES · {period === 'all' ? 'ALL TIME' : 'THIS MONTH'}</span><strong className={styles.metricValue}>{expensesValue}</strong><small>{hasPeriodData ? 'From confirmed imported records' : 'Import an expense file to see your total'}</small></article>
            <article><span>CUSTOMERS · {period === 'all' ? 'ALL TIME' : 'THIS MONTH'}</span><strong>{hasPeriodData ? customerCount : '—'}</strong><small>{hasPeriodData ? 'Distinct customer names in sales records' : 'Customer names appear after importing sales'}</small></article>
          </section>

          <section className={styles.nextStep}>
            <div className={styles.nextIcon}><FileSpreadsheet size={19} /></div>
            <div>
              <p className={styles.eyebrow}>NEXT STEP</p>
              <h2>Bring your business numbers together</h2>
              <p>Import a sales or expense file to start building business reports. Your existing digital products and planner remain available too.</p>
              <div className={styles.actions}>
                <Link className={styles.primaryButton} href={`/workspace/imports?business=${selected.businessId}`}>Import business data <ArrowRight size={15} /></Link>
                <Link className={styles.textLink} href="/tools/business-starter">Open Business Starter</Link>
                <Link className={styles.textLink} href="/account">View product library</Link>
              </div>
            </div>
          </section>
          <p className={styles.note}>Signed in as {customer.email} · This business is available to you as {selected.role}.</p>
        </main>
      </div>
    </section>
  );
}
