import { describe, expect, it } from "vitest";
import {
  buildCartLineKey,
  normalizeSaleUnitId,
  normalizeVariantId,
} from "./cart-line-key";

describe("cart line key helpers", () => {
  it("normalizes empty variant and sale unit values", () => {
    expect(normalizeVariantId("  ")).toBeUndefined();
    expect(normalizeSaleUnitId(null)).toBeUndefined();
    expect(buildCartLineKey("product-1")).toBe(
      "product-1:default:default",
    );
  });

  it("builds stable keys for variant and sale unit lines", () => {
    expect(buildCartLineKey("product-1", " variant-1 ", " kg ")).toBe(
      "product-1:variant-1:kg",
    );
  });
});
