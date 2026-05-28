import {
  canViewIikoOrderTimeline,
  catalogCanUseIikoOrderTimeline,
} from "./order-page-access";
import { describe, expect, it } from "vitest";

describe("order page access", () => {
  it("does not expose the iiko timeline for catalogs without iiko", () => {
    expect(
      catalogCanUseIikoOrderTimeline({
        features: { canUseIikoIntegration: false },
      }),
    ).toBe(false);
  });

  it("reads legacy effective feature flags", () => {
    expect(
      catalogCanUseIikoOrderTimeline({
        features: { effective: { "integration.iiko": true } },
      }),
    ).toBe(true);
  });

  it("requires a catalog manager role", () => {
    const catalog = { features: { canUseIikoIntegration: true } };

    expect(canViewIikoOrderTimeline({ catalog, userRole: null })).toBe(false);
    expect(canViewIikoOrderTimeline({ catalog, userRole: "USER" })).toBe(false);
    expect(canViewIikoOrderTimeline({ catalog, userRole: "CATALOG" })).toBe(
      true,
    );
    expect(canViewIikoOrderTimeline({ catalog, userRole: "ADMIN" })).toBe(true);
  });
});
