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
    const rows=await sql`SELECT product_slug FROM customer_orders WHERE id=${orderId} AND customer_id=${customer.id} AND status='paid' LIMIT 1`;
    if(!rows.length)return NextResponse.json({error:'No paid order was found for this download.'},{status:403});
    const file=files[String(rows[0].product_slug)]; if(!file)return NextResponse.json({error:'Download not found.'},{status:404});
    const bytes=await readFile(path.join(process.cwd(),'private','downloads',file.filename));
    return new NextResponse(bytes,{headers:{'Content-Type':file.contentType,'Content-Disposition':`attachment; filename="${file.filename}"`,'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'}});
  }catch(error){console.error('Download delivery error',error);return NextResponse.json({error:'The download is temporarily unavailable.'},{status:500});}
}
