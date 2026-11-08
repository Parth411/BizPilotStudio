import type { Metadata } from "next";
import Link from "next/link";import {ArrowRight,ArrowUpRight,CheckCircle2,Download,ShieldCheck} from "lucide-react";import {products,categories} from "@/lib/products";import {ProductCard} from "@/components/product-card";import {ProductVisual} from "@/components/product-visual";import {PublicChatbot} from "@/components/public-chatbot";

export const metadata: Metadata = {
  title: "AI Business Planner & Business Tools for Small Businesses",
  description: "Plan and validate a small business idea with BizPilot Studio’s AI-assisted business planner. Estimate startup costs, test pricing and break-even, and set practical sales targets.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "BizPilot Studio",
    url: "/",
    title: "AI Business Planner & Business Tools | BizPilot Studio",
    description: "Plan a business idea, estimate startup costs, test pricing and break-even, and set sales targets with BizPilot Studio’s AI-assisted planner.",
    images: [{ url: "/bizpilot-logo-lockup.png", width: 1393, height: 352, alt: "BizPilot Studio AI-assisted business planner and digital tools" }],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "BizPilot Studio",
      url: "https://www.bizpilotstudio.com",
      logo: "https://www.bizpilotstudio.com/bizpilot-logo-lockup.png",
      email: "vichhiparth2@gmail.com",
    },
    {
      "@type": "WebSite",
      name: "BizPilot Studio",
      url: "https://www.bizpilotstudio.com",
      inLanguage: "en",
    },
  ],
};
export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema).replace(/</g,"\\u003c")}}/><section className="hero"><div className="container herogrid"><div><div className="kicker">● &nbsp; AI-ASSISTED BUSINESS PLANNING & DIGITAL TOOLS</div><h1>Plan your business.<br/><em>Grow with clarity.</em></h1><p>Validate your idea, estimate startup costs, test pricing and break-even, and set sales targets with BizPilot Studio’s AI-assisted business planner and practical digital tools.</p><div className="actions"><Link className="btn primary" href="/products/business-starter-system">Explore the AI business planner <ArrowRight size={17}/></Link><Link className="textlink" href="/shop">Browse all tools <ArrowUpRight size={16}/></Link></div><div className="proof"><span><CheckCircle2/> Practical and editable</span><span><Download/> Digital resources</span></div></div><div className="heroart"><div className="hero-product"><ProductVisual type="sheet"/></div><div className="float f1"><ShieldCheck/> <span><b>Made to be useful</b><small>Tools for real workflows</small></span></div><div className="float f2">✦ <span><b>Work smarter</b><small>More clarity, less busywork</small></span></div></div></div><div className="container herofoot">DESIGNED FOR SMALL BUSINESSES <span>TOOLS • TEMPLATES • RESOURCES</span><span>RUN YOUR BUSINESS SMARTER ↗</span></div></section>
<section className="trust"><div className="container trustgrid"><span>01 &nbsp; Simple to use</span><span>02 &nbsp; Easy to customise</span><span>03 &nbsp; Made for real workflows</span><span>04 &nbsp; Digital-first convenience</span></div></section>
<section className="section container"><div className="sectionhead"><div><small>FIND YOUR NEXT SMART MOVE</small><h2>Tools for every part<br/>of your business.</h2></div><Link className="textlink" href="/shop">View all products ↗</Link></div><div className="categories">{categories.slice(0,4).map((c,i)=><Link className={`category cat${i}`} key={c.slug} href={`/shop?category=${c.slug}`}><small>0{i+1}</small><div><h3>{c.name}</h3><p>{c.description}</p></div><b>↗</b></Link>)}</div></section>
<section className="featured"><div className="container"><div className="sectionhead"><div><small>THE CUSTOMER FAVOURITES</small><h2>Made to make work<br/>feel a little easier.</h2></div><Link className="btn outline" href="/shop">Shop all products <ArrowRight size={16}/></Link></div><div className="products">{products.slice(0,4).map(p=><ProductCard key={p.slug} product={p}/>)}</div></div></section>
<section className="manifesto"><div className="container manifestogrid"><h2>Less time managing the mess.<br/><em>More time moving forward.</em></h2><p>Running a business comes with enough moving parts. We create straightforward digital resources that help you stay on top of the details, present your work professionally and focus on what matters next.</p></div></section>
<section className="section container"><div className="sectionhead"><div><small>A SIMPLE WAY TO GET STARTED</small><h2>Choose it. Download it.<br/>Put it to work.</h2></div></div><div className="steps"><div><b>01</b><h3>Find what you need</h3><p>Browse practical tools built around common business tasks.</p></div><div><b>02</b><h3>Make it yours</h3><p>Customise editable files to suit your business and workflow.</p></div><div><b>03</b><h3>Move forward</h3><p>Use your resource to bring more clarity to your work.</p></div></div></section>
<section className="container cta"><div><small>YOUR NEXT SMARTER STEP STARTS HERE</small><h2>Ready to make business<br/>work better?</h2><p>Explore digital resources designed to help you work with confidence.</p><Link className="btn white" href="/shop">Explore all products <ArrowRight size={17}/></Link></div><b>B<span>.</span></b></section><PublicChatbot/></>}
