import { describe, expect, it } from "vitest";
import type { CatalogSettingsDto } from "@/shared/api/generated/react-query";
import { resolveCatalogMode } from "./catalog-mode";

const emptySearchParams = {
  get: () => null,
};

function searchParamsWithMode(mode: string | null) {
  return {
    get: (key: string) => (key === "mode" ? mode : null),
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

describe("resolveCatalogMode", () => {
  it("ignores hall mode for non-restaurant catalogs", () => {
    expect(
      resolveCatalogMode(
        settings({
          allowedModes: ["HALL"],
          defaultMode: "HALL",
        }),
        searchParamsWithMode("HALL"),
        { canUseHallMode: false },
      ),
    ).toBe("DELIVERY");
  });

  it("keeps hall mode for restaurant catalogs", () => {
    expect(
      resolveCatalogMode(
        settings({
          allowedModes: ["DELIVERY", "HALL"],
          defaultMode: "HALL",
        }),
        emptySearchParams,
        { canUseHallMode: true },
      ),
    ).toBe("HALL");
  });
});
