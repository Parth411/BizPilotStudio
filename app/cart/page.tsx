"use client";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, LoaderCircle } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ProductVisual } from "@/components/product-visual";
import { useCurrency } from "@/components/currency-provider";

export default function Cart() {
  const { lines, remove, qty, ready, count } = useCart();
  const { priceProduct, priceProducts } = useCurrency();
  const itemCount = count;
  const cartTotal = priceProducts(lines.map(({ product, quantity }) => ({ slug: product.slug, fallbackInr: product.price, quantity })));
  return <section className="container page">
    <div className="intro"><small>YOUR SELECTION</small><h1>Your shopping cart.</h1><p>Review the digital resources you’ve selected.</p></div>
    {!ready ? <div className="cart-loading" role="status"><LoaderCircle className="spin" size={22}/><span>Loading your saved cart…</span></div> : !lines.length ? <div className="empty"><ShoppingBag size={35}/><h2>Your cart is waiting</h2><p>Explore the collection and add a tool that helps your business move forward.</p><Link className="btn primary" href="/shop">Explore products</Link></div> :
      <div className="cartlayout"><div>{lines.map(({ product, quantity }) => <div className="cartline" key={product.slug}>
        <div className="cartvisual"><ProductVisual type={product.visual}/></div>
        <div><Link href={`/products/${product.slug}`}>{product.name}</Link><small>{product.format}</small><div className="quantity"><button aria-label="Decrease quantity" onClick={() => qty(product.slug, quantity - 1)}><Minus size={13}/></button>{quantity}<button aria-label="Increase quantity" onClick={() => qty(product.slug, quantity + 1)}><Plus size={13}/></button></div></div>
        <div className="lineend"><b>{priceProduct(product.slug, product.price, quantity)}</b><button onClick={() => remove(product.slug)}><Trash2 size={14}/> Remove</button></div>
      </div>)}</div>
      <aside className="summary"><h3>Order summary</h3><p><span>Subtotal · {itemCount} {itemCount === 1 ? "item" : "items"}</span><b>{cartTotal}</b></p><p><span>Digital delivery</span><b>Included</b></p><hr/><h2>Total <b>{cartTotal}</b></h2>
        <Link className="btn primary checkoutbutton" href="/checkout">Continue to checkout <ArrowRight size={16}/></Link>
        <small>Online access and protected downloads are delivered through your account.</small></aside></div>}
  </section>;
}
