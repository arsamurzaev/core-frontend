import { describe, expect, it } from "vitest";
import {
  buildCreateProductFormFields,
  createProductEditorFormDefaultValues,
} from "./form-config";

describe("createProductEditorFormDefaultValues", () => {
  it("returns isolated nested defaults for every product editor form", () => {
    const first = createProductEditorFormDefaultValues();
    const second = createProductEditorFormDefaultValues();

    first.categoryIds.push("category-1");
    first.attributes.title = "Sneakers";
    first.saleUnits.push({
      label: "Pair",
      baseQuantity: "1",
      price: "1000",
      isDefault: true,
    });
    first.variants.selectedAttributeIds.push("size");
    first.variants.selectedValueIdsByAttributeId.size = ["36"];
    first.variants.combinations["size=36"] = {
      status: "ACTIVE",
      stock: null,
    };

    expect(second.categoryIds).toEqual([]);
    expect(second.attributes).toEqual({});
    expect(second.saleUnits).toEqual([]);
    expect(second.variants).toEqual({
      selectedAttributeIds: [],
      selectedValueIdsByAttributeId: {},
      combinations: {},
    });
  });
});

describe("buildCreateProductFormFields", () => {
  it("uses integer price inputs by default", () => {
    const fields = buildCreateProductFormFields([]);
    const priceField = fields.find((field) => field.name === "price");

    expect(priceField?.inputProps).toMatchObject({
      inputMode: "numeric",
      step: 1,
    });
  });

  it("uses decimal price inputs for wholesale catalogs", () => {
    const fields = buildCreateProductFormFields([], [], "decimal");
    const priceField = fields.find((field) => field.name === "price");

    expect(priceField?.inputProps).toMatchObject({
      inputMode: "decimal",
      step: "0.01",
    });
  });

  it("can disable price editing", () => {
    const fields = buildCreateProductFormFields([], [], "integer", {
      canEditPrice: false,
    });
    const priceField = fields.find((field) => field.name === "price");

    expect(priceField?.disabled).toBe(true);
  });
});
