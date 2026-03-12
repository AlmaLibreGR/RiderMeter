import { DateTime } from "luxon";
import type { DashboardPeriod } from "@/types/domain";

const defaultTimezone = "Europe/Athens";

export function getZone(timezone?: string) {
  return timezone || defaultTimezone;
}

export function parseIsoDate(date: string, timezone?: string) {
  return DateTime.fromISO(date, { zone: getZone(timezone) }).startOf("day");
}

export function toDateLabel(date: string, locale: string, timezone?: string) {
  return parseIsoDate(date, timezone).setLocale(locale).toFormat("dd LLL");
}

export function toWeekdayLabel(date: string, locale: string, timezone?: string) {
  return parseIsoDate(date, timezone).setLocale(locale).toFormat("ccc");
}

export function getPeriodRange(
  period: DashboardPeriod,
  timezone?: string,
  customFrom?: string,
  customTo?: string
) {
  const zone = getZone(timezone);
  const today = DateTime.now().setZone(zone).startOf("day");

  if (period === "custom" && customFrom && customTo) {
    return {
      from: parseIsoDate(customFrom, zone),
      to: parseIsoDate(customTo, zone).endOf("day"),
    };
  }

  if (period === "today") {
    return {
      from: today,
      to: today.endOf("day"),
    };
  }

  if (period === "month") {
    return {
      from: today.startOf("month"),
      to: today.endOf("day"),
    };
  }

  return {
    from: today.startOf("week"),
    to: today.endOf("day"),
  };
}

export function isDateWithinRange(date: string, fromIso: string, toIso: string, timezone?: string) {
  const current = parseIsoDate(date, timezone);
  const from = parseIsoDate(fromIso, timezone);
  const to = parseIsoDate(toIso, timezone).endOf("day");
  return current >= from && current <= to;
}

export function toRangeStrings(period: DashboardPeriod, timezone?: string, customFrom?: string, customTo?: string) {
  const range = getPeriodRange(period, timezone, customFrom, customTo);
  return {
    from: range.from.toISODate() ?? "",
    to: range.to.toISODate() ?? "",
  };
}

export function nowIsoDate(timezone?: string) {
  return DateTime.now().setZone(getZone(timezone)).toISODate() ?? "";
}

export function startTimeFromDate(date: string, timezone?: string) {
  return parseIsoDate(date, timezone).toJSDate();
}
