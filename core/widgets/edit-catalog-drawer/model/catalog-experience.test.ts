import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  canUseHallCatalogExperience,
  getCatalogExperienceDefaultValues,
  getCatalogExperienceOptions,
} from "./catalog-experience";

function catalog(
  typeCode: string,
  settings: Partial<CatalogCurrentDto["settings"]> | null = null,
) {
  return {
    settings,
    type: {
      code: typeCode,
    },
  } as CatalogCurrentDto;
}

describe("catalog experience modes", () => {
  it("keeps hall mode available for restaurant catalogs", () => {
    const restaurant = catalog("restaurant");

    expect(canUseHallCatalogExperience(restaurant)).toBe(true);
    expect(getCatalogExperienceOptions(restaurant).map((item) => item.value)).toContain(
      "HALL",
    );
  });

  it("keeps hall mode available for cafe catalogs", () => {
    expect(canUseHallCatalogExperience(catalog("cafe"))).toBe(true);
  });

  it("removes hall mode from non-restaurant catalogs", () => {
    const store = catalog("clothes");

    expect(canUseHallCatalogExperience(store)).toBe(false);
    expect(getCatalogExperienceOptions(store).map((item) => item.value)).toEqual([
      "DELIVERY",
      "BROWSE",
    ]);
  });

  it("normalizes old hall settings away for non-restaurant catalogs", () => {
    const values = getCatalogExperienceDefaultValues(
      catalog("clothes", {
        allowedModes: ["HALL"],
        defaultMode: "HALL",
      }),
    );

    expect(values).toEqual({
      allowedModes: ["DELIVERY"],
      defaultMode: "DELIVERY",
    });
  });
});
