import type { Metadata } from "next";
import Link from "next/link";import {ArrowRight,ArrowUpRight,CheckCircle2,Download,ShieldCheck} from "lucide-react";import {products,categories} from "@/lib/products";import {ProductCard} from "@/components/product-card";import {ProductVisual} from "@/components/product-visual";import {PublicChatbot} from "@/components/public-chatbot";
import {TestimonialCards} from "@/components/testimonial-cards";

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
export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema).replace(/</g,"\\u003c")}}/><section className="hero"><div className="container herogrid"><div><div className="kicker">✦ &nbsp; PRACTICAL TOOLS FOR SMALL BUSINESS</div><h1>Make your next<br/>business move<br/><em>with confidence.</em></h1><p>Plan what’s next, get your numbers in focus, and keep everyday work organised with useful tools built for the way small businesses run.</p><div className="actions"><Link className="btn primary" href="/shop">Find your business tool <ArrowRight size={17}/></Link><Link className="btn outline" href="/tools/business-starter">Try the planner free <ArrowUpRight size={16}/></Link></div><div className="proof"><span><CheckCircle2/> Clear, practical workflows</span><span><Download/> Instant digital access</span></div></div><div className="heroart"><div className="hero-product"><ProductVisual type="planner"/></div><div className="float f1"><ShieldCheck/> <span><b>Built for real work</b><small>Simple, useful business tools</small></span></div><div className="float f2">✦ <span><b>Your next step, clearer</b><small>Plan · organise · grow</small></span></div></div></div><div className="container herofoot">BUSINESS PLANNING <span>WORKBOOKS • ONLINE TOOLS</span><span>MADE FOR SMALL BUSINESSES ↗</span></div></section>
<section className="trust"><div className="container trustgrid"><span>01 &nbsp; Simple to use</span><span>02 &nbsp; Easy to customise</span><span>03 &nbsp; Made for real workflows</span><span>04 &nbsp; Digital-first convenience</span></div></section>
<section className="featured"><div className="container"><div className="sectionhead"><div><small>CHOOSE YOUR NEXT STEP</small><h2>Tools that help you<br/>move business forward.</h2></div><Link className="textlink" href="/shop">Compare all products <ArrowUpRight size={16}/></Link></div><div className="products">{products.map(p=><ProductCard key={p.slug} product={p}/>)}</div><div className="store-reassurance"><span><ShieldCheck size={17}/> Secure online checkout</span><span><Download size={17}/> Digital access after purchase</span><span><CheckCircle2 size={17}/> Clear product details before you buy</span></div></div></section>
<section className="home-testimonials"><div className="container"><div className="sectionhead"><div><small>KIND WORDS FROM OUR CUSTOMERS</small><h2>Good tools. Happier<br/>business days.</h2></div><Link className="textlink" href="/reviews">See all customer reviews <ArrowRight size={16}/></Link></div><TestimonialCards compact/></div></section>
<section className="product-finder-promo"><div className="container product-finder-promo-inner"><div><small>NOT SURE WHERE TO START?</small><h2>Find your BizPilot match<br/><em>in under a minute.</em></h2><p>Answer a few quick questions and get a practical recommendation for the tool that fits your business right now.</p></div><Link className="btn primary" href="/tools/product-finder">Find the right tool <ArrowRight size={17}/></Link></div></section>
<section className="copilot-home-promo"><div className="container copilot-home-inner"><div><small>IN DEVELOPMENT · TRY THE DEMO</small><h2>Better follow-ups.<br/><em>More confident conversations.</em></h2><p>Turn lead details into a tailored quote message or follow-up draft. You stay in control before anything goes to your customer.</p></div><Link className="btn primary" href="/tools/client-growth-copilot">Try the AI copilot <ArrowRight size={17}/></Link></div></section>
<section className="section container"><div className="sectionhead"><div><small>NEW IN BIZPILOT</small><h2>Bring your business<br/>numbers into focus.</h2></div><p className="feature-intro">Move from scattered spreadsheets to a clearer view of sales, expenses and trends.</p></div><div className="feature-links"><Link href="/features/import-business-data"><small>01 · DATA IMPORT</small><h3>Bring your records together</h3><p>Import a CSV or Excel file, map its columns, review the preview and confirm the records you want to add.</p><b>Explore data imports ↗</b></Link><Link href="/features/business-analytics"><small>02 · BUSINESS ANALYTICS</small><h3>See the story in your numbers</h3><p>Review sales, expenses and simple sales-minus-expenses totals, with monthly comparisons and six-month trends.</p><b>Explore business analytics ↗</b></Link></div></section>
<section className="section container"><div className="sectionhead"><div><small>FIND YOUR NEXT SMART MOVE</small><h2>Tools for every part<br/>of your business.</h2></div><Link className="textlink" href="/shop">View all products ↗</Link></div><div className="categories">{categories.slice(0,4).map((c,i)=><Link className={`category cat${i}`} key={c.slug} href={`/shop?category=${c.slug}`}><small>0{i+1}</small><div><h3>{c.name}</h3><p>{c.description}</p></div><b>↗</b></Link>)}</div></section>
<section className="manifesto"><div className="container manifestogrid"><h2>Less time managing the mess.<br/><em>More time moving forward.</em></h2><p>Running a business comes with enough moving parts. We create straightforward digital resources that help you stay on top of the details, present your work professionally and focus on what matters next.</p></div></section>
<section className="section container"><div className="sectionhead"><div><small>A SIMPLE WAY TO GET STARTED</small><h2>Choose it. Download it.<br/>Put it to work.</h2></div></div><div className="steps"><div><b>01</b><h3>Find what you need</h3><p>Browse practical tools built around common business tasks.</p></div><div><b>02</b><h3>Make it yours</h3><p>Customise editable files to suit your business and workflow.</p></div><div><b>03</b><h3>Move forward</h3><p>Use your resource to bring more clarity to your work.</p></div></div></section>
<section className="container cta"><div><small>YOUR NEXT SMARTER STEP STARTS HERE</small><h2>Ready to make business<br/>work better?</h2><p>Explore digital resources designed to help you work with confidence.</p><Link className="btn white" href="/shop">Explore all products <ArrowRight size={17}/></Link></div><b>B<span>.</span></b></section><PublicChatbot/></>}
