import type { Metadata } from 'next';
import { getCurrentCustomer } from '@/lib/auth';
import { hasBusinessStarterAccess } from '@/lib/business-starter';
import { BusinessStarterApp } from '@/components/business-starter-app';
import styles from './business-starter-page.module.css';

export const metadata: Metadata = {
  title: 'Free Business Startup Planner for Small Businesses',
  description: 'Use BizPilot Studio’s guided business starter planner to validate an idea, estimate startup costs, test pricing and break-even, and set practical sales targets.',
  alternates: { canonical: '/tools/business-starter' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Business Starter System | BizPilot Studio',
    description: 'A guided business planner to validate an idea, estimate startup costs, test pricing and break-even, and plan sales targets.',
    url: '/tools/business-starter',
    images: [{ url: '/bizpilot-logo-lockup.png', alt: 'BizPilot Studio Business Starter System' }],
  },
};
export const dynamic = 'force-dynamic';

export default async function BusinessStarterPage() {
  const customer = await getCurrentCustomer();
  const paidAccess=customer?await hasBusinessStarterAccess(String(customer.id)):false;
  return <>
    <section className={`container ${styles.intro}`}>
      <p className={styles.eyebrow}>BIZPILOT STUDIO · BUSINESS PLANNING</p>
      <h2>Plan your business idea with a guided startup planner.</h2>
      <p>Work through business viability, startup costs, pricing, profit margin, break-even and sales targets. The Business Starter System turns your assumptions into a practical plan you can review and refine as your business develops.</p>
      <ul>
        <li>Estimate startup capital and operating costs.</li>
        <li>Test pricing, unit profit and break-even sales.</li>
        <li>Translate profit goals into orders, traffic and advertising targets.</li>
      </ul>
    </section>
    <BusinessStarterApp customerName={customer?.first_name || 'there'} trialMode={!paidAccess} />
  </>;
}
