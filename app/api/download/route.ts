import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
export const runtime = 'nodejs';
const files: Record<string,{filename:string;contentType:string}> = {'small-business-management-workbook':{filename:'BizPilot_Product_Package.zip',contentType:'application/zip'}};
export async function GET(request:NextRequest){
  try{
    const customer=await getCurrentCustomer(); if(!customer)return NextResponse.json({error:'Sign in to access your purchases.'},{status:401});
    const orderId=request.nextUrl.searchParams.get('order')||'';
    const requestedSlug=request.nextUrl.searchParams.get('slug')||'';
    const rows=await sql`SELECT EXISTS (SELECT 1 FROM customer_orders o LEFT JOIN customer_order_items i ON i.order_id=o.id WHERE o.id=${orderId} AND o.customer_id=${customer.id} AND o.status='paid' AND ((i.product_slug=${requestedSlug} AND i.product_slug='small-business-management-workbook') OR (i.order_id IS NULL AND o.product_slug='small-business-management-workbook'))) AS allowed`;
    if(!rows[0]?.allowed)return NextResponse.json({error:'No paid order was found for this download.'},{status:403});
    const file=files[requestedSlug||'small-business-management-workbook']; if(!file)return NextResponse.json({error:'Download not found.'},{status:404});
    const bytes=await readFile(path.join(process.cwd(),'private','downloads',file.filename));
    return new NextResponse(bytes,{headers:{'Content-Type':file.contentType,'Content-Disposition':`attachment; filename="${file.filename}"`,'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'}});
  }catch(error){console.error('Download delivery error',error);return NextResponse.json({error:'The download is temporarily unavailable.'},{status:500});}
}
