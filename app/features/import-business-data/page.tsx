import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import styles from '../features.module.css';

export const metadata: Metadata = {
  title: 'Import Sales and Expense Data | BizPilot Studio',
  description: 'Bring sales and expense records into your BizPilot workspace. Import a CSV or Excel file, map columns, review the preview and confirm records before adding them.',
  alternates: { canonical: '/features/import-business-data' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Import Business Data | BizPilot Studio',
    description: 'Import CSV or Excel sales and expense records, map columns and review them before adding them to your business workspace.',
    url: '/features/import-business-data',
    images: [{ url: '/bizpilot-logo-lockup.png', alt: 'BizPilot Studio business data import' }],
  },
};

const steps = [
  ['01', 'Choose a file', 'Upload a CSV or .xlsx file with a header row and values-only data.'],
  ['02', 'Match your columns', 'Map the fields in your file to the business record fields.'],
  ['03', 'Review, then confirm', 'Check the preview and confirm the records you want to add.'],
];

export default function ImportBusinessDataPage() {
  return <main className={`container ${styles.page}`}>
    <Link className={styles.back} href="/">BizPilot Studio · Features</Link>
    <header className={styles.hero}>
      <span className={styles.eyebrow}><FileSpreadsheet size={15}/> BUSINESS DATA IMPORTS</span>
      <h1>Bring your business records together.</h1>
      <p>Move sales and expense data from a spreadsheet into your BizPilot workspace. Import a file, map its columns and review the rows before confirming them.</p>
      <div className={styles.actions}><Link className="btn primary" href="/workspace/imports">Open data imports <ArrowRight size={16}/></Link><a className="textlink" href="/templates/bizpilot-import-template.xlsx" download>Download Excel template ↓</a><Link className="textlink" href="/features/business-analytics">See business analytics ↗</Link></div>
    </header>
    <section className={styles.steps} aria-labelledby="steps-heading">
      <div className={styles.sectionHeading}><small>HOW IT WORKS</small><h2 id="steps-heading">A clear review before data is added.</h2></div>
      <div className={styles.stepGrid}>{steps.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>
    <section className={styles.detailGrid}>
      <article><CheckCircle2/><h2>Designed for practical imports</h2><p>Use CSV or Excel files with up to 500 data rows per import. The import flow checks headers and supported values, then lets you map fields and review the result.</p></article>
      <article><ShieldCheck/><h2>You stay in control</h2><p>Uploads are limited to your signed-in business workspace. Preview your mapped records and confirm the import before they are added to your business data.</p></article>
    </section>
    <aside className={styles.cta}><div><small>READY WHEN YOU ARE</small><h2>Start with a spreadsheet you already have.</h2><p>Sign in to choose a business and begin an import.</p></div><Link className="btn primary" href="/workspace/imports">Go to your workspace <ArrowRight size={16}/></Link></aside>
  </main>;
}
