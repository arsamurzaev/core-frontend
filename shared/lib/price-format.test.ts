import { describe, expect, it } from "vitest";
import {
  formatCatalogPriceInputValue,
  formatCatalogPrice,
  getCatalogPriceInputProps,
  isCatalogPriceValueCompatible,
  normalizeCatalogPriceValue,
} from "./price-format";

describe("price-format", () => {
  it("formats regular catalog prices as integers", () => {
    expect(formatCatalogPrice(1234.56)).toBe("1\u00a0235");
  });

  it("keeps decimals when the decimal price mode is selected", () => {
    expect(formatCatalogPrice(1234.56, "decimal")).toBe("1\u00a0234,56");
  });

  it("hides zero cents in decimal price mode", () => {
    expect(formatCatalogPrice(10, "decimal")).toBe("10");
    expect(formatCatalogPrice(10.5, "decimal")).toBe("10,50");
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
