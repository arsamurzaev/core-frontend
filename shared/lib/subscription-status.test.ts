import { afterEach, describe, expect, it, vi } from "vitest";
import { getDaysUntilSubscriptionEnd } from "./subscription-status";

describe("getDaysUntilSubscriptionEnd", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the subscription active through the selected end date", () => {
    const subscriptionEndsAt = new Date(2026, 4, 28);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 28, 12));
    expect(getDaysUntilSubscriptionEnd(subscriptionEndsAt)).toBe(1);

    vi.setSystemTime(new Date(2026, 4, 29));
    expect(getDaysUntilSubscriptionEnd(subscriptionEndsAt)).toBe(0);
  });

  it("counts calendar days including today and the end date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 25, 10));

    expect(getDaysUntilSubscriptionEnd(new Date(2026, 4, 28))).toBe(4);
  });
});
