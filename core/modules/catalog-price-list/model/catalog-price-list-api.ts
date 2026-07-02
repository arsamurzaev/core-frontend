"use client";

import {
  buildVariantMatrixRows,
  type CreateProductFormValues,
  type SaleUnitFormValue,
} from "@/core/modules/product/editor";
import { apiClient } from "@/shared/api/client";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import {
  isCatalogPriceValueCompatible,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { useQuery } from "@tanstack/react-query";

export type CatalogPriceList = {
  id: string;
  catalogId: string;
  code: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
  deleteAt: string | null;
};

export type CatalogPriceListPriceTarget = "PRODUCT" | "VARIANT" | "SALE_UNIT";

export type CatalogPriceListPrice = {
  id: string;
  priceListId: string;
  target: CatalogPriceListPriceTarget;
  targetId: string;
  productId: string;
  variantId: string | null;
  saleUnitId: string | null;
  price: string;
  deleteAt: string | null;
};

export type CatalogPriceListListFilters = {
  includeArchived?: boolean;
  includeInactive?: boolean;
};

export type CatalogPriceListPayload = {
  code?: string;
  displayOrder?: number;
  isActive?: boolean;
  name?: string;
};

export type CreateCatalogPriceListPayload = CatalogPriceListPayload & {
  name: string;
};

export type CatalogPriceListPricePayload = {
  target: CatalogPriceListPriceTarget;
  targetId: string;
  price: number | null;
};

export type CreateProductPriceListVariantAttributePayload = {
  attributeId: string;
  enumValueId: string;
};

export type CreateProductPriceListPricePayload = {
  priceListId: string;
  target: CatalogPriceListPriceTarget;
  price: number;
  variantAttributes?: CreateProductPriceListVariantAttributePayload[];
  catalogSaleUnitId?: string;
};

export type CreateProductPriceListPriceDraft = Omit<
  CreateProductPriceListPricePayload,
  "price"
> & {
  price: string;
  rowKey: string;
};

export type ProductPriceListPriceDraft = {
  priceListId: string;
  rowKey: string;
  target: CatalogPriceListPriceTarget;
  targetId: string;
  price: string;
};

export type ProductPriceListBulkPricesPayload = {
  priceListId: string;
  prices: CatalogPriceListPricePayload[];
};

export type ProductPriceListSaleUnitSource = {
  id: string;
  catalogSaleUnitId?: string | null;
  code?: string | null;
  name?: string | null;
  baseQuantity?: string | number | null;
};

export type ProductPriceListVariantSource = {
  id: string;
  variantKey?: string | null;
  sku?: string | null;
  kind?: string | null;
  saleUnits?: ProductPriceListSaleUnitSource[] | null;
  attributes?: Array<{
    attribute?: { displayName?: string | null; key?: string | null } | null;
    enumValue?: { displayName?: string | null; value?: string | null } | null;
  }> | null;
};

export type ProductPriceListProductSource = {
  id: string;
  name?: string | null;
  variants?: ProductPriceListVariantSource[] | null;
  saleUnits?: ProductPriceListSaleUnitSource[] | null;
};

export type ProductPriceListTargetRow = {
  key: string;
  label: string;
  target: CatalogPriceListPriceTarget;
  targetId: string;
  stableKeys: string[];
};

type BuildProductPriceListFormSourceParams = {
  canUseCatalogSaleUnits?: boolean;
  canUseProductVariants?: boolean;
  formValues: CreateProductFormValues;
  product?: ProductPriceListProductSource | null;
  variantAttributes?: AttributeDto[];
};

function parseOptionalCatalogPrice(
  value: string,
  priceFormatMode: CatalogPriceFormatMode,
): number | null {
  const rawPrice = value.trim().replace(",", ".");
  if (!rawPrice) {
    return null;
  }

  const price = Number(rawPrice);
  if (!isCatalogPriceValueCompatible(price, priceFormatMode)) {
    throw new Error("Укажите корректную цену прайс-листа.");
  }

  return price;
}

export function buildCreateProductPriceListPricesPayload(
  drafts: CreateProductPriceListPriceDraft[],
  priceFormatMode: CatalogPriceFormatMode = "integer",
): CreateProductPriceListPricePayload[] {
  return drafts.flatMap((draft): CreateProductPriceListPricePayload[] => {
    const rawPrice = draft.price.trim().replace(",", ".");
    if (!rawPrice) {
      return [];
    }

    const price = Number(rawPrice);
    if (!isCatalogPriceValueCompatible(price, priceFormatMode)) {
      throw new Error("Укажите корректную цену прайс-листа.");
    }

    return [
      {
        priceListId: draft.priceListId,
        target: draft.target,
        price,
        ...(draft.variantAttributes?.length
          ? { variantAttributes: draft.variantAttributes }
          : {}),
        ...(draft.catalogSaleUnitId
          ? { catalogSaleUnitId: draft.catalogSaleUnitId }
          : {}),
      },
    ];
  });
}

function isDefaultVariant(variant: ProductPriceListVariantSource): boolean {
  return variant.kind === "DEFAULT" || variant.variantKey === "default";
}

function normalizeStableValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeQuantityKey(value: unknown): string {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toFixed(4)
    : normalizeStableValue(value);
}

function buildVariantLabel(variant: ProductPriceListVariantSource): string {
  const attributeLabel = (variant.attributes ?? [])
    .map((item) => {
      const attributeName =
        item.attribute?.displayName ?? item.attribute?.key ?? "";
      const valueName =
        item.enumValue?.displayName ?? item.enumValue?.value ?? "";
      return [attributeName, valueName].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .join(", ");

  return attributeLabel || variant.sku || variant.variantKey || "Вариант";
}

function getAttributeStableKey(attribute: AttributeDto | undefined): string {
  return attribute?.key ?? attribute?.displayName ?? attribute?.id ?? "";
}

function getEnumStableValue(
  attribute: AttributeDto | undefined,
  enumValueId: string,
): string {
  const enumValue = (attribute?.enumValues ?? []).find(
    (value) => value.id === enumValueId,
  );

  return enumValue?.value ?? enumValue?.displayName ?? enumValueId;
}

function buildVariantKeyFromAttributes(
  attributes: CreateProductPriceListVariantAttributePayload[],
  variantAttributes: AttributeDto[] = [],
): string {
  const attributeMap = new Map(
    variantAttributes.map((attribute) => [attribute.id, attribute]),
  );

  return attributes
    .map((attributeValue) => {
      const attribute = attributeMap.get(attributeValue.attributeId);
      const attributeKey =
        getAttributeStableKey(attribute) || attributeValue.attributeId;

      return `${attributeKey}=${getEnumStableValue(
        attribute,
        attributeValue.enumValueId,
      )}`;
    })
    .join(";");
}

function normalizeFormSaleUnit(
  unit: SaleUnitFormValue,
  index: number,
): ProductPriceListSaleUnitSource | null {
  const catalogSaleUnitId = unit.catalogSaleUnitId?.trim();
  const name =
    unit.catalogSaleUnitName?.trim() ||
    unit.label?.trim() ||
    catalogSaleUnitId ||
    "";
  const id =
    unit.id?.trim() || (catalogSaleUnitId ? `draft:${catalogSaleUnitId}` : "");

  if (!id || !name) return null;

  return {
    id,
    catalogSaleUnitId: catalogSaleUnitId || null,
    name,
    baseQuantity: unit.baseQuantity,
    code: catalogSaleUnitId ? null : `draft-${index}`,
  };
}

export function buildProductPriceListProductSourceFromForm({
  canUseCatalogSaleUnits = false,
  canUseProductVariants = false,
  formValues,
  product,
  variantAttributes = [],
}: BuildProductPriceListFormSourceParams): ProductPriceListProductSource {
  const productId = product?.id ?? "draft-product";
  const variantRows =
    canUseProductVariants && variantAttributes.length > 0
      ? buildVariantMatrixRows(formValues.variants, variantAttributes).filter(
          (row) => row.item.status !== "DISABLED",
        )
      : [];

  if (variantRows.length > 0) {
    return {
      id: productId,
      name: formValues.name || product?.name,
      variants: variantRows.map((row) => ({
        id: `draft-variant:${row.key}`,
        variantKey: buildVariantKeyFromAttributes(
          row.attributes,
          variantAttributes,
        ),
        sku: null,
        kind: "MATRIX",
        attributes: row.attributes.map((attributeValue) => {
          const attribute = variantAttributes.find(
            (item) => item.id === attributeValue.attributeId,
          );
          const enumValue = attribute?.enumValues?.find(
            (value) => value.id === attributeValue.enumValueId,
          );

          return {
            attribute: {
              displayName: attribute?.displayName ?? null,
              key: attribute?.key ?? null,
            },
            enumValue: {
              displayName: enumValue?.displayName ?? null,
              value: enumValue?.value ?? attributeValue.enumValueId,
            },
          };
        }),
        saleUnits: canUseCatalogSaleUnits
          ? (row.item.saleUnits ?? []).flatMap((unit, unitIndex) => {
              const saleUnit = normalizeFormSaleUnit(unit, unitIndex);
              if (!saleUnit) return [];

              return [
                {
                  ...saleUnit,
                  id: saleUnit.id.startsWith("draft:")
                    ? `${saleUnit.id}:variant:${row.key}`
                    : saleUnit.id,
                },
              ];
            })
          : [],
      })),
    };
  }

  return {
    id: productId,
    name: formValues.name || product?.name,
    saleUnits: canUseCatalogSaleUnits
      ? (formValues.saleUnits ?? []).flatMap((unit, index) => {
          const saleUnit = normalizeFormSaleUnit(unit, index);
          return saleUnit ? [saleUnit] : [];
        })
      : [],
    variants: null,
  };
}

function buildVariantStableKeys(
  variant: ProductPriceListVariantSource | null,
): string[] {
  if (!variant) return ["variant:default"];

  return [
    isDefaultVariant(variant) ? "variant:default" : null,
    `variant:id:${variant.id}`,
    variant.variantKey
      ? `variant:key:${normalizeStableValue(variant.variantKey)}`
      : null,
    variant.sku ? `variant:sku:${normalizeStableValue(variant.sku)}` : null,
  ].filter((key): key is string => Boolean(key));
}

function buildSaleUnitStableKeys(
  saleUnit: ProductPriceListSaleUnitSource,
  variant: ProductPriceListVariantSource | null,
): string[] {
  const variantKeys = buildVariantStableKeys(variant);
  const identityKeys = [
    `id:${saleUnit.id}`,
    saleUnit.catalogSaleUnitId ? `catalog:${saleUnit.catalogSaleUnitId}` : null,
    saleUnit.code ? `code:${normalizeStableValue(saleUnit.code)}` : null,
    saleUnit.name
      ? `name:${normalizeStableValue(saleUnit.name)}:qty:${normalizeQuantityKey(
          saleUnit.baseQuantity,
        )}`
      : null,
  ].filter((key): key is string => Boolean(key));

  return variantKeys.flatMap((variantKey) =>
    identityKeys.map((identityKey) => `sale-unit:${variantKey}:${identityKey}`),
  );
}

export function buildProductPriceListRows(
  product: ProductPriceListProductSource,
): ProductPriceListTargetRow[] {
  const variants = product.variants ?? [];
  const matrixVariants = variants.filter(
    (variant) => !isDefaultVariant(variant),
  );
  const defaultVariant =
    variants.find((variant) => isDefaultVariant(variant)) ?? null;

  function buildVariantPriceRow(
    variant: ProductPriceListVariantSource,
  ): ProductPriceListTargetRow {
    return {
      key: `VARIANT:${variant.id}`,
      label: buildVariantLabel(variant),
      target: "VARIANT",
      targetId: variant.id,
      stableKeys: [
        `variant:id:${variant.id}`,
        variant.variantKey
          ? `variant:key:${normalizeStableValue(variant.variantKey)}`
          : null,
        variant.sku ? `variant:sku:${normalizeStableValue(variant.sku)}` : null,
      ].filter((key): key is string => Boolean(key)),
    };
  }

  function buildSaleUnitRow(
    saleUnit: ProductPriceListSaleUnitSource,
    variant: ProductPriceListVariantSource | null,
  ): ProductPriceListTargetRow {
    const label = saleUnit.name ?? saleUnit.code ?? "Ед. продажи";

    return {
      key: `SALE_UNIT:${saleUnit.id}`,
      label: variant ? `${buildVariantLabel(variant)} · ${label}` : label,
      target: "SALE_UNIT",
      targetId: saleUnit.id,
      stableKeys: buildSaleUnitStableKeys(saleUnit, variant ?? defaultVariant),
    };
  }

  if (matrixVariants.length) {
    return matrixVariants.flatMap((variant) => {
      const saleUnits = variant.saleUnits ?? [];

      return saleUnits.length
        ? saleUnits.map((saleUnit) => buildSaleUnitRow(saleUnit, variant))
        : [buildVariantPriceRow(variant)];
    });
  }

  const saleUnitRows = [
    ...(product.saleUnits ?? []).map((saleUnit) =>
      buildSaleUnitRow(saleUnit, null),
    ),
    ...variants.flatMap((variant) =>
      (variant.saleUnits ?? []).map((saleUnit) =>
        buildSaleUnitRow(saleUnit, variant),
      ),
    ),
  ];

  if (saleUnitRows.length) return saleUnitRows;

  return [
    {
      key: `PRODUCT:${product.id}`,
      label: product.name ?? "Товар",
      target: "PRODUCT",
      targetId: product.id,
      stableKeys: [`product:${product.id}`],
    },
  ];
}

function retargetDraftsToProductRows(
  drafts: ProductPriceListPriceDraft[],
  product: ProductPriceListProductSource,
  previousProduct?: ProductPriceListProductSource | null,
): ProductPriceListPriceDraft[] {
  const currentRows = buildProductPriceListRows(product);
  const currentByKey = new Map(currentRows.map((row) => [row.key, row]));
  const currentByStableKey = new Map<string, ProductPriceListTargetRow>();

  for (const row of currentRows) {
    for (const stableKey of row.stableKeys) {
      if (!currentByStableKey.has(stableKey)) {
        currentByStableKey.set(stableKey, row);
      }
    }
  }

  const previousRows = previousProduct
    ? buildProductPriceListRows(previousProduct)
    : currentRows;
  const previousByKey = new Map(previousRows.map((row) => [row.key, row]));

  return drafts.flatMap((draft): ProductPriceListPriceDraft[] => {
    const previousRow = previousByKey.get(draft.rowKey);
    const currentRow =
      currentByKey.get(draft.rowKey) ??
      previousRow?.stableKeys
        .map((stableKey) => currentByStableKey.get(stableKey))
        .find((row): row is ProductPriceListTargetRow => Boolean(row));

    if (!currentRow) return [];

    return [
      {
        ...draft,
        rowKey: currentRow.key,
        target: currentRow.target,
        targetId: currentRow.targetId,
      },
    ];
  });
}

export function buildProductPriceListBulkPricesPayload(
  drafts: ProductPriceListPriceDraft[],
  priceFormatMode: CatalogPriceFormatMode = "integer",
  options: {
    product?: ProductPriceListProductSource | null;
    previousProduct?: ProductPriceListProductSource | null;
  } = {},
): ProductPriceListBulkPricesPayload[] {
  const byPriceListId = new Map<string, CatalogPriceListPricePayload[]>();
  const preparedDrafts = options.product
    ? retargetDraftsToProductRows(
        drafts,
        options.product,
        options.previousProduct,
      )
    : drafts;

  for (const draft of preparedDrafts) {
    const prices = byPriceListId.get(draft.priceListId) ?? [];
    prices.push({
      target: draft.target,
      targetId: draft.targetId,
      price: parseOptionalCatalogPrice(draft.price, priceFormatMode),
    });
    byPriceListId.set(draft.priceListId, prices);
  }

  return [...byPriceListId.entries()].map(([priceListId, prices]) => ({
    priceListId,
    prices,
  }));
}

export const catalogPriceListQueryKeys = {
  all: ["catalog-price-lists"] as const,
  lists: (filters: CatalogPriceListListFilters = {}) =>
    ["catalog-price-lists", "list", filters] as const,
  prices: (priceListId: string) =>
    ["catalog-price-lists", "prices", priceListId] as const,
};

function buildEndpoint(
  path: string,
  filters: CatalogPriceListListFilters = {},
): string {
  const params = new URLSearchParams();

  if (filters.includeArchived) {
    params.set("includeArchived", "true");
  }
  if (filters.includeInactive) {
    params.set("includeInactive", "true");
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function listCatalogPriceLists(
  filters: CatalogPriceListListFilters = {},
): Promise<CatalogPriceList[]> {
  return apiClient.get<CatalogPriceList[]>(
    buildEndpoint("/catalog-price-lists", filters),
  );
}

export function createCatalogPriceList(
  payload: CreateCatalogPriceListPayload,
): Promise<CatalogPriceList> {
  return apiClient.post<CatalogPriceList>("/catalog-price-lists", payload);
}

export function updateCatalogPriceList(params: {
  id: string;
  payload: CatalogPriceListPayload;
}): Promise<CatalogPriceList> {
  return apiClient.patch<CatalogPriceList>(
    `/catalog-price-lists/${encodeURIComponent(params.id)}`,
    params.payload,
  );
}

export function archiveCatalogPriceList(id: string): Promise<{ ok: boolean }> {
  return apiClient.delete<{ ok: boolean }>(
    `/catalog-price-lists/${encodeURIComponent(id)}`,
  );
}

export function listCatalogPriceListPrices(
  priceListId: string,
): Promise<CatalogPriceListPrice[]> {
  return apiClient.get<CatalogPriceListPrice[]>(
    `/catalog-price-lists/${encodeURIComponent(priceListId)}/prices`,
  );
}

export function bulkUpsertCatalogPriceListPrices(params: {
  priceListId: string;
  prices: CatalogPriceListPricePayload[];
}): Promise<CatalogPriceListPrice[]> {
  return apiClient.put<CatalogPriceListPrice[]>(
    `/catalog-price-lists/${encodeURIComponent(params.priceListId)}/prices/bulk`,
    { prices: params.prices },
  );
}

export function setActiveCatalogPriceList(
  activePriceListId: string | null,
): Promise<{ activePriceListId: string | null }> {
  return apiClient.patch<{ activePriceListId: string | null }>(
    "/catalog/settings/active-price-list",
    { activePriceListId },
  );
}

export function useCatalogPriceLists(
  filters: CatalogPriceListListFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: catalogPriceListQueryKeys.lists(filters),
    queryFn: () => listCatalogPriceLists(filters),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}

export function useCatalogPriceListPrices(
  priceListId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: catalogPriceListQueryKeys.prices(priceListId ?? ""),
    queryFn: () => listCatalogPriceListPrices(priceListId ?? ""),
    enabled: Boolean(priceListId) && (options.enabled ?? true),
    staleTime: 30_000,
  });
}
