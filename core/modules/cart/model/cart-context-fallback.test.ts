import { describe, expect, it } from "vitest";
import { CART_CONTEXT_FALLBACK_VALUE } from "./cart-context-fallback";

describe("CART_CONTEXT_FALLBACK_VALUE", () => {
  it("keeps safe inert defaults while cart provider is hydrating", () => {
    expect(CART_CONTEXT_FALLBACK_VALUE.isLoading).toBe(true);
    expect(CART_CONTEXT_FALLBACK_VALUE.items).toEqual([]);
    expect(CART_CONTEXT_FALLBACK_VALUE.shouldUseCartUi).toBe(false);
  });

  it("rejects actions that require a ready cart", async () => {
    await expect(CART_CONTEXT_FALLBACK_VALUE.prepareShareOrder()).rejects.toThrow(
      "Корзина еще не готова.",
    );
    await expect(
      CART_CONTEXT_FALLBACK_VALUE.completeManagedOrder(),
    ).rejects.toThrow("Корзина еще не готова.");
  });
});
