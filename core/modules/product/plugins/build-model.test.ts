import type {
  CatalogCurrentDto,
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildProductCardPluginModel } from "./build-model";
import type { ResolvedProductCardPlugin } from "./contracts";

const plugin: ResolvedProductCardPlugin = {
  key: "test",
  attributes: [],
  badges: [],
  showVariants: true,
};

function catalog(): CatalogCurrentDto {
  return {
    id: "catalog-1",
    slug: "catalog",
    name: "Catalog",
    description: null,
    domain: null,
    logoUrl: null,
    theme: null,
    config: null,
    settings: null,
    contacts: [],
    type: {
      id: "type-default",
      code: "default",
      name: "Default",
      attributes: [],
    },
  } as unknown as CatalogCurrentDto;
}

describe("buildProductCardPluginModel", () => {
  it("builds variant summary from lightweight picker options", () => {
    const model = buildProductCardPluginModel(
      {
        id: "product-1",
        productAttributes: [],
        productType: {
          id: "product-type-1",
          code: "shoes",
          name: "Shoes",
        },
        variantPickerOptions: [
          {
            id: "variant-36",
            label: "36",
            price: "1000",
            stock: null,
            status: "ACTIVE",
            isAvailable: true,
            saleUnitId: null,
            saleUnitPrice: null,
            maxQuantity: null,
          },
          {
            id: "variant-disabled",
            label: "37",
            price: "1000",
            stock: 0,
            status: "DISABLED",
            isAvailable: false,
            saleUnitId: null,
            saleUnitPrice: null,
            maxQuantity: 0,
          },
        ],
      } as ProductWithAttributesDto,
      catalog(),
      plugin,
    );

    expect(model.lines).toContainEqual({
      id: "variants",
      label: "Вариации",
      value: "36",
    });
  });

  it("uses shared variant labels for detailed product variants", () => {
    const model = buildProductCardPluginModel(
      {
        id: "product-1",
        productAttributes: [],
        productType: {
          id: "product-type-1",
          code: "shoes",
          name: "Shoes",
        },
        variantPickerOptions: [],
        variants: [
          {
            id: "variant-36-blue",
            attributes: [
              {
                attribute: {
                  id: "size",
                  key: "size",
                  displayName: "Size",
                },
                attributeId: "size",
                enumValue: {
                  id: "size-36",
                  value: "36",
                  displayName: "36",
                },
                enumValueId: "size-36",
              },
              {
                attribute: {
                  id: "color",
                  key: "color",
                  displayName: "Color",
                },
                attributeId: "color",
                enumValue: {
                  id: "color-blue",
                  value: "blue",
                  displayName: "Blue",
                },
                enumValueId: "color-blue",
              },
            ],
          },
        ],
      } as unknown as ProductWithDetailsDto,
      catalog(),
      plugin,
    );

    expect(model.lines).toContainEqual({
      id: "variants",
      label: "Вариации",
      value: "36 / Blue",
    });
  });
});
