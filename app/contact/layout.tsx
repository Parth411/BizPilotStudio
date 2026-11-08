import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact BizPilot Studio",
  description: "Contact BizPilot Studio for help choosing a business template, download support or questions about a digital product.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
