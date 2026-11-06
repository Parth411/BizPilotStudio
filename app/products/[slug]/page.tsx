import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, ShieldCheck, Eye } from "lucide-react";
import { products } from "@/lib/products";
import { ProductVisual } from "@/components/product-visual";
import { ProductPreview } from "@/components/product-preview";
import { AddToCart } from "@/components/add-to-cart";
import { LocalizedPrice } from "@/components/localized-price";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <section className="container page">
      <Link className="back" href="/shop"><ArrowLeft size={15}/> Back to shop</Link>
      <div className="detail">
        <div className="detailart">
          <ProductVisual type={product.visual}/>
          <a className="preview-cta" href="#product-preview"><Eye size={16}/> View workbook previews</a>
        </div>
        <div>
          <small>{product.category}</small>
          <h1>{product.name}</h1>
          <p className="description">{product.description}</p>
          <div className="detailprice"><LocalizedPrice amount={product.price}/></div>
          <p className="format">FILE FORMAT: {product.format}</p>
          <AddToCart product={product}/>
          <div className="delivery">
            <span><Download/> Digital product</span>
            <span><ShieldCheck/> Secure checkout and protected download</span>
          </div>
          <h3>What’s included</h3>
          {product.features.map((feature) => <p className="feature" key={feature}><CheckCircle2/> {feature}</p>)}
        </div>
      </div>
      <section id="product-preview" className="preview-section">
        <div className="sectionhead">
          <div><small>TAKE A CLOSER LOOK</small><h2>Preview the workbook.</h2></div>
          <span>5 sample views</span>
        </div>
        <ProductPreview/>
      </section>
    </section>
  );
}
