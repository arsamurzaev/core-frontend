"use client";

import {
  useCatalogPriceLists,
  type CatalogPriceListPriceTarget,
  type CreateProductPriceListPriceDraft,
  type CreateProductPriceListVariantAttributePayload,
} from "@/core/modules/catalog-price-list";
import { ProductPriceListPriceInputGrid } from "@/core/modules/catalog-price-list/ui/product-price-list-price-input-grid";
import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { buildVariantMatrixRows } from "@/core/modules/product/editor/model/product-variants";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

type CreatePriceTargetRow = {
  key: string;
  label: string;
  target: CatalogPriceListPriceTarget;
  variantAttributes?: CreateProductPriceListVariantAttributePayload[];
  catalogSaleUnitId?: string;
};

interface ProductPriceListCreatePricesFieldProps {
  canUseCatalogSaleUnits?: boolean;
  canUseProductVariants?: boolean;
  disabled?: boolean;
  drafts: CreateProductPriceListPriceDraft[];
  form: UseFormReturn<CreateProductFormValues>;
  onChange: React.Dispatch<
    React.SetStateAction<CreateProductPriceListPriceDraft[]>
  >;
  renderMode?: "section" | "controller";
  variantAttributes: AttributeDto[];
}

interface ProductPriceListCreateInlineFieldsProps {
  catalogSaleUnitId?: string;
  className?: string;
  disabled?: boolean;
  drafts: CreateProductPriceListPriceDraft[];
  gridClassName?: string;
  inputClassName?: string;
  layout?: "form-row" | "compact";
  onChange: React.Dispatch<
    React.SetStateAction<CreateProductPriceListPriceDraft[]>
  >;
  rowKey: string;
  target: CatalogPriceListPriceTarget;
  variantAttributes?: CreateProductPriceListVariantAttributePayload[];
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildSaleUnitLabel(unit: {
  catalogSaleUnitName?: string;
  label?: string;
}): string {
  return (
    normalizeText(unit.catalogSaleUnitName) ||
    normalizeText(unit.label) ||
    "Ед. продажи"
  );
}

function buildCreatePriceRows(params: {
  canUseCatalogSaleUnits: boolean;
  canUseProductVariants: boolean;
  productName: string;
  saleUnits: CreateProductFormValues["saleUnits"];
  variants: CreateProductFormValues["variants"];
  variantAttributes: AttributeDto[];
}): CreatePriceTargetRow[] {
  const {
    canUseCatalogSaleUnits,
    canUseProductVariants,
    productName,
    saleUnits,
    variants,
    variantAttributes,
  } = params;
  const variantRows =
    canUseProductVariants && variantAttributes.length > 0
      ? buildVariantMatrixRows(variants, variantAttributes).filter(
          (row) => row.item.status !== "DISABLED",
        )
      : [];

  if (variantRows.length) {
    return variantRows.flatMap((variantRow) => {
      const saleUnitRows: CreatePriceTargetRow[] = canUseCatalogSaleUnits
        ? (variantRow.item.saleUnits ?? []).flatMap((saleUnit) => {
            const catalogSaleUnitId = normalizeText(saleUnit.catalogSaleUnitId);
            if (!catalogSaleUnitId) return [];

            return [
              {
                key: `SALE_UNIT:${variantRow.key}:${catalogSaleUnitId}`,
                label: `${variantRow.label} · ${buildSaleUnitLabel(saleUnit)}`,
                target: "SALE_UNIT",
                variantAttributes: variantRow.attributes,
                catalogSaleUnitId,
              },
            ];
          })
        : [];

      return saleUnitRows.length
        ? saleUnitRows
        : [
            {
              key: `VARIANT:${variantRow.key}`,
              label: variantRow.label,
              target: "VARIANT",
              variantAttributes: variantRow.attributes,
            },
          ];
    });
  }

  if (canUseCatalogSaleUnits) {
    const saleUnitRows: CreatePriceTargetRow[] = [];

    for (const saleUnit of saleUnits ?? []) {
      const catalogSaleUnitId = normalizeText(saleUnit.catalogSaleUnitId);
      if (!catalogSaleUnitId) continue;

      saleUnitRows.push({
        key: `SALE_UNIT:default:${catalogSaleUnitId}`,
        label: buildSaleUnitLabel(saleUnit),
        target: "SALE_UNIT",
        catalogSaleUnitId,
      });
    }

    if (saleUnitRows.length) return saleUnitRows;
  }

  return [
    {
      key: "PRODUCT",
      label: normalizeText(productName) || "Товар",
      target: "PRODUCT",
    },
  ];
}

function draftKey(priceListId: string, rowKey: string): string {
  return `${priceListId}:${rowKey}`;
}

export const ProductPriceListCreatePricesField: React.FC<
  ProductPriceListCreatePricesFieldProps
> = ({
  canUseCatalogSaleUnits = false,
  canUseProductVariants = false,
  disabled = false,
  drafts,
  form,
  onChange,
  renderMode = "section",
  variantAttributes,
}) => {
  const priceListsQuery = useCatalogPriceLists({}, { enabled: !disabled });
  const priceLists = React.useMemo(
    () => priceListsQuery.data ?? [],
    [priceListsQuery.data],
  );
  const productName = useWatch({ control: form.control, name: "name" }) ?? "";
  const watchedSaleUnits = useWatch({
    control: form.control,
    name: "saleUnits",
  });
  const saleUnits = React.useMemo(
    () => watchedSaleUnits ?? [],
    [watchedSaleUnits],
  );
  const variants = useWatch({ control: form.control, name: "variants" });
  const rows = React.useMemo(
    () =>
      buildCreatePriceRows({
        canUseCatalogSaleUnits,
        canUseProductVariants,
        productName,
        saleUnits,
        variants,
        variantAttributes,
      }),
    [
      canUseCatalogSaleUnits,
      canUseProductVariants,
      productName,
      saleUnits,
      variants,
      variantAttributes,
    ],
  );
  const draftByKey = React.useMemo(
    () =>
      new Map(
        drafts.map((draft) => [
          draftKey(draft.priceListId, draft.rowKey),
          draft,
        ]),
      ),
    [drafts],
  );
  const allowedDraftKeys = React.useMemo(() => {
    const allowed = new Set<string>();
    for (const priceList of priceLists) {
      for (const row of rows) {
        allowed.add(draftKey(priceList.id, row.key));
      }
    }
    return allowed;
  }, [priceLists, rows]);
  const allowedDraftKeysSignature = React.useMemo(
    () => [...allowedDraftKeys].sort().join("|"),
    [allowedDraftKeys],
  );

  React.useEffect(() => {
    onChange((current) => {
      const next = current.filter((draft) =>
        allowedDraftKeys.has(draftKey(draft.priceListId, draft.rowKey)),
      );
      return next.length === current.length ? current : next;
    });
  }, [allowedDraftKeys, allowedDraftKeysSignature, onChange]);

  const handleValueChange = React.useCallback(
    (priceListId: string, row: CreatePriceTargetRow, price: string) => {
      onChange((current) => {
        const key = draftKey(priceListId, row.key);
        const withoutCurrent = current.filter(
          (draft) => draftKey(draft.priceListId, draft.rowKey) !== key,
        );

        if (!price.trim()) {
          return withoutCurrent;
        }

        return [
          ...withoutCurrent,
          {
            priceListId,
            rowKey: row.key,
            target: row.target,
            price,
            ...(row.variantAttributes?.length
              ? { variantAttributes: row.variantAttributes }
              : {}),
            ...(row.catalogSaleUnitId
              ? { catalogSaleUnitId: row.catalogSaleUnitId }
              : {}),
          },
        ];
      });
    },
    [onChange],
  );

  if (renderMode === "controller") {
    return null;
  }

  if (priceListsQuery.isLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </section>
    );
  }

  if (!priceLists.length) return null;

  return (
    <section className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-1 gap-2 rounded-md border border-border/70 bg-background p-2.5 sm:grid-cols-[minmax(140px,0.8fr)_minmax(0,1.2fr)]"
        >
          <div className="min-w-0 text-sm font-medium">{row.label}</div>
          <ProductPriceListPriceInputGrid
            disabled={disabled}
            priceLists={priceLists}
            rowLabel={row.label}
            getValue={(priceList) =>
              draftByKey.get(draftKey(priceList.id, row.key))?.price ?? ""
            }
            onChange={(priceList, value) =>
              handleValueChange(priceList.id, row, value)
            }
          />
        </div>
      ))}
    </section>
  );
};

export const ProductPriceListCreateInlineFields: React.FC<
  ProductPriceListCreateInlineFieldsProps
> = ({
  catalogSaleUnitId,
  className,
  disabled = false,
  drafts,
  gridClassName,
  inputClassName,
  layout,
  onChange,
  rowKey,
  target,
  variantAttributes,
}) => {
  const priceListsQuery = useCatalogPriceLists({}, { enabled: !disabled });
  const priceLists = priceListsQuery.data ?? [];
  const draftByKey = React.useMemo(
    () =>
      new Map(
        drafts.map((draft) => [
          draftKey(draft.priceListId, draft.rowKey),
          draft,
        ]),
      ),
    [drafts],
  );

  const handleValueChange = React.useCallback(
    (priceListId: string, price: string) => {
      onChange((current) => {
        const key = draftKey(priceListId, rowKey);
        const withoutCurrent = current.filter(
          (draft) => draftKey(draft.priceListId, draft.rowKey) !== key,
        );

        if (!price.trim()) {
          return withoutCurrent;
        }

        return [
          ...withoutCurrent,
          {
            priceListId,
            rowKey,
            target,
            price,
            ...(variantAttributes?.length ? { variantAttributes } : {}),
            ...(catalogSaleUnitId ? { catalogSaleUnitId } : {}),
          },
        ];
      });
    },
    [catalogSaleUnitId, onChange, rowKey, target, variantAttributes],
  );

  if (priceListsQuery.isLoading) {
    return <Skeleton className={cn("h-9 w-full rounded-md", className)} />;
  }

  if (!priceLists.length) {
    return null;
  }

  const effectiveLayout =
    layout ?? (target === "PRODUCT" ? "form-row" : "compact");
  const effectiveInputClassName =
    inputClassName ??
    (target === "VARIANT"
      ? "h-9 px-3 text-sm"
      : target === "SALE_UNIT"
        ? "h-8 min-w-0 px-2.5 text-sm"
        : undefined);

  return (
    <ProductPriceListPriceInputGrid
      className={gridClassName}
      disabled={disabled}
      fieldClassName={className}
      inputClassName={effectiveInputClassName}
      layout={effectiveLayout}
      priceLists={priceLists}
      getValue={(priceList) =>
        draftByKey.get(draftKey(priceList.id, rowKey))?.price ?? ""
      }
      onChange={(priceList, value) => handleValueChange(priceList.id, value)}
    />
  );
};
