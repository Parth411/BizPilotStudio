import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { ClientGrowthCopilot } from "@/components/client-growth-copilot";

export const metadata: Metadata = {
  title: "AI Lead Follow-Up & Quote Copilot for Small Business",
  description: "Turn a lead's needs into a clear quote and follow-up draft. Try the BizPilot Client Growth Copilot demo, review every suggestion, and tell us if you want to join the paid pilot.",
  alternates: { canonical: "/tools/client-growth-copilot" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Client Growth Copilot | BizPilot Studio",
    description: "Create tailored lead follow-ups, quote messages and next steps with an AI assistant built for small-business workflows.",
    url: "/tools/client-growth-copilot",
    images: [{ url: "/bizpilot-logo-lockup.png", alt: "BizPilot Studio Client Growth Copilot" }],
  },
};

export default function ClientGrowthCopilotPage() {
  return <section className="container page copilot-page">
    <header className="copilot-hero">
      <div><small><Sparkles size={14}/> BIZPILOT · EARLY PRODUCT DEMO</small><h1>Turn a new enquiry<br/>into a <em>clear next step.</em></h1><p>Share a little context about a lead. Get a practical quote or follow-up draft you can review, edit and send in your own voice.</p>
        <div className="copilot-proof"><span><CheckCircle2 size={15}/> Written for your situation</span><span><ShieldCheck size={15}/> You approve every message</span></div>
      </div>
      <div className="copilot-hero-note"><WandSparkles size={22}/><strong>Less staring at a blank message.</strong><span>Useful first drafts, ready for your judgment.</span></div>
    </header>

    <ClientGrowthCopilot />

    <section className="copilot-pilot-cta"><div><small>HELP SHAPE THE PAID PILOT</small><h2>Would this save you time<br/>with your customer follow-ups?</h2><p>We’re speaking with a small group of business owners before finalising the pilot offer.</p></div><div><a className="btn primary" href="mailto:vichhiparth2@gmail.com?subject=Client%20Growth%20Copilot%20pilot">Tell us you’re interested <ArrowRight size={16}/></a><small>Proposed pilot price: ₹299 for 30 days · one-time test offer</small></div></section>
    <p className="copilot-privacy">Demo inputs are sent to the AI provider to generate drafts and are not saved by this page. Avoid entering passwords, payment details, or other sensitive customer information. Review every draft before sending.</p>
    <nav className="copilot-related" aria-label="Related BizPilot products"><Link href="/products/small-business-management-workbook">Already tracking leads? See the Management Workbook <ArrowRight size={15}/></Link><Link href="/products/business-starter-system">Still planning your business? Try the Business Starter System <ArrowRight size={15}/></Link></nav>
  </section>;
}
