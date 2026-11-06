import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { CheckoutContent } from '@/components/checkout-content';
export const dynamic = 'force-dynamic';
export default async function CheckoutPage() { const customer=await getCurrentCustomer(); if(!customer) redirect('/account/login?next=/checkout'); return <CheckoutContent customerName={String(customer.first_name)} />; }
