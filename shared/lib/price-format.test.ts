import { describe, expect, it } from "vitest";
import {
  formatCatalogPriceInputValue,
  formatCatalogPrice,
  getCatalogPriceInputProps,
  getCatalogPriceFormatMode,
  isCatalogPriceValueCompatible,
  normalizeCatalogPriceValue,
} from "./price-format";

describe("price-format", () => {
  it("formats regular catalog prices as integers", () => {
    expect(formatCatalogPrice(1234.56)).toBe("1\u00a0235");
  });

  it("keeps decimals for wholesale catalog prices", () => {
    const mode = getCatalogPriceFormatMode({
      type: {
        code: "wholesale",
      },
    });

    expect(mode).toBe("decimal");
    expect(formatCatalogPrice(1234.56, mode)).toBe("1\u00a0234,56");
  });

  it("hides zero cents for wholesale catalog prices", () => {
    expect(formatCatalogPrice(10, "decimal")).toBe("10");
    expect(formatCatalogPrice(10.5, "decimal")).toBe("10,50");
  });

  it("supports the legacy wholesale type alias", () => {
    expect(
      getCatalogPriceFormatMode({
        type: {
          code: "whosale",
        },
      }),
    ).toBe("decimal");
  });

  it("returns price input props by catalog price mode", () => {
    expect(getCatalogPriceInputProps("integer")).toEqual({
      inputMode: "numeric",
      step: 1,
    });
    expect(getCatalogPriceInputProps("decimal")).toEqual({
      inputMode: "decimal",
      step: "0.01",
    });
  });

  it("normalizes admin price values by mode", () => {
    expect(normalizeCatalogPriceValue(10.5, "integer")).toBe(11);
    expect(normalizeCatalogPriceValue(10.555, "decimal")).toBe(10.56);
    expect(formatCatalogPriceInputValue(10, "decimal")).toBe("10");
    expect(formatCatalogPriceInputValue(10.5, "decimal")).toBe("10.50");
  });

  it("checks whether admin price values match the catalog mode", () => {
    expect(isCatalogPriceValueCompatible(10, "integer")).toBe(true);
    expect(isCatalogPriceValueCompatible(10.5, "integer")).toBe(false);
    expect(isCatalogPriceValueCompatible(10.5, "decimal")).toBe(true);
    expect(isCatalogPriceValueCompatible(10.555, "decimal")).toBe(false);
  });
});
