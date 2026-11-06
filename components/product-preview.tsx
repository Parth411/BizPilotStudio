"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";

const previews = [
  { src: "/previews/dashboard.png", label: "Business dashboard" },
  { src: "/previews/leads.png", label: "Lead tracker" },
  { src: "/previews/quotations.png", label: "Quotation tracker" },
  { src: "/previews/invoices.png", label: "Invoice tracker" },
  { src: "/previews/expenses.png", label: "Expense tracker" },
];

export function ProductPreview() {
  const [active, setActive] = useState(0);
  return (
    <div className="product-preview">
      <div className="product-preview-main">
        <img src={previews[active].src} alt={`${previews[active].label} workbook preview`} />
        <span className="preview-caption">{previews[active].label}</span>
        <a href={previews[active].src} target="_blank" rel="noreferrer" aria-label="Open full-size preview"><Maximize2 size={17}/></a>
      </div>
      <div className="product-preview-thumbs" aria-label="Workbook preview pages">
        {previews.map((item, index) => (
          <button key={item.src} className={active === index ? "active" : ""} onClick={() => setActive(index)} aria-pressed={active === index}>
            <img src={item.src} alt="" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <p className="preview-note">Preview images show the workbook layout. The downloadable Excel file contains editable sheets and formulas.</p>
    </div>
  );
}
