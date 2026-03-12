export function toSafeNumber(value: unknown, fallback = 0) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : fallback;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

export function roundCurrency(value: number) {
  return Math.round((toSafeNumber(value) + Number.EPSILON) * 100) / 100;
}

export function safeDivide(value: number, divisor: number) {
  if (!Number.isFinite(value) || !Number.isFinite(divisor) || divisor <= 0) {
    return 0;
  }

  return value / divisor;
}

export function clampPercent(value: number) {
  return Math.min(Math.max(toSafeNumber(value), 0), 100);
}

export function asNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function groupBy<TItem, TKey extends string | number>(
  items: TItem[],
  getKey: (item: TItem) => TKey
) {
  return items.reduce<Record<TKey, TItem[]>>((accumulator, item) => {
    const key = getKey(item);
    const current = accumulator[key] ?? [];
    current.push(item);
    accumulator[key] = current;
    return accumulator;
  }, {} as Record<TKey, TItem[]>);
}
