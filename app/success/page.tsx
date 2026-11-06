import Link from 'next/link';
import { CheckCircle2, Download } from 'lucide-react';
import { getCurrentCustomer } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function SuccessPage({searchParams}:{searchParams:Promise<{order?:string}>}) {
 const customer=await getCurrentCustomer(); const {order}=await searchParams;
 return <section className="container page"><div className="successpanel"><CheckCircle2 size={46}/><small>PAYMENT VERIFIED</small><h1>Thank you for your purchase.</h1><p>Your order is saved to your BizPilot Studio account.</p>{customer&&order?<a className="btn primary" href={`/api/download?order=${encodeURIComponent(order)}`}><Download size={17}/> Download your workbook</a>:<p>Sign in to view your purchases and downloads.</p>}<Link href="/account">My account and orders</Link><Link href="/shop">Return to the store</Link></div></section>;
}
