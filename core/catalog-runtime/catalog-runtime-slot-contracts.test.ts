import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("catalog runtime slot contracts", () => {
  it("keeps cart action slots on the cart view model public contract", () => {
    const contractsSource = readFileSync(
      "core/catalog-runtime/contracts.ts",
      "utf8",
    );
    const slotsSource = readFileSync(
      "core/catalog-runtime/use-catalog-runtime-slots.ts",
      "utf8",
    );

    expect(contractsSource).toContain(
      'import type { CartItemView } from "@/core/modules/cart";',
    );
    expect(slotsSource).toContain(
      'import type { CartItemView } from "@/core/modules/cart";',
    );
    expect(contractsSource).not.toContain("CartItemDto");
    expect(slotsSource).not.toContain("CartItemDto");
    expect(contractsSource).not.toContain(
      "@/core/modules/cart/model/cart-item-view",
    );
    expect(slotsSource).not.toContain(
      "@/core/modules/cart/model/cart-item-view",
    );
  });
});
