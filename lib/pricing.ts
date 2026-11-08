export type CountryPricing = { country: string; currency: string; amount: number; originalAmount: number; starterAmount: number; locale: string };

// Localised market prices (not live FX conversion). Adjust these values as your pricing strategy evolves.
const PRICES: Record<string, CountryPricing> = {
  IN: { country: "India", currency: "INR", amount: 399, originalAmount: 1299, starterAmount: 499, locale: "en-IN" },
  US: { country: "United States", currency: "USD", amount: 6.99, originalAmount: 19.99, starterAmount: 20, locale: "en-US" },
  GB: { country: "United Kingdom", currency: "GBP", amount: 5.49, originalAmount: 16.99, starterAmount: 15.99, locale: "en-GB" },
  CA: { country: "Canada", currency: "CAD", amount: 8.99, originalAmount: 26.99, starterAmount: 27.99, locale: "en-CA" },
  AU: { country: "Australia", currency: "AUD", amount: 9.99, originalAmount: 29.99, starterAmount: 29.99, locale: "en-AU" },
  NZ: { country: "New Zealand", currency: "NZD", amount: 10.99, originalAmount: 32.99, starterAmount: 32.99, locale: "en-NZ" },
  DE: { country: "Germany", currency: "EUR", amount: 6.49, originalAmount: 19.99, starterAmount: 18.99, locale: "de-DE" },
  FR: { country: "France", currency: "EUR", amount: 6.49, originalAmount: 19.99, starterAmount: 18.99, locale: "fr-FR" },
  IE: { country: "Ireland", currency: "EUR", amount: 6.49, originalAmount: 19.99, starterAmount: 18.99, locale: "en-IE" },
  NL: { country: "Netherlands", currency: "EUR", amount: 6.49, originalAmount: 19.99, starterAmount: 18.99, locale: "nl-NL" },
  SG: { country: "Singapore", currency: "SGD", amount: 8.99, originalAmount: 26.99, starterAmount: 26.99, locale: "en-SG" },
  AE: { country: "United Arab Emirates", currency: "AED", amount: 24.99, originalAmount: 79, starterAmount: 73.99, locale: "en-AE" },
};

export const COUNTRY_OPTIONS = [
  ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"],
  ["AU", "Australia"], ["NZ", "New Zealand"], ["DE", "Germany"], ["FR", "France"],
  ["IE", "Ireland"], ["NL", "Netherlands"], ["SG", "Singapore"], ["AE", "United Arab Emirates"],
  ["OTHER", "Other countries (USD)"],
] as const;

export function pricingForCountry(code: string): CountryPricing {
  return PRICES[code] ?? { country: "Other countries", currency: "USD", amount: 6.99, originalAmount: 19.99, starterAmount: 20, locale: "en-US" };
}

export function priceForProduct(slug: string, code: string, fallbackInr: number) {
  const market = pricingForCountry(code);
  if (slug === "small-business-management-workbook") return market.amount;
  if (slug === "business-starter-system") return market.starterAmount;
  return fallbackInr;
}

export function formatLocalPrice(baseInr: number, code: string) {
  const market = pricingForCountry(code);
  const amount = baseInr === 399 ? market.amount : baseInr === 1299 ? market.originalAmount : baseInr === 499 ? market.starterAmount : baseInr;
  return new Intl.NumberFormat(market.locale, { style: "currency", currency: market.currency }).format(amount);
}
