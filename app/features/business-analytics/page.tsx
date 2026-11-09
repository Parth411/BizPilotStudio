import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarRange, TrendingUp } from 'lucide-react';
import styles from '../features.module.css';

export const metadata: Metadata = {
  title: 'Small Business Sales and Expense Analytics | BizPilot Studio',
  description: 'Review imported business transactions with monthly sales and expense totals, sales-minus-expenses summaries, six-month trends and top product, customer and expense lists.',
  alternates: { canonical: '/features/business-analytics' },
  openGraph: {
    type: 'website',
    title: 'Business Analytics for Small Businesses | BizPilot Studio',
    description: 'See imported sales and expense totals, compare months and review six-month trends in your BizPilot business workspace.',
    url: '/features/business-analytics',
    images: [{ url: '/bizpilot-logo-lockup.png', alt: 'BizPilot Studio business analytics' }],
  },
};

const highlights = [
  ['Monthly view', 'Review sales, expenses and the difference between them for a selected month.'],
  ['Six-month trends', 'Compare sales and expenses over time, with totals grouped by currency.'],
  ['Useful breakdowns', 'See leading products or services, customers and expense categories when those fields are present in your imported data.'],
];

export default function BusinessAnalyticsPage() {
  return <main className={`container ${styles.page}`}>
    <Link className={styles.back} href="/">BizPilot Studio · Features</Link>
    <header className={styles.hero}>
      <span className={styles.eyebrow}><BarChart3 size={15}/> BUSINESS ANALYTICS</span>
      <h1>See the shape of your business numbers.</h1>
      <p>Turn confirmed sales and expense records into a monthly overview. Compare periods, follow six-month trends and review the products, customers and categories represented in your data.</p>
      <div className={styles.actions}><Link className="btn primary" href="/workspace/analytics">Open business analytics <ArrowRight size={16}/></Link><Link className="textlink" href="/features/import-business-data">Learn about data imports ↗</Link></div>
    </header>
    <section className={styles.steps} aria-labelledby="analytics-heading">
      <div className={styles.sectionHeading}><small>AT A GLANCE</small><h2 id="analytics-heading">A clearer view, built from your records.</h2></div>
      <div className={styles.stepGrid}>{highlights.map(([title, description], index) => <article key={title}><span>{index === 0 ? <CalendarRange size={20}/> : index === 1 ? <TrendingUp size={20}/> : <BarChart3 size={20}/>}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>
    <section className={styles.note}><strong>Based on your data</strong><p>Analytics totals are calculated from records imported into your workspace. They are grouped by currency and are not accounting, tax or forecasting advice. AI explanations and recommendations are planned for a later Business Analyst milestone.</p></section>
    <aside className={styles.cta}><div><small>START WITH YOUR BUSINESS DATA</small><h2>Import records, then explore your results.</h2><p>Bring in a sales or expense file to populate your analytics view.</p></div><Link className="btn primary" href="/workspace/imports">Import business data <ArrowRight size={16}/></Link></aside>
  </main>;
}
