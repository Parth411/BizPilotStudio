import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { SignOutButton } from '@/components/sign-out-button';
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/account/login?next=/account');
  const orders = await sql`SELECT id, product_name, product_slug, amount, currency, status, created_at FROM customer_orders WHERE customer_id = ${customer.id} ORDER BY created_at DESC LIMIT 50`;
  return <section className="container page"><div className="intro"><small>MY ACCOUNT</small><h1>Welcome, {customer.first_name}.</h1><p>{customer.email}</p></div><div className="summary"><h2>Your orders</h2>{orders.length ? orders.map((order: any) => <div className="checkoutproduct" key={order.id}><div><b>{order.product_name}</b><small>{new Date(order.created_at).toLocaleDateString()} · {order.status}</small></div><div>{(Number(order.amount)/100).toFixed(2)} {order.currency}{order.status === 'paid' && <p><a className="btn primary" href={`/api/download?order=${encodeURIComponent(order.id)}`}>Download</a></p>}</div></div>) : <p>You have not placed an order yet. <Link href="/shop">Browse the shop</Link>.</p>}<SignOutButton /></div></section>;
}
