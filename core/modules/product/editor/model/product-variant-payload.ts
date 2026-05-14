import {
  type AttributeDto,
  type ProductVariantDto,
  type ProductVariantDtoReq,
  type SetProductVariantMatrixDtoReq,
} from "@/shared/api/generated/react-query";
import {
  buildSaleUnitsFormValueFromUnknown,
  normalizeSaleUnitsForPayload,
  type PayloadWithSaleUnits,
} from "./product-sale-units";
import { createEmptyVariantsFormValue } from "./product-variant-form";
import {
  buildVariantCombinationKey,
  buildVariantMatrixRows,
  orderVariantCombinationAttributes,
} from "./product-variant-matrix";
import {
  type VariantCombinationAttributeValue,
  type VariantStatus,
  type VariantsFormValue,
} from "./product-variant-types";

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function buildVariantsFormValueFromExisting(
  existingVariants: ProductVariantDto[],
  variantAttributes: AttributeDto[],
): VariantsFormValue {
  const result = createEmptyVariantsFormValue();
  const selectedAttributeIds = new Set<string>();
  const selectedValueIdsByAttributeId = new Map<string, Set<string>>();
  const variantAttributeIds = new Set(variantAttributes.map((a) => a.id));

  for (const variant of existingVariants) {
    const attributes = orderVariantCombinationAttributes(
      (variant.attributes ?? [])
        .flatMap((attribute): VariantCombinationAttributeValue[] => {
          if (
            !variantAttributeIds.has(attribute.attributeId) ||
            !attribute.enumValueId
          ) {
            return [];
          }

          return [
            {
              attributeId: attribute.attributeId,
              enumValueId: attribute.enumValueId,
            },
          ];
        }),
      variantAttributes,
    );

    if (attributes.length === 0) {
      continue;
    }

    for (const attribute of attributes) {
      selectedAttributeIds.add(attribute.attributeId);

      let selectedValueIds = selectedValueIdsByAttributeId.get(
        attribute.attributeId,
      );
      if (!selectedValueIds) {
        selectedValueIds = new Set<string>();
        selectedValueIdsByAttributeId.set(attribute.attributeId, selectedValueIds);
      }
      selectedValueIds.add(attribute.enumValueId);
    }

    const key = buildVariantCombinationKey(attributes, variantAttributes);
    result.combinations[key] = {
      ...(variant.price !== null ? { price: variant.price } : {}),
      saleUnits: buildSaleUnitsFormValueFromUnknown(
        (variant as { saleUnits?: unknown }).saleUnits,
      ),
      status: variant.status as VariantStatus,
      stock: variant.stock,
    };
  }

  result.selectedAttributeIds = variantAttributes
    .filter((attribute) => selectedAttributeIds.has(attribute.id))
    .map((attribute) => attribute.id);

  for (const attribute of variantAttributes) {
    const selectedValueIds = selectedValueIdsByAttributeId.get(attribute.id);
    if (!selectedValueIds) {
      continue;
    }

    result.selectedValueIdsByAttributeId[attribute.id] = (
      attribute.enumValues ?? []
    )
      .map((enumValue) => enumValue.id)
      .filter((enumValueId) => selectedValueIds.has(enumValueId));
  }

  return result;
}

export function buildCreateVariantsPayload(
  variantsFormValue: unknown,
  variantAttributes: AttributeDto[] = [],
): PayloadWithSaleUnits<ProductVariantDtoReq>[] {
  if (variantAttributes.length === 0) {
    return [];
  }

  return buildVariantMatrixRows(variantsFormValue, variantAttributes)
    .filter((row) => row.item.status !== "DISABLED")
    .map((row) => {
      const saleUnits = normalizeSaleUnitsForPayload(row.item.saleUnits);
      const price = toOptionalNumber(row.item.price);

      return {
        ...(price !== null ? { price } : {}),
        status: row.item.status,
        stock: row.item.status === "ACTIVE" ? row.item.stock : 0,
        attributes: row.attributes.map((attribute) => ({
          attributeId: attribute.attributeId,
          enumValueId: attribute.enumValueId,
        })),
        ...(saleUnits.length > 0 ? { saleUnits } : {}),
      };
    });
}

export function buildSetVariantMatrixPayload(
  variantsFormValue: unknown,
  variantAttributes: AttributeDto[],
): SetProductVariantMatrixDtoReq {
  return {
    items: buildCreateVariantsPayload(variantsFormValue, variantAttributes),
  };
}
