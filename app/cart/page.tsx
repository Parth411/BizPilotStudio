"use client";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ProductVisual } from "@/components/product-visual";
import { useCurrency } from "@/components/currency-provider";

export default function Cart() {
  const { lines, remove, qty } = useCart();
  const { price } = useCurrency();
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const onlySellableWorkbook = lines.length > 0 && lines.every(({ product }) => product.slug === "small-business-management-workbook");
  return <section className="container page">
    <div className="intro"><small>YOUR SELECTION</small><h1>Your shopping cart.</h1><p>Review the digital resources you’ve selected.</p></div>
    {!lines.length ? <div className="empty"><ShoppingBag size={35}/><h2>Your cart is waiting</h2><p>Explore the collection and add a tool that helps your business move forward.</p><Link className="btn primary" href="/shop">Explore products</Link></div> :
      <div className="cartlayout"><div>{lines.map(({ product, quantity }) => <div className="cartline" key={product.slug}>
        <div className="cartvisual"><ProductVisual type={product.visual}/></div>
        <div><Link href={`/products/${product.slug}`}>{product.name}</Link><small>{product.format}</small><div className="quantity"><button aria-label="Decrease quantity" onClick={() => qty(product.slug, quantity - 1)}><Minus size={13}/></button>{quantity}<button aria-label="Increase quantity" onClick={() => qty(product.slug, quantity + 1)}><Plus size={13}/></button></div></div>
        <div className="lineend"><b>{price(product.price, quantity)}</b><button onClick={() => remove(product.slug)}><Trash2 size={14}/> Remove</button></div>
      </div>)}</div>
      <aside className="summary"><h3>Order summary</h3><p><span>Subtotal</span><b>{price(799, itemCount)}</b></p><p><span>Delivery</span><b>Digital</b></p><hr/><h2>Total <b>{price(799, itemCount)}</b></h2>
        {onlySellableWorkbook ? <Link className="btn primary checkoutbutton" href="/checkout">Continue to checkout <ArrowRight size={16}/></Link> : <p className="checkouterror">One or more selected items are not currently available for purchase. Please remove them and keep the published workbook.</p>}
        <small>Payment will open once the merchant account is activated.</small></aside></div>}
  </section>;
}
