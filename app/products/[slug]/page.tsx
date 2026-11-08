import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, ShieldCheck, Eye } from "lucide-react";
import { products } from "@/lib/products";
import { ProductVisual } from "@/components/product-visual";
import { ProductPreview } from "@/components/product-preview";
import { AddToCart } from "@/components/add-to-cart";
import { LocalizedPrice } from "@/components/localized-price";
import { StarterStepIllustration } from "@/components/starter-step-illustration";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };

  const isPlanner = product.fulfillment === "online_access";
  const seoTitle = isPlanner
    ? "AI Business Planner for Startups & Small Businesses"
    : `${product.name} | Editable Excel Business Template`;
  const seoDescription = isPlanner
    ? "Plan and validate a business idea with BizPilot Studio’s AI-assisted business planner. Estimate startup costs, test pricing and profit, calculate break-even, and plan sales targets."
    : product.description;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${seoTitle} | BizPilot Studio`,
      description: seoDescription,
      url: `/products/${product.slug}`,
      images: [{ url: product.fulfillment === "online_access" ? "/bizpilot-logo-lockup.png" : "/previews/dashboard.png", alt: product.name }],
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
    image: product.fulfillment === "online_access"
      ? "https://www.bizpilotstudio.com/bizpilot-logo-lockup.png"
      : ["https://www.bizpilotstudio.com/previews/dashboard.png", "https://www.bizpilotstudio.com/previews/leads.png", "https://www.bizpilotstudio.com/previews/invoices.png"],
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
          <a className="preview-cta" href="#product-preview"><Eye size={16}/> {product.fulfillment === "online_access" ? "Preview the 10-step system" : "View workbook previews"}</a>
        </div>
        <div>
          <small>{product.fulfillment === "online_access" ? `${product.name} · ${product.category}` : product.category}</small>
          <h1>{product.fulfillment === "online_access" ? "AI-Assisted Business Planner" : product.name}</h1>
          <p className="description">{product.description}</p>
          <div className="detailprice"><LocalizedPrice amount={product.price} productSlug={product.slug}/>{product.oldPrice&&<><del><LocalizedPrice amount={product.oldPrice}/></del><span className="detail-saving">Save {Math.round((1-product.price/product.oldPrice)*100)}%</span></>}</div>
          <p className="format">{product.fulfillment === "online_access" ? "ONLINE BUSINESS PLANNING SYSTEM" : `FILE FORMAT: ${product.format}`}</p>
          {product.fulfillment === "online_access" ? <div className="starter-product-actions"><Link className="btn outline" href="/tools/business-starter">Try the planner free</Link><AddToCart product={product}/></div> : <AddToCart product={product}/>}
          <div className="delivery">
            {product.fulfillment === "online_access" ? <><span><Download/> Online access linked to your customer account</span><span><ShieldCheck/> Private saved plans and portable data export</span></> : <><span><Download/> Digital product</span><span><ShieldCheck/> Secure checkout and protected download</span></>}
          </div>
          <h3>What’s included</h3>
          {product.features.map((feature) => <p className="feature" key={feature}><CheckCircle2/> {feature}</p>)}
        </div>
      </div>
      <section id="product-preview" className="preview-section">
        <div className="sectionhead">
          <div><small>TAKE A CLOSER LOOK</small><h2>{product.fulfillment === "online_access" ? "Preview the system." : "Preview the workbook."}</h2></div>
          <span>{product.fulfillment === "online_access" ? "Visual guide · sample figures" : "5 sample views"}</span>
        </div>
        {product.fulfillment === "online_access" ? <div className="starter-step-preview">{[
          ["01", "Business setup", "Define your model, customer and market."],
          ["02", "Idea & viability", "Review demand evidence and assumptions."],
          ["03", "Startup costs", "Estimate one-time costs and capital needed."],
          ["04", "Pricing & profit", "Check per-sale margin and pricing."],
          ["05", "Break-even", "Estimate sales to cover costs and recover capital."],
          ["06", "Sales targets", "Translate goals into orders, traffic and ads."],
          ["07", "Launch plan", "Build a readiness checklist and milestones."],
          ["08", "Plan vs actual", "Compare your results with your assumptions."],
          ["09", "AI business analysis", "Review assumptions, risks and recommended next steps."],
          ["10", "Command center", "Review key numbers and next actions."],
        ].map(([number, title, description], index) => <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div><StarterStepIllustration index={index}/><CheckCircle2 size={17}/></article>)}</div> : <ProductPreview/>}
      </section>
    </section>
  );
}
