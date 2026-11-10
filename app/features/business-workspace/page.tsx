import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, FileSpreadsheet, LockKeyhole, PackageCheck } from "lucide-react";
import styles from "../features.module.css";

export const metadata: Metadata = {
  title: "Small Business Workspace for Imports & Analytics",
  description: "Manage a small-business workspace with business profiles, CSV or Excel transaction imports, monthly sales and expense totals, six-month trends, and a digital product library.",
  alternates: { canonical: "/features/business-workspace" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "BizPilot Business Workspace | Imports & Analytics",
    description: "Bring business records into a private BizPilot workspace and review sales, expenses, and trends in one place.",
    url: "/features/business-workspace",
    images: [{ url: "/bizpilot-logo-lockup.png", alt: "BizPilot Studio Business Workspace" }],
  },
};

const features = [
  { icon: BriefcaseBusiness, title: "A space for your business", text: "Keep your business profile and imported activity together in a private, signed-in workspace." },
  { icon: FileSpreadsheet, title: "Import the records you have", text: "Bring in sales or expense rows from CSV or Excel. Map the columns, check the preview, and confirm before records are saved." },
  { icon: BarChart3, title: "Understand the numbers", text: "Review monthly sales and expenses, compare six-month trends, and see top products, customers, and expense categories when your imported file includes those details." },
  { icon: PackageCheck, title: "Your BizPilot products in one place", text: "Return to the digital resources and online tools connected with your customer account." },
];

export default function BusinessWorkspaceFeaturePage() {
  return <main className={`container ${styles.page}`}>
    <Link className={styles.back} href="/">BizPilot Studio · Features</Link>
    <header className={styles.hero}>
      <span className={styles.eyebrow}><BriefcaseBusiness size={15}/> BIZPILOT BUSINESS WORKSPACE</span>
      <h1>Your business records, in a clearer place.</h1>
      <p>Bring sales and expense data into a private workspace, then use practical analytics to review your imported records. Start with the spreadsheets you already have.</p>
      <div className={styles.actions}><Link className="btn primary" href="/account/register">Create your account <ArrowRight size={16}/></Link><Link className="textlink" href="/features/import-business-data">See how imports work ↗</Link></div>
    </header>
    <section className={styles.steps} aria-labelledby="workspace-features-heading">
      <div className={styles.sectionHeading}><small>WHAT’S AVAILABLE</small><h2 id="workspace-features-heading">Simple tools for a more informed view.</h2></div>
      <div className={styles.stepGrid}>{features.map(({icon: Icon,title,text})=><article key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className={styles.note}><strong>Private by design</strong><p>The working dashboard and imported business data are available after sign-in. The public Workspace overview is for product information; private account pages are not included in the search sitemap.</p></section>
    <aside className={styles.cta}><div><small>START WITH THE SPREADSHEETS YOU HAVE</small><h2>Import records, then explore your results.</h2><p>See the supported fields and review flow before you start.</p></div><Link className="btn primary" href="/features/import-business-data">Explore data imports <ArrowRight size={16}/></Link></aside>
    <div className={styles.workspaceLock}><LockKeyhole size={15}/> Your working Workspace requires sign-in.</div>
  </main>;
}
