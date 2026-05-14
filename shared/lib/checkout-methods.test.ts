import { describe, expect, it } from "vitest";
import type {
  CatalogCurrentDto,
  CatalogSettingsDto,
} from "@/shared/api/generated/react-query";
import { getCatalogCheckoutConfig } from "./checkout-methods";

function catalogType(code: string): CatalogCurrentDto["type"] {
  return {
    id: `type-${code}`,
    code,
    name: code,
    attributes: [],
  };
}

function settings(
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

function catalog(
  catalogSettings: CatalogSettingsDto | null = null,
): Pick<CatalogCurrentDto, "type" | "settings" | "contacts"> {
  return {
    contacts: [],
    settings: catalogSettings,
    type: catalogType("restaurant"),
  };
}

describe("getCatalogCheckoutConfig", () => {
  it("uses generic default checkout methods without catalog-type branches", () => {
    const config = getCatalogCheckoutConfig(catalog());

    expect(config.availableMethods).toEqual(["DELIVERY", "PICKUP"]);
    expect(config.enabledMethods).toEqual([]);
  });

  it("accepts runtime-provided available and default enabled methods", () => {
    const config = getCatalogCheckoutConfig(catalog(), {
      availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
      defaultEnabledMethods: ["DELIVERY", "PICKUP"],
    });

    expect(config.availableMethods).toEqual([
      "DELIVERY",
      "PICKUP",
      "PREORDER",
    ]);
    expect(config.enabledMethods).toEqual(["DELIVERY", "PICKUP"]);
  });

  it("lets catalog settings override runtime defaults within available methods", () => {
    const config = getCatalogCheckoutConfig(
      catalog(settings({
        checkout: {
          availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
          enabledMethods: ["PREORDER", "UNKNOWN"] as unknown as CatalogSettingsDto["checkout"]["enabledMethods"],
          methodContacts: {},
          methodFields: {},
        },
      })),
      {
        availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
        defaultEnabledMethods: ["DELIVERY"],
      },
    );

    expect(config.enabledMethods).toEqual(["PREORDER"]);
  });
});
