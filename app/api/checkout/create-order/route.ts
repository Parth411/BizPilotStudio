import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { priceForProduct, pricingForCountry } from '@/lib/pricing';
export const runtime = 'nodejs';
const SUPPORTED = new Set(['IN','US','GB','CA','AU','NZ','DE','FR','IE','NL','SG','AE','OTHER']);
type Item = { slug: string; quantity: number; productName: string; unitAmount: number };

export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 });
    const keyId=process.env.RAZORPAY_KEY_ID, keySecret=process.env.RAZORPAY_KEY_SECRET;
    if(!keyId||!keySecret) return NextResponse.json({error:'Online payments are not configured yet.'},{status:503});
    const body=await request.json();
    const country=String(body.country||'IN').toUpperCase();
    if(!SUPPORTED.has(country)) return NextResponse.json({error:'Please select a supported country.'},{status:400});
    const rawItems = Array.isArray(body.items) ? body.items : [{ slug: body.slug, quantity: body.quantity ?? 1 }];
    if (!rawItems.length || rawItems.length > 10) return NextResponse.json({error:'Your order must contain between 1 and 10 products.'},{status:400});
    const market=pricingForCountry(country);
    const items: Item[]=[];
    const seen=new Set<string>();
    for(const raw of rawItems){
      const slug=String(raw?.slug||''), product=getProduct(slug), quantity=Number(raw?.quantity??1);
      if(!product||seen.has(slug)) return NextResponse.json({error:'One of the selected products is unavailable or duplicated.'},{status:400});
      if(!Number.isSafeInteger(quantity)||quantity<1||quantity>20) return NextResponse.json({error:'Choose a quantity between 1 and 20.'},{status:400});
      seen.add(slug);
      items.push({slug,quantity,productName:product.name,unitAmount:Math.round(priceForProduct(slug,country,product.price)*100)});
    }
    const amount=items.reduce((sum,item)=>sum+item.unitAmount*item.quantity,0);
    if (!Number.isSafeInteger(amount) || amount < 100) return NextResponse.json({error:'The minimum payment amount is ₹1.00 (100 paise).'}, {status:400});
    const itemHash=createHash('sha256').update(JSON.stringify(items.map(({slug,quantity,unitAmount})=>({slug,quantity,unitAmount})).sort((a,b)=>a.slug.localeCompare(b.slug)))).digest('hex');
    const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderName=items.map(item=>item.quantity===1?item.productName:`${item.productName} × ${item.quantity}`).join(' + ');
    const response=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount,currency:market.currency,receipt:`bps_${Date.now()}`,notes:{product_slug:items[0].slug,quantity:String(items.reduce((n,item)=>n+item.quantity,0)),items_hash:itemHash,customer_email:customer.email,customer_id:String(customer.id),store:'BizPilot Studio',country}}),cache:'no-store'});
    const order=await response.json();
    if(!response.ok){console.error('Razorpay order creation failed',order);return NextResponse.json({error:'Razorpay could not create this currency order. Check merchant currency and international-payment settings.'},{status:502});}
    const jsonItems=JSON.stringify(items.map(({slug,quantity,productName,unitAmount})=>({slug,quantity,product_name:productName,unit_amount:unitAmount})));
    await sql`WITH saved AS (
      INSERT INTO customer_orders (customer_id, product_slug, product_name, quantity, razorpay_order_id, amount, currency, country, status)
      VALUES (${customer.id}, ${items[0].slug}, ${orderName}, ${items.reduce((n,item)=>n+item.quantity,0)}, ${order.id}, ${amount}, ${market.currency}, ${country}, 'pending')
      RETURNING id
    )
    INSERT INTO customer_order_items (order_id, product_slug, product_name, quantity, unit_amount)
    SELECT saved.id, item.slug, item.product_name, item.quantity, item.unit_amount
    FROM saved CROSS JOIN jsonb_to_recordset(${jsonItems}::jsonb) AS item(slug text, quantity integer, product_name text, unit_amount integer)`;
    return NextResponse.json({orderId:order.id,amount:order.amount,currency:order.currency,keyId,productName:orderName,email:customer.email});
  } catch(error){console.error('Create order error',error);return NextResponse.json({error:'Unable to start checkout.'},{status:500});}
}
