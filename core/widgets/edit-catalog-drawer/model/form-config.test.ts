import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import {
  DEFAULT_PREORDER_SETTINGS,
  METHOD_FIELDS,
  type CheckoutConfig,
} from "@/shared/lib/checkout-methods";
import { describe, expect, it } from "vitest";
import {
  buildCatalogEditFormDefaultValues,
  buildCatalogEditUpdatePayload,
} from "./form-config";

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
      canUseIikoIntegration: false,
      canUseOneCIntegration: false,
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
      preorder: {
        minLeadTimeMinutes: 45,
        maxAdvanceDays: 10,
      },
    };

    const values = buildCatalogEditFormDefaultValues(catalog(), {
      checkoutConfig,
    });

    expect(values.checkoutEnabledMethods).toEqual(["DELIVERY", "PICKUP"]);
    expect(values.checkoutContacts.PREORDER?.TELEGRAM).toBe("@cafe");
    expect(values.preorderMinLeadTimeMinutes).toBe(45);
    expect(values.preorderMaxAdvanceDays).toBe(10);
  });

  it("includes preorder settings in update payload", () => {
    const values = buildCatalogEditFormDefaultValues(catalog(), {
      checkoutConfig: {
        availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
        enabledMethods: ["PREORDER"],
        methodContacts: {},
        methodFields: METHOD_FIELDS,
        preorder: DEFAULT_PREORDER_SETTINGS,
      },
    });

    const payload = buildCatalogEditUpdatePayload({
      ...values,
      preorderMinLeadTimeMinutes: 60,
      preorderMaxAdvanceDays: 21,
    });

    expect(payload.checkout).toMatchObject({
      enabledMethods: ["PREORDER"],
      preorder: {
        minLeadTimeMinutes: 60,
        maxAdvanceDays: 21,
      },
    });
  });
});
