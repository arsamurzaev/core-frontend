import { toOptionalTrimmedString } from "@/shared/lib/text";
import { sortProductVariantAttributes } from "./product-variant-ordering";

type VariantAttributeLabelLike = {
  attribute?: {
    displayName?: unknown;
    key?: unknown;
  } | null;
  attributeId?: unknown;
  enumValue?: {
    displayName?: unknown;
    value?: unknown;
  } | null;
  enumValueId?: unknown;
};

type VariantLabelLike = {
  attributes?: VariantAttributeLabelLike[] | null;
  label?: unknown;
  variantKey?: unknown;
};

interface FormatProductVariantLabelOptions {
  fallbackToVariantKey?: boolean;
  includeAttributeNames?: boolean;
  separator?: string;
}

function getVariantAttributeName(attribute: VariantAttributeLabelLike): string {
  return (
    toOptionalTrimmedString(attribute.attribute?.displayName) ??
    toOptionalTrimmedString(attribute.attribute?.key) ??
    toOptionalTrimmedString(attribute.attributeId) ??
    ""
  );
}

function getVariantAttributeValue(attribute: VariantAttributeLabelLike): string {
  return (
    toOptionalTrimmedString(attribute.enumValue?.displayName) ??
    toOptionalTrimmedString(attribute.enumValue?.value) ??
    toOptionalTrimmedString(attribute.enumValueId) ??
    ""
  );
}

export function formatProductVariantAttributeLabel(
  attribute: VariantAttributeLabelLike,
  options: Pick<FormatProductVariantLabelOptions, "includeAttributeNames"> = {},
): string | null {
  const value = getVariantAttributeValue(attribute);
  if (!value) {
    return null;
  }

  if (!options.includeAttributeNames) {
    return value;
  }

  const name = getVariantAttributeName(attribute);
  return name ? `${name}: ${value}` : value;
}

export function formatProductVariantLabel(
  variant: VariantLabelLike | null | undefined,
  options: FormatProductVariantLabelOptions = {},
): string | null {
  const explicitLabel = toOptionalTrimmedString(variant?.label);
  if (explicitLabel) {
    return explicitLabel;
  }

  const separator = options.separator ?? " / ";
  const attributeLabel = sortProductVariantAttributes(variant?.attributes)
    .map((attribute) =>
      formatProductVariantAttributeLabel(attribute, {
        includeAttributeNames: options.includeAttributeNames,
      }),
    )
    .filter((value): value is string => Boolean(value))
    .join(separator);

  if (attributeLabel) {
    return attributeLabel;
  }

  return options.fallbackToVariantKey
    ? (toOptionalTrimmedString(variant?.variantKey) ?? null)
    : null;
}
