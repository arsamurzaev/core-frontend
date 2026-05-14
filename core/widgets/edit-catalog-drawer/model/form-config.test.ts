import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import { METHOD_FIELDS, type CheckoutConfig } from "@/shared/lib/checkout-methods";
import { describe, expect, it } from "vitest";
import { buildCatalogEditFormDefaultValues } from "./form-config";

function catalog(): CatalogCurrentDto {
  return {
    id: "catalog-1",
    slug: "cafe",
    domain: null,
    typeId: "type-restaurant",
    parentId: null,
    userId: null,
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    subscriptionEndsAt: null,
    contacts: [],
    config: {
      about: "Coffee and food",
      status: "OPERATIONAL",
      description: "A small cafe catalog.",
      currency: "RUB",
      logoMedia: null,
      bgMedia: null,
      note: null,
    },
    features: {
      inventoryMode: "NONE",
      canUseProductTypes: false,
      canUseProductVariants: false,
      canUseCatalogSaleUnits: false,
      canUseInternalInventory: false,
      canUseMoySkladIntegration: false,
      raw: {},
      effective: {},
      definitions: [],
      items: [],
    },
    metrics: [],
    name: "Cafe",
    settings: null,
    seo: null,
    type: {
      id: "type-restaurant",
      code: "restaurant",
      name: "Restaurant",
      attributes: [],
    },
  };
}

describe("buildCatalogEditFormDefaultValues", () => {
  it("uses checkout config supplied by catalog runtime", () => {
    const checkoutConfig: CheckoutConfig = {
      availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
      enabledMethods: ["DELIVERY", "PICKUP"],
      methodContacts: {
        PREORDER: {
          TELEGRAM: "@cafe",
        },
      },
      methodFields: METHOD_FIELDS,
    };

    const values = buildCatalogEditFormDefaultValues(catalog(), {
      checkoutConfig,
    });

    expect(values.checkoutEnabledMethods).toEqual(["DELIVERY", "PICKUP"]);
    expect(values.checkoutContacts.PREORDER?.TELEGRAM).toBe("@cafe");
  });
});
