import { Star } from "lucide-react";
import Link from "next/link";
import { testimonials } from "@/lib/testimonials";

export function TestimonialCards({ compact = false }: { compact?: boolean }) {
  return <>
  <div className={compact ? "testimonial-grid testimonial-grid-compact" : "testimonial-grid"}>
    {testimonials.map((testimonial) => <article className="testimonial-card" key={testimonial.name}>
      <div className="testimonial-card-top"><Link className="testimonial-product" href={testimonial.href}>{testimonial.product}</Link><span className="testimonial-stars" role="img" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill="currentColor" strokeWidth={1.5}/>)}</span></div>
      <span className="testimonial-quote-mark" aria-hidden="true">“</span>
      <blockquote>{testimonial.quote}</blockquote>
      <div className="testimonial-person"><span className="testimonial-avatar" aria-hidden="true">{testimonial.initials}</span><span><strong>{testimonial.name}</strong><small>{testimonial.role}</small></span><span className="testimonial-verified">Customer</span></div>
      <Link className="testimonial-product-link" href={testimonial.href}>Explore {testimonial.product} <span aria-hidden="true">↗</span></Link>
    </article>)}
  </div>
  <p className="testimonial-edit-note">Review wording has been lightly edited to match the current product names.</p>
  </>;
}
