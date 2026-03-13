export function toSafeNumber(value: unknown, fallback = 0) {
  let parsed = fallback;

  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string") {
    parsed = Number(value);
  } else if (typeof value === "bigint") {
    parsed = Number(value);
  } else if (value && typeof value === "object") {
    if ("toNumber" in value && typeof value.toNumber === "function") {
      parsed = Number(value.toNumber());
    } else if ("valueOf" in value && typeof value.valueOf === "function") {
      const primitive = value.valueOf();
      if (primitive !== value) {
        return toSafeNumber(primitive, fallback);
      }
    } else if ("toString" in value && typeof value.toString === "function") {
      const serialized = value.toString();
      if (serialized && serialized !== "[object Object]") {
        parsed = Number(serialized);
      }
    }
  }

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
