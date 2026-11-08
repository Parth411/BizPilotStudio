import Link from "next/link";
import type { Metadata } from "next";
import { Mail, ShieldCheck, Download, CreditCard } from "lucide-react";

const faqs = [
  { question: "What does BizPilot Studio sell?", answer: "BizPilot Studio sells practical digital resources for small businesses and independent professionals. The current catalogue includes the Small Business Management Workbook, an editable Excel tool for everyday business operations." },
  { question: "Are the products physical items?", answer: "No. The planned catalogue consists of digital resources. Each product page will state its file format and what is included so you can check compatibility before purchasing." },
  { question: "Can I purchase and download products right now?", answer: "Yes. You can purchase the Small Business Management Workbook through secure checkout. After payment is verified, the order and download are available through your BizPilot Studio account." },
  { question: "Will I be able to edit the templates?", answer: "Editability depends on the product. The product page will identify the format, such as Excel, Google Sheets, Word, PowerPoint, PDF or Canva, and explain what can be edited." },
  { question: "Can I ask for help before buying?", answer: "Yes. Send your question with the product name and we will respond by email. You can also ask about file formats or whether a resource suits your workflow." },
  { question: "Where can I read the refund and licence terms?", answer: "Read the Terms of Use and Refund Policy linked in the footer. For questions, contact vichhiparth2@gmail.com." },
];

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about BizPilot Studio digital products, file formats, downloads, checkout and customer support.",
  alternates: { canonical: "/faq" },
};

export default function FAQPage() {
  return (
    <section className="container page">
      <div className="intro">
        <small>HELP & SUPPORT</small>
        <h1>Good questions.<br /><em>Clear answers.</em></h1>
        <p>Find out how BizPilot Studio works and what to expect from our digital resources.</p>
      </div>
      <div className="faq-notice">
        <ShieldCheck size={20} />
        <div><strong>Digital delivery</strong><p>Verified purchases are saved to your account, where you can access your order and workbook download.</p></div>
      </div>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <article className="faq-item" key={faq.question}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{faq.question}</h2><p>{faq.answer}</p></div>
          </article>
        ))}
      </div>
      <div className="faq-contact">
        <div><small>STILL HAVE A QUESTION?</small><h2>We’re one email away.</h2><p>Tell us what you need help with and include the product name, if relevant.</p></div>
        <Link className="btn primary" href="/contact"><Mail size={16} /> Contact us</Link>
      </div>
      <div className="faq-benefits" aria-label="Store information">
        <span><Download size={16} /> Digital resources</span>
        <span><CreditCard size={16} /> Razorpay checkout</span>
      </div>
    </section>
  );
}
