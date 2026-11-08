import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund Policy", description: "Read the BizPilot Studio refund policy for digital downloads, duplicate charges and technical issues.", alternates: { canonical: "/refund" } };

export default function RefundPage() {
  return <section className="container page legal"><div className="intro"><small>STORE POLICIES</small><h1>Refund Policy.</h1><p>Last updated: 6 November 2026</p></div><h2>Digital download purchases</h2><p>Because this product is a downloadable digital file that can be accessed immediately, purchases are generally non-refundable once the download has been made available, except where required by applicable law.</p><h2>Technical problems</h2><p>If your payment was successful but the download link does not work, contact us at <a href="mailto:vichhiparth2@gmail.com">vichhiparth2@gmail.com</a>. Include your payment ID and we will help restore access.</p><h2>Duplicate or incorrect charges</h2><p>If you believe you were charged more than once for the same order, contact us with the relevant payment references so we can investigate.</p></section>;
}
