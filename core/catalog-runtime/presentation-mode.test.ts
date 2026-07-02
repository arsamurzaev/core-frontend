import { describe, expect, it } from "vitest";
import {
  getCatalogPresentationMode,
  isBusinessCardCatalog,
} from "./presentation-mode";

describe("catalog runtime presentation mode", () => {
  it("defaults to full catalog mode", () => {
    expect(getCatalogPresentationMode(null)).toBe("CATALOG");
    expect(getCatalogPresentationMode({ settings: {} })).toBe("CATALOG");
  });

  it("detects business card mode", () => {
    const catalog = { settings: { presentationMode: "BUSINESS_CARD" } };

    expect(getCatalogPresentationMode(catalog)).toBe("BUSINESS_CARD");
    expect(isBusinessCardCatalog(catalog)).toBe(true);
  });
});
