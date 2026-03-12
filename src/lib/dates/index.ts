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

export function getPreviousEquivalentRange(
  fromIso: string,
  toIso: string,
  timezone?: string
) {
  const from = parseIsoDate(fromIso, timezone);
  const to = parseIsoDate(toIso, timezone);
  const lengthInDays = Math.max(Math.floor(to.diff(from, "days").days) + 1, 1);
  const previousTo = from.minus({ days: 1 }).endOf("day");
  const previousFrom = previousTo.minus({ days: lengthInDays - 1 }).startOf("day");

  return {
    from: previousFrom,
    to: previousTo,
  };
}

export function isDateWithinRange(
  date: string,
  fromIso: string,
  toIso: string,
  timezone?: string
) {
  const current = parseIsoDate(date, timezone);
  const from = parseIsoDate(fromIso, timezone);
  const to = parseIsoDate(toIso, timezone).endOf("day");
  return current >= from && current <= to;
}

export function toRangeStrings(
  period: DashboardPeriod,
  timezone?: string,
  customFrom?: string,
  customTo?: string
) {
  const range = getPeriodRange(period, timezone, customFrom, customTo);
  return {
    from: range.from.toISODate() ?? "",
    to: range.to.toISODate() ?? "",
  };
}

export function previousRangeStrings(fromIso: string, toIso: string, timezone?: string) {
  const range = getPreviousEquivalentRange(fromIso, toIso, timezone);
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

export function getDurationHoursFromTimes(startTime?: string | null, endTime?: string | null) {
  const start = normalizeTimeValue(startTime);
  const end = normalizeTimeValue(endTime);

  if (!start || !end) {
    return null;
  }

  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);

  if (
    [startHours, startMinutes, endHours, endMinutes].some(
      (value) => !Number.isFinite(value) || value < 0
    )
  ) {
    return null;
  }

  const startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;

  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }

  return Number(((endTotalMinutes - startTotalMinutes) / 60).toFixed(2));
}

export function formatDurationLabel(hours: number, locale: string) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "";
  }

  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (locale === "el") {
    if (minutes === 0) {
      return `${wholeHours} \u03ce\u03c1\u03b5\u03c2`;
    }

    return `${wholeHours} \u03ce\u03c1\u03b5\u03c2 ${minutes} \u03bb\u03b5\u03c0\u03c4\u03ac`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
}

function normalizeTimeValue(value?: string | null) {
  if (!value) {
    return null;
  }

  return /^\d{2}:\d{2}$/.test(value) ? value : null;
}
