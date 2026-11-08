import { notFound } from "next/navigation";
import type { Metadata } from "next";
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };

  return {
    title: `${product.name} | Editable Excel Business Template`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | BizPilot Studio`,
      description: product.description,
      url: `/products/${product.slug}`,
      images: [{ url: "/bizpilot-logo-lockup.png", alt: "BizPilot Studio" }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    category: product.category,
    brand: { "@type": "Brand", name: "BizPilot Studio" },
    image: [
      "https://www.bizpilotstudio.com/previews/dashboard.png",
      "https://www.bizpilotstudio.com/previews/leads.png",
      "https://www.bizpilotstudio.com/previews/invoices.png",
    ],
    offers: {
      "@type": "Offer",
      url: `https://www.bizpilotstudio.com/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <section className="container page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, "\\u003c") }} />
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
          <div className="detailprice"><LocalizedPrice amount={product.price}/>{product.oldPrice&&<><del><LocalizedPrice amount={product.oldPrice}/></del><span className="detail-saving">Save {Math.round((1-product.price/product.oldPrice)*100)}%</span></>}</div>
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
