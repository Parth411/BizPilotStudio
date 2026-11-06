"use client";

import { Mail, Send } from "lucide-react";
import { useState } from "react";

const CONTACT_EMAIL = "vichhiparth2@gmail.com";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section className="container page">
      <div className="intro">
        <small>WE’RE HERE TO HELP</small>
        <h1>Let’s talk about<br /><em>what you need.</em></h1>
        <p>Questions about a product or an idea for a resource? Send us a message.</p>
      </div>
      <div className="contactgrid">
        <div className="contactcard">
          <Mail />
          <h3>Email us</h3>
          <p>For product questions and general enquiries.</p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <small>We’ll be happy to hear from you.</small>
        </div>
        <form
          className="contactform"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const subject = encodeURIComponent(`BizPilot Studio enquiry from ${data.get("name")}`);
            const body = encodeURIComponent(
              `Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\nMessage:\n${data.get("message")}`
            );
            window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
            setSent(true);
          }}
        >
          <h2>Send an enquiry</h2>
          <label>Your name<input name="name" required placeholder="Name" /></label>
          <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
          <label>Message<textarea name="message" required rows={5} placeholder="How can we help?" /></label>
          <button className="btn primary" type="submit"><Send size={16} /> Prepare email</button>
          {sent && <p className="success">Your email app should open with the enquiry addressed to {CONTACT_EMAIL}.</p>}
        </form>
      </div>
    </section>
  );
}
