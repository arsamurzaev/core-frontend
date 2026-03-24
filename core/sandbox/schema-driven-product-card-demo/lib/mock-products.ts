import {
  AttributeDtoDataType,
  MediaDtoStatus,
  ProductWithAttributesDtoStatus,
  type AttributeDto,
  type AttributeEnumValueDto,
  type CatalogTypeDto,
  type ProductAttributeDto,
  type ProductAttributeRefDtoDataType,
  type ProductWithAttributesDto,
} from "@/shared/api/generated";
import { CAFE_BEAN_ORIGIN_KEY, OUTERWEAR_SIZE_KEY } from "../model/constants";

const NOW_ISO = "2026-02-17T00:00:00.000Z";

function toProductDataType(
  dataType: AttributeDto["dataType"],
): ProductAttributeRefDtoDataType {
  return dataType as ProductAttributeRefDtoDataType;
}

function createFallbackEnumValues(
  attributeId: string,
): AttributeEnumValueDto[] {
  return ["S", "M", "L", "XL"].map((size, index) => ({
    id: `${attributeId}-${size.toLowerCase()}`,
    attributeId,
    value: size,
    displayName: size,
    displayOrder: index + 1,
    isSystem: true,
    businessId: null,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  }));
}

function resolveTypeAttribute(
  catalogType: CatalogTypeDto,
  key: string,
  fallback: {
    displayName: string;
    dataType: AttributeDto["dataType"];
    isVariantAttribute: boolean;
    enumValues?: AttributeEnumValueDto[];
  },
): AttributeDto {
  const existing = catalogType.attributes.find((attribute) => attribute.key === key);
  if (existing) return existing;

  return {
    id: `demo-attr-${key}`,
    typeIds: [catalogType.id],
    key,
    displayName: fallback.displayName,
    dataType: fallback.dataType,
    isRequired: false,
    isVariantAttribute: fallback.isVariantAttribute,
    isFilterable: true,
    displayOrder: 999,
    isHidden: false,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    enumValues: fallback.enumValues,
  };
}

function buildProductAttribute(
  attribute: AttributeDto,
  options: {
    valueString?: string;
    enumValue?: AttributeEnumValueDto;
  },
): ProductAttributeDto {
  return {
    id: `demo-product-attr-${attribute.key}`,
    attributeId: attribute.id,
    enumValueId: options.enumValue?.id ?? null,
    valueString: options.valueString ?? null,
    valueInteger: null,
    valueDecimal: null,
    valueBoolean: null,
    valueDateTime: null,
    attribute: {
      id: attribute.id,
      key: attribute.key,
      displayName: attribute.displayName,
      dataType: toProductDataType(attribute.dataType),
      isRequired: attribute.isRequired,
      isVariantAttribute: attribute.isVariantAttribute,
      isFilterable: attribute.isFilterable,
      displayOrder: attribute.displayOrder,
      isHidden: attribute.isHidden,
    },
    enumValue: options.enumValue ?? null,
  };
}

function createBaseProduct(
  id: string,
  name: string,
  slug: string,
  price: string,
  imageUrl: string,
  attributes: ProductAttributeDto[],
): ProductWithAttributesDto {
  return {
    id,
    sku: `SKU-${id.toUpperCase()}`,
    name,
    slug,
    price,
    brand: null,
    categories: [],
    media: [
      {
        position: 0,
        kind: "image",
        media: {
          id: `media-${id}`,
          originalName: `${slug}.jpg`,
          mimeType: "image/jpeg",
          size: null,
          width: null,
          height: null,
          status: MediaDtoStatus.READY,
          key: `demo/${slug}.jpg`,
          url: imageUrl,
          variants: [],
        },
      },
    ],
    isPopular: false,
    status: ProductWithAttributesDtoStatus.ACTIVE,
    position: 1,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    productAttributes: attributes,
  };
}

export function createRestaurantDemoProduct(
  catalogType: CatalogTypeDto,
): ProductWithAttributesDto {
  const beanAttribute = resolveTypeAttribute(catalogType, CAFE_BEAN_ORIGIN_KEY, {
    displayName: "Размер зерна",
    dataType: AttributeDtoDataType.STRING,
    isVariantAttribute: false,
  });

  return createBaseProduct(
    "demo-restaurant-burger",
    "Бургер Трюфель",
    "demo-restaurant-burger",
    "590",
    "/not-found-photo.png",
    [
      buildProductAttribute(beanAttribute, {
        valueString: "Мелкий",
      }),
    ],
  );
}

export function createClothingDemoProduct(
  catalogType: CatalogTypeDto,
): ProductWithAttributesDto {
  const outerwearAttribute = resolveTypeAttribute(catalogType, OUTERWEAR_SIZE_KEY, {
    displayName: "Размер",
    dataType: AttributeDtoDataType.ENUM,
    isVariantAttribute: true,
    enumValues: createFallbackEnumValues(`demo-attr-${OUTERWEAR_SIZE_KEY}`),
  });

  const enumValues = outerwearAttribute.enumValues ?? [];
  const selectedSize = enumValues[enumValues.length - 1] ?? null;

  return createBaseProduct(
    "demo-clothing-jacket",
    "Куртка Storm Lite",
    "demo-clothing-jacket",
    "7990",
    "/not-found-photo.png",
    [
      buildProductAttribute(outerwearAttribute, {
        enumValue: selectedSize ?? undefined,
        valueString: selectedSize ? undefined : "XL",
      }),
    ],
  );
}
