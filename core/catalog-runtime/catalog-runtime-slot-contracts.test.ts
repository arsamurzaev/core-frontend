import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("catalog runtime slot contracts", () => {
  it("keeps cart action slots on the cart view model public contract", () => {
    const slotContractsSource = readFileSync(
      "core/catalog-runtime/slot-contracts.ts",
      "utf8",
    );
    const slotsSource = readFileSync(
      "core/catalog-runtime/use-catalog-runtime-slots.ts",
      "utf8",
    );

    expect(slotContractsSource).toContain(
      'import type { CartItemView } from "@/core/modules/cart";',
    );
    expect(slotsSource).toContain(
      'import type { CartItemView } from "@/core/modules/cart";',
    );
    expect(slotContractsSource).not.toContain("CartItemDto");
    expect(slotsSource).not.toContain("CartItemDto");
    expect(slotContractsSource).not.toContain(
      "@/core/modules/cart/model/cart-item-view",
    );
    expect(slotsSource).not.toContain(
      "@/core/modules/cart/model/cart-item-view",
    );
  });

  it("keeps metadata contracts and server facade free from runtime implementation", () => {
    const metadataContractsSource = readFileSync(
      "core/catalog-runtime/metadata-contracts.ts",
      "utf8",
    );
    const serverSource = readFileSync("core/catalog-runtime/server.ts", "utf8");

    expect(metadataContractsSource).not.toContain("React");
    expect(metadataContractsSource).not.toContain("next/dynamic");
    expect(metadataContractsSource).not.toContain("./registry");
    expect(metadataContractsSource).not.toContain("./resolve-catalog-runtime");
    expect(serverSource).not.toContain("./registry");
    expect(serverSource).not.toContain("./resolve-catalog-runtime");
    expect(serverSource).not.toContain("./use-catalog-runtime");
  });
});
