import { describe, expect, it } from "vitest";
import { resolveCatalogRuntime } from "./resolve-catalog-runtime";

function catalog(code: string) {
  return {
    type: {
      id: `type-${code}`,
      code,
      name: code,
      attributes: [],
    },
  };
}

describe("catalog runtime presets smoke", () => {
  it.each([
    {
      code: "flowers",
      catalogTabLabel: "Каталог",
      supportsBrands: true,
      supportsManagerOrder: false,
      hasBrowserSlot: false,
      hasCartCardActionSlot: false,
    },
    {
      code: "restaurant",
      catalogTabLabel: "Меню",
      supportsBrands: false,
      supportsManagerOrder: false,
      hasBrowserSlot: true,
      hasCartCardActionSlot: false,
    },
    {
      code: "cafe",
      catalogTabLabel: "Меню",
      supportsBrands: false,
      supportsManagerOrder: false,
      hasBrowserSlot: true,
      hasCartCardActionSlot: false,
    },
    {
      code: "wholesale",
      catalogTabLabel: "Каталог",
      supportsBrands: true,
      supportsManagerOrder: true,
      hasBrowserSlot: false,
      hasCartCardActionSlot: true,
    },
    {
      code: "whosale",
      catalogTabLabel: "Каталог",
      supportsBrands: true,
      supportsManagerOrder: true,
      hasBrowserSlot: false,
      hasCartCardActionSlot: true,
    },
  ])(
    "keeps the $code runtime preset contract stable",
    ({
      code,
      catalogTabLabel,
      supportsBrands,
      supportsManagerOrder,
      hasBrowserSlot,
      hasCartCardActionSlot,
    }) => {
      const runtime = resolveCatalogRuntime(catalog(code));

      expect(runtime.typeCode).toBe(code);
      expect(runtime.presentation.catalogTabLabel).toBe(catalogTabLabel);
      expect(runtime.presentation.supportsBrands).toBe(supportsBrands);
      expect(runtime.cart.supportsManagerOrder).toBe(supportsManagerOrder);
      expect(Boolean(runtime.slots.Browser)).toBe(hasBrowserSlot);
      expect(Boolean(runtime.slots.CartCardAction)).toBe(hasCartCardActionSlot);
      expect(runtime.productCard).toEqual(
        expect.objectContaining({
          attributes: expect.any(Array),
          badges: expect.any(Array),
          key: expect.any(String),
          showVariants: expect.any(Boolean),
        }),
      );
    },
  );
});
