import {
  AttributeDtoDataType,
  type AttributeDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { CREATE_PRODUCT_FORM_DEFAULT_VALUES } from "@/core/modules/product/editor/model/form-config";
import { parseCreateProductPayload } from "./create-product-drawer-data";

const NOW = "2026-05-13T00:00:00.000Z";

function attribute(overrides: Partial<AttributeDto> = {}): AttributeDto {
  return {
    id: "attribute-1",
    typeIds: [],
    key: "size",
    displayName: "Size",
    dataType: AttributeDtoDataType.ENUM,
    isRequired: false,
    isVariantAttribute: true,
    isFilterable: false,
    displayOrder: 1,
    isHidden: false,
    createdAt: NOW,
    updatedAt: NOW,
    enumValues: [],
    ...overrides,
  };
}

describe("create product drawer data", () => {
  it("omits brand id when brand is cleared", () => {
    const payload = parseCreateProductPayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        brandId: "",
      },
      mediaIds: [],
      normalizedPrice: 1000,
      productAttributes: [],
      variantAttributes: [],
      canUseProductTypes: true,
      canUseProductVariants: true,
      canUseCatalogSaleUnits: false,
    });

    expect(payload).not.toHaveProperty("brandId");
  });

  it("keeps base sale units when variants feature is disabled", () => {
    expect(
      parseCreateProductPayload({
        formValues: {
          ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
          name: "Box",
          price: "1000",
          saleUnits: [
            {
              catalogSaleUnitId: "box",
              catalogSaleUnitName: "Box",
              label: "",
              baseQuantity: "12",
              price: "950",
              isDefault: true,
            },
          ],
        },
        mediaIds: [],
        normalizedPrice: 1000,
        productAttributes: [],
        variantAttributes: [attribute()],
        canUseProductTypes: true,
        canUseProductVariants: false,
        canUseCatalogSaleUnits: true,
      }),
    ).toMatchObject({
      name: "Box",
      price: 1000,
      variants: [
        {
          price: 1000,
          status: "ACTIVE",
          saleUnits: [
            {
              catalogSaleUnitId: "box",
              baseQuantity: 12,
              price: 950,
              isDefault: true,
            },
          ],
        },
      ],
    });
  });
});
