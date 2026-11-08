import type { Metadata } from 'next';
import { getCurrentCustomer } from '@/lib/auth';
import { hasBusinessStarterAccess } from '@/lib/business-starter';
import { BusinessStarterApp } from '@/components/business-starter-app';

export const metadata: Metadata = { title: 'Business Starter System', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function BusinessStarterPage() {
  const customer = await getCurrentCustomer();
  const paidAccess=customer?await hasBusinessStarterAccess(String(customer.id)):false;
  return <BusinessStarterApp customerName={customer?.first_name || 'there'} trialMode={!paidAccess} />;
}
