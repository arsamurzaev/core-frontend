import { describe, expect, it } from "vitest";
import { buildProductEditorCustomFields } from "./product-form-custom-fields";

function fieldNames(
  fields: ReturnType<typeof buildProductEditorCustomFields>,
): string[] {
  return fields.map((field) => String(field.name));
}

describe("buildProductEditorCustomFields", () => {
  it("builds only always-on fields when optional capabilities are disabled", () => {
    const fields = buildProductEditorCustomFields({
      brandOptions: [],
      canUseProductTypes: false,
      categoryOptions: [],
      disableProductTypeField: false,
      includeCategories: false,
      productTypeOptions: [],
      shouldUseBrands: false,
      supportsCategoryDetails: false,
    });

    expect(fieldNames(fields)).toEqual(["hasDiscount"]);
    expect(fields[0]?.label).toBe("Есть скидка");
  });

  it("adds brand, product type, and category fields when capabilities are enabled", () => {
    const onProductTypeChange = () => undefined;
    const fields = buildProductEditorCustomFields({
      brandOptions: [{ label: "Acme", value: "brand-1" }],
      canUseProductTypes: true,
      categoryOptions: [{ label: "Catalog", value: "category-1" }],
      disableProductTypeField: true,
      includeCategories: true,
      onProductTypeChange,
      productTypeOptions: [{ label: "Service", value: "type-1" }],
      shouldUseBrands: true,
      supportsCategoryDetails: true,
    });
    const productTypeField = fields.find(
      (field) => field.name === "productTypeId",
    );
    const categoryField = fields.find((field) => field.name === "categoryIds");

    expect(fieldNames(fields)).toEqual([
      "brandId",
      "productTypeId",
      "categoryIds",
      "hasDiscount",
    ]);
    expect(fields.find((field) => field.name === "brandId")?.label).toBe(
      "Бренд",
    );
    expect(productTypeField?.disabled).toBe(true);
    expect(String(productTypeField?.description)).toContain("MoySklad");
    expect(productTypeField?.render).toEqual(expect.any(Function));
    expect(categoryField?.multiple).toBe(true);
    expect(categoryField?.component).toEqual(expect.any(Function));
  });

  it("uses the default product type select renderer when no change handler is provided", () => {
    const fields = buildProductEditorCustomFields({
      brandOptions: [],
      canUseProductTypes: true,
      categoryOptions: [],
      disableProductTypeField: false,
      includeCategories: false,
      productTypeOptions: [],
      shouldUseBrands: false,
      supportsCategoryDetails: false,
    });
    const productTypeField = fields.find(
      (field) => field.name === "productTypeId",
    );

    expect(productTypeField?.render).toBeUndefined();
    expect(productTypeField?.placeholder).toBe("Без типа");
  });
});
