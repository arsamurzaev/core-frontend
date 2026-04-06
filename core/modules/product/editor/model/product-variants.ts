import {
  type AttributeDto,
  type ProductVariantDto,
  type ProductVariantDtoReq,
  type ProductVariantItemDtoReq,
  type SetProductVariantsDtoReq,
} from "@/shared/api/generated/react-query";

export type VariantStatus = "ACTIVE" | "OUT_OF_STOCK" | "DISABLED";

export type VariantItemFormValue = {
  status: VariantStatus;
  stock: number;
};

/** key = enumValueId */
export type VariantAttributeFormValue = Record<string, VariantItemFormValue>;

/** key = attributeId */
export type VariantsFormValue = Record<string, VariantAttributeFormValue>;

export const VARIANT_STATUS_CYCLE: VariantStatus[] = [
  "DISABLED",
  "ACTIVE",
  "OUT_OF_STOCK",
];

export function nextVariantStatus(current: VariantStatus): VariantStatus {
  const index = VARIANT_STATUS_CYCLE.indexOf(current);
  return VARIANT_STATUS_CYCLE[(index + 1) % VARIANT_STATUS_CYCLE.length];
}

export function buildVariantsFormValueFromExisting(
  existingVariants: ProductVariantDto[],
  variantAttributes: AttributeDto[],
): VariantsFormValue {
  const result: VariantsFormValue = {};

  const variantAttributeIds = new Set(variantAttributes.map((a) => a.id));

  for (const variant of existingVariants) {
    for (const attr of variant.attributes) {
      if (!variantAttributeIds.has(attr.attributeId)) {
        continue;
      }

      if (!result[attr.attributeId]) {
        result[attr.attributeId] = {};
      }

      result[attr.attributeId][attr.enumValueId] = {
        status: variant.status as VariantStatus,
        stock: variant.stock,
      };
    }
  }

  return result;
}

export function buildCreateVariantsPayload(
  variantsFormValue: VariantsFormValue,
): ProductVariantDtoReq[] {
  const variants: ProductVariantDtoReq[] = [];

  for (const [attributeId, enumValues] of Object.entries(variantsFormValue)) {
    for (const [enumValueId, item] of Object.entries(enumValues)) {
      if (item.status === "DISABLED") {
        continue;
      }

      variants.push({
        status: item.status,
        stock: item.status === "ACTIVE" ? item.stock : undefined,
        attributes: [{ attributeId, enumValueId }],
      });
    }
  }

  return variants;
}

export function buildSetVariantsPayloads(
  variantsFormValue: VariantsFormValue,
  variantAttributes: AttributeDto[],
): SetProductVariantsDtoReq[] {
  return variantAttributes
    .map((attribute): SetProductVariantsDtoReq => {
      const enumValues = variantsFormValue[attribute.id] ?? {};
      const items: ProductVariantItemDtoReq[] = [];

      for (const [enumValueId, item] of Object.entries(enumValues)) {
        if (item.status === "DISABLED") {
          continue;
        }

        items.push({
          enumValueId,
          status: item.status,
          stock: item.status === "ACTIVE" ? item.stock : undefined,
        });
      }

      return {
        variantAttributeId: attribute.id,
        items,
      };
    })
    .filter((payload) => payload.items.length > 0);
}
