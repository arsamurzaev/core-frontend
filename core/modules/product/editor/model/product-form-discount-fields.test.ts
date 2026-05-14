import {
  AttributeDtoDataType,
  type AttributeDto,
} from "@/shared/api/generated/react-query";
import type {
  DynamicFieldConfig,
  DynamicFieldRenderProps,
} from "@/shared/ui/dynamic-form";
import { describe, expect, it } from "vitest";
import type { CreateProductFormValues } from "./form-config";
import {
  patchProductDiscountFields,
  type ProductDiscountLinkedFieldMode,
} from "./product-form-discount-fields";

const NOW = "2026-05-13T00:00:00.000Z";

function attribute(overrides: Partial<AttributeDto> = {}): AttributeDto {
  return {
    id: "attribute-1",
    typeIds: [],
    key: "discount",
    displayName: "Discount",
    dataType: AttributeDtoDataType.DECIMAL,
    isRequired: false,
    isVariantAttribute: false,
    isFilterable: false,
    displayOrder: 1,
    isHidden: false,
    createdAt: NOW,
    updatedAt: NOW,
    enumValues: [],
    ...overrides,
  };
}

function field(name: string): DynamicFieldConfig<CreateProductFormValues> {
  return {
    name: name as DynamicFieldConfig<CreateProductFormValues>["name"],
    label: name,
    kind: "text",
  };
}

function component(props: DynamicFieldRenderProps<CreateProductFormValues>) {
  void props;
  return null;
}

describe("patchProductDiscountFields", () => {
  it("returns the same fields when discount attributes are absent", () => {
    const fields = [field("name")];

    expect(
      patchProductDiscountFields({
        fields,
        productAttributes: [],
        renderDiscountDateRangeField: () => component,
        renderDiscountLinkedField: () => component,
        shouldUsePercentDiscountOnly: false,
      }),
    ).toBe(fields);
  });

  it("wires linked discount fields and hides the separate range end field", () => {
    const linkedCalls: Array<{
      mode: ProductDiscountLinkedFieldMode;
      relatedAttributeId?: string;
    }> = [];
    const dateRangeCalls: Array<{ relatedAttributeId: string }> = [];

    const result = patchProductDiscountFields({
      fields: [
        field("attributes.discount"),
        field("attributes.discounted-price"),
        field("attributes.discount-start"),
        field("attributes.discount-end"),
        field("name"),
      ],
      productAttributes: [
        attribute({ id: "discount", key: "discount" }),
        attribute({ id: "discounted-price", key: "discountedprice" }),
        attribute({ id: "discount-start", key: "discountstartat" }),
        attribute({ id: "discount-end", key: "discountendat" }),
      ],
      renderDiscountDateRangeField: (params) => {
        dateRangeCalls.push(params);
        return component;
      },
      renderDiscountLinkedField: (params) => {
        linkedCalls.push(params);
        return component;
      },
      shouldUsePercentDiscountOnly: false,
    });

    expect(result.map((entry) => String(entry.name))).toEqual([
      "attributes.discount",
      "attributes.discounted-price",
      "attributes.discount-start",
      "name",
    ]);
    expect(
      result.find((entry) => entry.name === "attributes.discount")?.component,
    ).toBe(component);
    expect(
      result.find((entry) => entry.name === "attributes.discount-start")
        ?.component,
    ).toBe(component);
    expect(linkedCalls).toEqual([
      { mode: "discount", relatedAttributeId: "discounted-price" },
      { mode: "discounted-price", relatedAttributeId: "discount" },
    ]);
    expect(dateRangeCalls).toEqual([
      { relatedAttributeId: "discount-end" },
    ]);
  });

  it("does not link discount percent to discounted price in percent-only mode", () => {
    const linkedCalls: Array<{
      mode: ProductDiscountLinkedFieldMode;
      relatedAttributeId?: string;
    }> = [];

    patchProductDiscountFields({
      fields: [
        field("attributes.discount"),
        field("attributes.discounted-price"),
      ],
      productAttributes: [
        attribute({ id: "discount", key: "discount" }),
        attribute({ id: "discounted-price", key: "discountedprice" }),
      ],
      renderDiscountDateRangeField: () => component,
      renderDiscountLinkedField: (params) => {
        linkedCalls.push(params);
        return component;
      },
      shouldUsePercentDiscountOnly: true,
    });

    expect(linkedCalls[0]).toEqual({
      mode: "discount",
      relatedAttributeId: undefined,
    });
  });
});
