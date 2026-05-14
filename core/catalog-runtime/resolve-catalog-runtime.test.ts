import { describe, expect, it } from "vitest";
import type {
  CatalogCurrentDto,
  CatalogSettingsDto,
} from "@/shared/api/generated/react-query";
import { getCatalogRuntimeCheckoutConfig } from "./checkout";
import { resolveCatalogRuntime } from "./resolve-catalog-runtime";

function catalogType(code: string): CatalogCurrentDto["type"] {
  return {
    id: `type-${code}`,
    code,
    name: code,
    attributes: [],
  };
}

function catalogSettings(
  overrides: Partial<CatalogSettingsDto> = {},
): CatalogSettingsDto {
  return {
    isActive: true,
    defaultMode: "DELIVERY",
    allowedModes: ["DELIVERY"],
    inventoryMode: "NONE",
    address: null,
    checkout: {
      availableMethods: ["DELIVERY", "PICKUP"],
      enabledMethods: [],
      methodContacts: {},
      methodFields: {},
    },
    googleVerification: null,
    yandexVerification: null,
    ...overrides,
  };
}

function catalogWithType(code: string): Pick<CatalogCurrentDto, "type"> {
  return {
    type: catalogType(code),
  };
}

function checkoutCatalogWithType(
  code: string,
  settings: CatalogSettingsDto | null = null,
): Pick<CatalogCurrentDto, "type" | "settings" | "contacts"> {
  return {
    contacts: [],
    settings,
    type: catalogType(code),
  };
}

describe("resolveCatalogRuntime", () => {
  it("returns default runtime for unknown catalog types", () => {
    const runtime = resolveCatalogRuntime(catalogWithType("flowers"));

    expect(runtime.extension).toBeNull();
    expect(runtime.presentation.supportsBrands).toBe(true);
    expect(runtime.presentation.catalogTabLabel).toBe("Каталог");
    expect(runtime.checkout.availableMethods).toEqual(["DELIVERY", "PICKUP"]);
    expect(runtime.checkout.defaultEnabledMethods).toEqual([]);
    expect(runtime.cart.supportsManagerOrder).toBe(false);
  });

  it("applies restaurant presentation and checkout contract", () => {
    const runtime = resolveCatalogRuntime(catalogWithType("restaurant"));

    expect(runtime.extension).not.toBeNull();
    expect(runtime.presentation.catalogTabLabel).toBe("Меню");
    expect(runtime.presentation.supportsBrands).toBe(false);
    expect(runtime.presentation.supportsCategoryDetails).toBe(false);
    expect(runtime.checkout.availableMethods).toEqual([
      "DELIVERY",
      "PICKUP",
      "PREORDER",
    ]);
    expect(runtime.checkout.defaultEnabledMethods).toEqual([
      "DELIVERY",
      "PICKUP",
    ]);
  });

  it("shares extension comment placeholders across catalog type aliases", () => {
    const restaurantRuntime = resolveCatalogRuntime(
      catalogWithType("restaurant"),
    );
    const cafeRuntime = resolveCatalogRuntime(catalogWithType("cafe"));
    const wholesaleRuntime = resolveCatalogRuntime(catalogWithType("wholesale"));
    const typoWholesaleRuntime = resolveCatalogRuntime(
      catalogWithType("whosale"),
    );
    const defaultRuntime = resolveCatalogRuntime(catalogWithType("flowers"));

    expect(cafeRuntime.checkout.commentPlaceholder).toBe(
      restaurantRuntime.checkout.commentPlaceholder,
    );
    expect(typoWholesaleRuntime.checkout.commentPlaceholder).toBe(
      wholesaleRuntime.checkout.commentPlaceholder,
    );
    expect(cafeRuntime.checkout.commentPlaceholder).not.toBe(
      defaultRuntime.checkout.commentPlaceholder,
    );
    expect(typoWholesaleRuntime.checkout.commentPlaceholder).not.toBe(
      defaultRuntime.checkout.commentPlaceholder,
    );
  });

  it("keeps alias-specific product-card config while using extension behavior", () => {
    const restaurantRuntime = resolveCatalogRuntime(
      catalogWithType("restaurant"),
    );
    const runtime = resolveCatalogRuntime(catalogWithType("cafe"));

    expect(runtime.presentation.catalogTabLabel).toBe(
      restaurantRuntime.presentation.catalogTabLabel,
    );
    expect(runtime.productCard.badges).toEqual(["Cafe"]);
    expect(runtime.productCard.attributes[0]?.key).toBe("cafe_bean_origin");
  });

  it("enables manager order cart for wholesale aliases", () => {
    const runtime = resolveCatalogRuntime(catalogWithType("whosale"));

    expect(runtime.extension).not.toBeNull();
    expect(runtime.cart.supportsManagerOrder).toBe(true);
    expect(runtime.slots.CartCardAction).toBeTruthy();
  });

  it("builds checkout config from resolved runtime contract", () => {
    const catalog = checkoutCatalogWithType("restaurant", catalogSettings({
      checkout: {
        availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
        enabledMethods: ["PREORDER"],
        methodContacts: {},
        methodFields: {},
      },
    }));
    const runtime = resolveCatalogRuntime(catalog);
    const checkoutConfig = getCatalogRuntimeCheckoutConfig(catalog, runtime);

    expect(checkoutConfig.availableMethods).toEqual([
      "DELIVERY",
      "PICKUP",
      "PREORDER",
    ]);
    expect(checkoutConfig.enabledMethods).toEqual(["PREORDER"]);
  });
});
