import Link from 'next/link';
import { CheckCircle2, Download, ExternalLink } from 'lucide-react';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getProduct } from '@/lib/products';
export const dynamic = 'force-dynamic';
export default async function SuccessPage({searchParams}:{searchParams:Promise<{order?:string}>}) {
 const customer=await getCurrentCustomer(); const {order}=await searchParams;
 let items:any[]=[];
 if(customer&&order){
   const rows=await sql`SELECT id, product_slug, product_name FROM customer_orders WHERE id=${order} AND customer_id=${customer.id} AND status='paid' LIMIT 1`;
   if(rows[0]){
     const lines=await sql`SELECT product_slug, product_name FROM customer_order_items WHERE order_id=${rows[0].id} ORDER BY created_at`;
     items=lines.length?lines:[{product_slug:rows[0].product_slug,product_name:rows[0].product_name}];
   }
 }
 return <section className="container page"><div className="successpanel"><CheckCircle2 size={46}/><small>PAYMENT VERIFIED</small><h1>Thank you for your purchase.</h1><p>Your order is saved to your BizPilot Studio account.</p>{items.map((item:any)=>{const product=getProduct(String(item.product_slug));if(!product)return null;return product.fulfillment==='online_access'?<Link className="btn primary" href="/tools/business-starter" key={item.product_slug}><ExternalLink size={17}/> Open Business Starter System</Link>:<a className="btn primary" href={`/api/download?order=${encodeURIComponent(order||'')}&slug=${encodeURIComponent(product.slug)}`} key={item.product_slug}><Download size={17}/> Download {product.name}</a>;})}{!items.length&&!customer&&<p>Sign in to view your purchases and downloads.</p>}{!items.length&&customer&&<p>Your payment is being confirmed. View your account in a moment for access.</p>}<Link href="/account">My account and orders</Link><Link href="/shop">Return to the store</Link></div></section>;
}
