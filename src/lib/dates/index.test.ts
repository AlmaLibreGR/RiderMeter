import { describe, expect, it } from "vitest";
import { getPreviousEquivalentRange, previousRangeStrings } from "@/lib/dates";

describe("date comparison ranges", () => {
  it("creates a previous range with the same day length", () => {
    const range = getPreviousEquivalentRange("2026-03-10", "2026-03-16", "Europe/Athens");

    expect(range.from.toISODate()).toBe("2026-03-03");
    expect(range.to.toISODate()).toBe("2026-03-09");
  });

  it("serializes previous range strings correctly for custom periods", () => {
    const range = previousRangeStrings("2026-03-01", "2026-03-05", "Europe/Athens");

    expect(range).toEqual({
      from: "2026-02-24",
      to: "2026-02-28",
    });
  });
});
