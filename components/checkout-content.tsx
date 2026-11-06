'use client';
import Link from 'next/link';
import { ShieldCheck, Download, ArrowLeft } from 'lucide-react';
import { useCurrency } from '@/components/currency-provider';
import { getProduct } from '@/lib/products';
import { RazorpayCheckout } from '@/components/razorpay-checkout';
export function CheckoutContent({ customerName }: { customerName: string }) {
 const product=getProduct('small-business-management-workbook')!; const {price,country,currency}=useCurrency();
 return <section className="container page"><div className="intro"><small>SECURE CHECKOUT</small><h1>Complete your purchase.</h1><p>Signed in as {customerName}. Your purchase and download will be saved to your account.</p></div><div className="checkoutlayout"><div className="summary"><h3>Order details</h3><div className="checkoutproduct"><div><b>{product.name}</b><small>{product.format} · Digital product</small></div><strong>{price(product.price)}</strong></div><hr/><p><span>Subtotal</span><b>{price(product.price)}</b></p><p><span>Digital delivery</span><b>Free</b></p><h2>Total <b>{price(product.price)}</b></h2><div className="checkoutassurance"><span><ShieldCheck size={16}/> Market: {country} · {currency}</span><span><Download size={16}/> Secure download after payment verification</span></div></div><div className="summary"><h3>Payment</h3><p className="paymentnotice">Payments are processed securely by Razorpay. BizPilot Studio does not store card or banking details.</p><RazorpayCheckout country={country} priceLabel={price(product.price)}/><p className="checkoutterms">Use Razorpay Test Mode while testing. Enable live payments only after merchant and website verification.</p><Link className="back" href="/cart"><ArrowLeft size={14}/> Back to cart</Link></div></div></section>;
}
