"use client";
import { useCurrency } from "@/components/currency-provider";
export function LocalizedPrice({ amount, className }: { amount: number; className?: string }) {
  const { price } = useCurrency();
  return <span className={className}>{price(amount)}</span>;
}
