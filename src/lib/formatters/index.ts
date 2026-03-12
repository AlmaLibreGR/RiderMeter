import type { AppLocale, CurrencyCode } from "@/types/domain";

function toIntlLocale(locale: AppLocale) {
  return locale === "el" ? "el-GR" : "en-IE";
}

export function formatCurrency(value: number, locale: AppLocale, currency: CurrencyCode) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatNumber(value: number, locale: AppLocale, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits,
  }).format(value || 0);
}

export function formatPercent(value: number, locale: AppLocale, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format((value || 0) / 100);
}

export function formatDate(date: string, locale: AppLocale, timezone: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(date));
}
