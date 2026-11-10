import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { ProductFinder } from "@/components/product-finder";

export const metadata: Metadata = {
  title: "Find the Right Small Business Tool | Free BizPilot Product Finder",
  description: "Not sure which business tool to choose? Answer a few quick questions and get a personalised recommendation for planning a business or managing day-to-day work.",
  alternates: { canonical: "/tools/product-finder" },
  openGraph: {
    type: "website",
    title: "Find the Right Business Tool for You | BizPilot Studio",
    description: "Get a clear, personalised recommendation for the BizPilot tool that fits your business and next step.",
    url: "/tools/product-finder",
    images: [{ url: "/bizpilot-logo-lockup.png", alt: "BizPilot Studio Product Finder" }],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BizPilot Product Finder",
  url: "https://www.bizpilotstudio.com/tools/product-finder",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  description: "A free guided product recommendation tool that helps small businesses choose the right BizPilot planning or business management tool.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  publisher: { "@type": "Organization", name: "BizPilot Studio", url: "https://www.bizpilotstudio.com" },
};

export default function ProductFinderPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className="container page">
      <div className="intro">
        <small>FREE BIZPILOT BUYING GUIDE</small>
        <h1>Find the right tool<br /><em>for your next move.</em></h1>
        <p>Tell us what you’re working on. In a few quick choices, get a clear recommendation for the BizPilot product that fits your business today.</p>
        <div className="product-finder-proof"><span><Sparkles size={15}/> Personalised guidance</span><span><CheckCircle2 size={15}/> No sign-up needed</span><span><CheckCircle2 size={15}/> Takes less than a minute</span></div>
      </div>
      <ProductFinder />
      <section className="product-finder-why">
        <div><small>MADE FOR YOUR REAL WORK</small><h2>Skip the guesswork.<br />Choose with confidence.</h2></div>
        <p>BizPilot tools are designed around practical small-business tasks, from checking whether an idea can work to keeping customers, quotes, invoices and expenses organised.</p>
      </section>
      <nav className="product-finder-links" aria-label="Explore BizPilot tools">
        <Link href="/products/business-starter-system">Explore the Business Starter System <ArrowRight size={16}/></Link>
        <Link href="/products/small-business-management-workbook">Explore the Management Workbook <ArrowRight size={16}/></Link>
        <Link href="/shop">Browse all BizPilot products <ArrowRight size={16}/></Link>
      </nav>
    </section>
  </>;
}
