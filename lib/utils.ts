import { formatDay } from "@/lib/i18n/core";

// Set by I18nProvider when the language changes, so these plain helpers follow it
// ("රු." and Sinhala month names in Sinhala).
let currency = "Rs.";
let locale   = "en-GB";
export function setUiLanguage(currencyLabel: string, dateLocale: string) { currency = currencyLabel; locale = dateLocale; }
export const uiLocale = () => locale;

export function formatLKR(amount: number): string {
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  return formatDay(new Date(dateStr), locale, {
    weekday: "short", month: "short", day: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return formatDay(new Date(dateStr), locale, {
    month: "short", day: "numeric",
  });
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

export function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
