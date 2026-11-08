'use client';
import Link from 'next/link';
import { ShieldCheck, Download, ArrowLeft } from 'lucide-react';
import { useCurrency } from '@/components/currency-provider';
import { RazorpayCheckout } from '@/components/razorpay-checkout';
import { useCart } from '@/components/cart-provider';
import { ArrowRight, LoaderCircle, ShoppingBag } from 'lucide-react';
export function CheckoutContent({ customerName }: { customerName: string }) {
 const {priceProducts,country,currency}=useCurrency();
 const {lines,count,ready}=useCart();
 if(!ready)return <section className="container page"><div className="intro"><small>SECURE CHECKOUT</small><h1>Preparing your checkout.</h1><p>Loading your saved cart…</p></div><div className="checkout-loading" role="status"><LoaderCircle className="spin" size={24}/> Preparing your order securely</div></section>;
 if(!count||!lines.length)return <section className="container page"><div className="intro"><small>SECURE CHECKOUT</small><h1>Your cart is empty.</h1><p>Add a product to your cart before starting checkout.</p></div><Link className="btn primary" href="/shop"><ShoppingBag size={16}/> Browse products</Link></section>;
 const items=lines.map(({product,quantity})=>({slug:product.slug,fallbackInr:product.price,quantity}));
 const totalLabel=priceProducts(items);
 return <section className="container page"><div className="intro"><small>SECURE CHECKOUT</small><h1>Complete your purchase.</h1><p>Signed in as {customerName}. Online access and downloads will be saved to your account.</p></div><div className="checkoutlayout"><div className="summary"><h3>Order details <span className="checkout-item-count">{count} {count===1?'item':'items'}</span></h3>{lines.map(({product,quantity})=><div className="checkoutproduct" key={product.slug}><div><b>{product.name}</b><small>{product.fulfillment==="online_access"?"Online access · Saved progress":product.format} · Qty {quantity}</small></div><strong>{priceProducts([{slug:product.slug,fallbackInr:product.price,quantity}])}</strong></div>)}<hr/><p><span>Subtotal</span><b>{totalLabel}</b></p><p><span>Digital delivery</span><b>Included</b></p><h2>Total <b>{totalLabel}</b></h2><div className="checkoutassurance"><span><ShieldCheck size={16}/> Market: {country} · {currency}</span><span><Download size={16}/> Secure delivery after payment verification</span></div></div><div className="summary"><h3>Payment</h3><p className="paymentnotice">Payments are processed securely by Razorpay. BizPilot Studio does not store card or banking details.</p><RazorpayCheckout country={country} priceLabel={totalLabel} items={items}/><p className="checkoutterms">Use Razorpay Test Mode while testing. Enable live payments only after merchant and website verification.</p><Link className="back" href="/cart"><ArrowLeft size={14}/> Back to cart</Link></div></div></section>;
}
