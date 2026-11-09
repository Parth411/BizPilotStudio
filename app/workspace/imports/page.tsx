import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { listMyBusinesses } from '@/lib/business';
import { ImportWorkflow } from '@/components/imports/import-workflow';
import styles from '../workspace.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Import Business Data',
  robots: { index: false, follow: false },
};

type ImportsPageProps = {
  searchParams: Promise<{ business?: string | string[] }>;
};

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/account/login?next=/workspace/imports');

  const params = await searchParams;
  const requestedId = Array.isArray(params.business) ? params.business[0] : params.business;
  const businesses = await listMyBusinesses();
  const business = requestedId
    ? businesses.find((entry) => entry.businessId === requestedId)
    : businesses.find((entry) => entry.isDefault) ?? businesses[0];
  if (!business) redirect('/workspace');

  return (
    <section className={styles.page}>
      <main className={styles.main}>
        <ImportWorkflow
          businessId={business.businessId}
          businessName={business.name}
          businessCurrency={business.currency}
        />
      </main>
    </section>
  );
}
