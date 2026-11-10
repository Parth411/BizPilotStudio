import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { TestimonialCards } from "@/components/testimonial-cards";

export const metadata: Metadata = {
  title: "Customer Reviews & Experiences",
  description: "Read customer experiences with BizPilot Studio's small-business tools, and share feedback about your purchase.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    type: "website",
    title: "Customer Reviews | BizPilot Studio",
    description: "Real experiences from small-business owners using BizPilot Studio tools.",
    url: "/reviews",
  },
};

const commitments = [
  { icon: Sparkles, title: "Useful by design", text: "Products are built around practical business tasks, with clear descriptions of what each tool includes." },
  { icon: ShieldCheck, title: "A clear buying experience", text: "Review product details and pricing before checkout. Digital products are delivered online after purchase." },
  { icon: HeartHandshake, title: "Here when you need us", text: "Questions about a product or order? Contact BizPilot support and we’ll help you find the right next step." },
];

export default function ReviewsPage() {
  return <section className="container page reviews-page">
    <header className="reviews-hero">
      <small>THE BIZPILOT CUSTOMER ROOM</small>
      <h1>Real experiences.<br/><em>Better business days.</em></h1>
      <p>We’re preparing the first customer stories for this page. We want every review here to reflect a real buyer’s words and be shared with their permission.</p>
    </header>

    <section className="reviews-testimonials" aria-labelledby="reviews-testimonials-title">
      <div className="sectionhead"><div><small>SHARED BY OUR CUSTOMERS</small><h2 id="reviews-testimonials-title">A little love from<br/>the people who use BizPilot.</h2></div><p>We’re grateful to our customers for sharing their experience with BizPilot Studio.</p></div>
      <TestimonialCards />
    </section>

    <section className="reviews-commitments">
      <div className="sectionhead"><div><small>THE SERVICE BEHIND THE TOOLS</small><h2>What you can expect<br/>from BizPilot.</h2></div><p>We want choosing and using a business tool to feel straightforward from the first look to your next step.</p></div>
      <div className="reviews-commitment-grid">{commitments.map(({icon: Icon,title,text})=><article key={title}><span><Icon size={19}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="reviews-bottom-cta"><div><small>FIND YOUR FIT</small><h2>See which BizPilot tool<br/>matches your next step.</h2></div><div><Link className="btn white" href="/tools/product-finder">Use the Product Finder <ArrowRight size={16}/></Link><Link className="reviews-contact-link" href="/contact">Questions? Talk to us</Link></div></section>
  </section>;
}
