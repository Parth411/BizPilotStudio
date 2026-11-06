export type CountryPricing = { country: string; currency: string; amount: number; locale: string };

// Localised market prices (not live FX conversion). Adjust these values as your pricing strategy evolves.
const PRICES: Record<string, CountryPricing> = {
  IN: { country: "India", currency: "INR", amount: 799, locale: "en-IN" },
  US: { country: "United States", currency: "USD", amount: 12.99, locale: "en-US" },
  GB: { country: "United Kingdom", currency: "GBP", amount: 9.99, locale: "en-GB" },
  CA: { country: "Canada", currency: "CAD", amount: 16.99, locale: "en-CA" },
  AU: { country: "Australia", currency: "AUD", amount: 18.99, locale: "en-AU" },
  NZ: { country: "New Zealand", currency: "NZD", amount: 19.99, locale: "en-NZ" },
  DE: { country: "Germany", currency: "EUR", amount: 11.99, locale: "de-DE" },
  FR: { country: "France", currency: "EUR", amount: 11.99, locale: "fr-FR" },
  IE: { country: "Ireland", currency: "EUR", amount: 11.99, locale: "en-IE" },
  NL: { country: "Netherlands", currency: "EUR", amount: 11.99, locale: "nl-NL" },
  SG: { country: "Singapore", currency: "SGD", amount: 16.99, locale: "en-SG" },
  AE: { country: "United Arab Emirates", currency: "AED", amount: 47, locale: "en-AE" },
};

export const COUNTRY_OPTIONS = [
  ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"],
  ["AU", "Australia"], ["NZ", "New Zealand"], ["DE", "Germany"], ["FR", "France"],
  ["IE", "Ireland"], ["NL", "Netherlands"], ["SG", "Singapore"], ["AE", "United Arab Emirates"],
  ["OTHER", "Other countries (USD)"],
] as const;

export function pricingForCountry(code: string): CountryPricing {
  return PRICES[code] ?? { country: "Other countries", currency: "USD", amount: 12.99, locale: "en-US" };
}

export function formatLocalPrice(baseInr: number, code: string) {
  const market = pricingForCountry(code);
  const amount = baseInr === 799 ? market.amount : baseInr;
  return new Intl.NumberFormat(market.locale, { style: "currency", currency: market.currency }).format(amount);
}
