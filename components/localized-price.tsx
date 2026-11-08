"use client";
import { useCurrency } from "@/components/currency-provider";
export function LocalizedPrice({ amount, className, productSlug }: { amount: number; className?: string; productSlug?: string }) {
  const { price, priceProduct } = useCurrency();
  return <span className={className}>{productSlug ? priceProduct(productSlug, amount) : price(amount)}</span>;
}
