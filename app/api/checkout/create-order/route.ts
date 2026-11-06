import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { pricingForCountry } from '@/lib/pricing';
export const runtime = 'nodejs';
const SUPPORTED = new Set(['IN','US','GB','CA','AU','NZ','DE','FR','IE','NL','SG','AE','OTHER']);
export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 });
    const keyId=process.env.RAZORPAY_KEY_ID, keySecret=process.env.RAZORPAY_KEY_SECRET;
    if(!keyId||!keySecret) return NextResponse.json({error:'Online payments are not configured yet.'},{status:503});
    const body=await request.json(), product=getProduct(String(body.slug||'')), country=String(body.country||'IN').toUpperCase();
    if(!product) return NextResponse.json({error:'This product is not available.'},{status:400});
    if(!SUPPORTED.has(country)) return NextResponse.json({error:'Please select a supported country.'},{status:400});
    const market=pricingForCountry(country), amount=Math.round(market.amount*100), auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount,currency:market.currency,receipt:`bps_${Date.now()}`,notes:{product_slug:product.slug,customer_email:customer.email,customer_id:String(customer.id),store:'BizPilot Studio',country,market_amount:String(market.amount)}}),cache:'no-store'});
    const order=await response.json();
    if(!response.ok){console.error('Razorpay order creation failed',order);return NextResponse.json({error:'Razorpay could not create this currency order. Check merchant currency and international-payment settings.'},{status:502});}
    await sql`INSERT INTO customer_orders (customer_id, product_slug, product_name, razorpay_order_id, amount, currency, country, status) VALUES (${customer.id}, ${product.slug}, ${product.name}, ${order.id}, ${amount}, ${market.currency}, ${country}, 'pending')`;
    return NextResponse.json({orderId:order.id,amount:order.amount,currency:order.currency,keyId,productName:product.name,email:customer.email,phone:customer.phone ?? null});
  } catch(error){console.error('Create order error',error);return NextResponse.json({error:'Unable to start checkout.'},{status:500});}
}
