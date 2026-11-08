"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { pricingForCountry } from "@/lib/pricing";

type CurrencyContextValue = { country: string; setCountry: (country: string) => void; ready: boolean; price: (inr: number, quantity?: number) => string; currency: string };
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState("IN");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const saved = window.localStorage.getItem("bizpilot-country");
    if (saved) { setCountryState(saved); setReady(true); return; }
    fetch("/api/geo", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => {
      if (active && data?.country) {
        const supported = ["IN","US","GB","CA","AU","NZ","DE","FR","IE","NL","SG","AE"];
        setCountryState(supported.includes(data.country) ? data.country : "OTHER");
      }
    }).catch(() => {
      const locale = navigator.language || "en-IN";
      const region = locale.split("-")[1]?.toUpperCase();
      if (active && region) setCountryState(region);
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const setCountry = (next: string) => { setCountryState(next); window.localStorage.setItem("bizpilot-country", next); };
  const market = pricingForCountry(country);
  const value = useMemo(() => ({ country, setCountry, ready, currency: market.currency, price: (inr: number, quantity = 1) => {
    const current = pricingForCountry(country);
    const unitAmount = inr === 399 ? current.amount : inr === 1299 ? current.originalAmount : inr;
    const amount = unitAmount * quantity;
    return new Intl.NumberFormat(current.locale, { style: "currency", currency: current.currency }).format(amount);
  }}), [country, ready]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
export function useCurrency() { const value = useContext(CurrencyContext); if (!value) throw new Error("CurrencyProvider missing"); return value; }
