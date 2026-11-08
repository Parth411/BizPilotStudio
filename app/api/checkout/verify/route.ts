import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { sendOrderConfirmation } from '@/lib/email';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({error:'Please sign in to verify this purchase.'},{status:401});
    const keyId=process.env.RAZORPAY_KEY_ID,keySecret=process.env.RAZORPAY_KEY_SECRET;
    if(!keyId||!keySecret)return NextResponse.json({error:'Payments are not configured.'},{status:503});
    const body=await request.json(), orderId=String(body.razorpay_order_id||''), paymentId=String(body.razorpay_payment_id||''), signature=String(body.razorpay_signature||'');
    if(!orderId||!paymentId||!signature)return NextResponse.json({error:'Payment details are incomplete.'},{status:400});
    const savedRows=await sql`SELECT id, product_slug, quantity, amount, currency, country, status FROM customer_orders WHERE razorpay_order_id=${orderId} AND customer_id=${customer.id} LIMIT 1`;
    const saved=savedRows[0]; if(!saved)return NextResponse.json({error:'This order does not belong to your account.'},{status:404});
    const expected=createHmac('sha256',keySecret).update(`${orderId}|${paymentId}`).digest(), supplied=Buffer.from(signature,'hex');
    if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))return NextResponse.json({error:'Payment signature could not be verified.'},{status:400});
    if(saved.status==='paid'){
      await sendOrderConfirmation(String(saved.id));
      return NextResponse.json({success:true,orderId:saved.id});
    }
    const savedItems=await sql`SELECT product_slug AS slug, quantity, unit_amount AS "unitAmount" FROM customer_order_items WHERE order_id=${saved.id} ORDER BY product_slug`;
    const itemHash=savedItems.length ? createHash('sha256').update(JSON.stringify(savedItems.map((item:any)=>({slug:String(item.slug),quantity:Number(item.quantity),unitAmount:Number(item.unitAmount)})).sort((a,b)=>a.slug.localeCompare(b.slug)))).digest('hex') : null;
    const itemsTotal=savedItems.reduce((sum:number,item:any)=>sum+Number(item.quantity)*Number(item.unitAmount),0);
    const itemsQuantity=savedItems.reduce((sum:number,item:any)=>sum+Number(item.quantity),0);
    if(savedItems.length&&(itemsTotal!==Number(saved.amount)||itemsQuantity!==Number(saved.quantity)))return NextResponse.json({error:'Stored order items do not match the order total.'},{status:409});
    const auth=Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const [pRes,oRes]=await Promise.all([fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'}),fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'})]);
    const payment=await pRes.json(), order=await oRes.json();
    if(!pRes.ok||!oRes.ok||payment.status!=='captured'||payment.order_id!==orderId||Number(payment.amount)!==Number(saved.amount)||payment.currency!==saved.currency||Number(order.amount)!==Number(saved.amount)||order.currency!==saved.currency||order.notes?.product_slug!==saved.product_slug||order.notes?.customer_id!==String(customer.id)||Number(order.notes?.quantity??1)!==Number(saved.quantity)||(itemHash ? order.notes?.items_hash!==itemHash : false))return NextResponse.json({error:'Payment is not captured or does not match this order.'},{status:402});
    await sql`INSERT INTO customer_payments (order_id, razorpay_payment_id, signature, amount, currency, status) VALUES (${saved.id}, ${paymentId}, ${signature}, ${saved.amount}, ${saved.currency}, 'captured') ON CONFLICT (razorpay_payment_id) DO NOTHING`;
    await sql`UPDATE customer_orders SET status='paid', paid_at=COALESCE(paid_at,NOW()) WHERE id=${saved.id} AND customer_id=${customer.id}`;
    await sendOrderConfirmation(String(saved.id));
    return NextResponse.json({success:true,orderId:saved.id});
  }catch(error){console.error('Payment verification error',error);return NextResponse.json({error:'Could not verify payment. Contact support before paying again.'},{status:500});}
}
