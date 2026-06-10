"use client";

import {
  buildProductPriceListProductSourceFromForm,
  buildProductPriceListRows,
  catalogPriceListQueryKeys,
  listCatalogPriceListPrices,
  useCatalogPriceLists,
  type ProductPriceListPriceDraft,
  type ProductPriceListProductSource,
} from "@/core/modules/catalog-price-list";
import { ProductPriceListPriceInputGrid } from "@/core/modules/catalog-price-list/ui/product-price-list-price-input-grid";
import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { useQueries } from "@tanstack/react-query";
import React from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

interface ProductPriceListPricesFieldProps {
  canUseCatalogSaleUnits?: boolean;
  canUseProductVariants?: boolean;
  disabled?: boolean;
  drafts: ProductPriceListPriceDraft[];
  form?: UseFormReturn<CreateProductFormValues>;
  hasExternalEdits?: boolean;
  onChange: React.Dispatch<React.SetStateAction<ProductPriceListPriceDraft[]>>;
  product: ProductPriceListProductSource;
  renderMode?: "section" | "controller";
  variantAttributes?: AttributeDto[];
}

interface ProductPriceListInlineFieldsProps {
  className?: string;
  disabled?: boolean;
  drafts: ProductPriceListPriceDraft[];
  gridClassName?: string;
  inputClassName?: string;
  layout?: "form-row" | "compact";
  onEdited?: () => void;
  onChange: React.Dispatch<React.SetStateAction<ProductPriceListPriceDraft[]>>;
  rowKey: string;
  target: ProductPriceListPriceDraft["target"];
  targetId: string;
}

export const ProductPriceListPricesField: React.FC<
  ProductPriceListPricesFieldProps
> = ({
  canUseCatalogSaleUnits = false,
  canUseProductVariants = false,
  disabled = false,
  drafts,
  form,
  hasExternalEdits = false,
  onChange,
  product,
  renderMode = "section",
  variantAttributes = [],
}) => {
  const priceListsQuery = useCatalogPriceLists({}, { enabled: !disabled });
  const priceLists = React.useMemo(
    () => priceListsQuery.data ?? [],
    [priceListsQuery.data],
  );
  const formValues = useWatch({ control: form?.control, disabled: !form });
  const effectiveProduct = React.useMemo(
    () =>
      form && formValues
        ? buildProductPriceListProductSourceFromForm({
            canUseCatalogSaleUnits,
            canUseProductVariants,
            formValues: formValues as CreateProductFormValues,
            product,
            variantAttributes,
          })
        : product,
    [
      canUseCatalogSaleUnits,
      canUseProductVariants,
      form,
      formValues,
      product,
      variantAttributes,
    ],
  );
  const priceQueries = useQueries({
    queries: priceLists.map((priceList) => ({
      queryKey: catalogPriceListQueryKeys.prices(priceList.id),
      queryFn: () => listCatalogPriceListPrices(priceList.id),
      enabled: !disabled,
      staleTime: 30_000,
    })),
  });
  const priceQueriesRef = React.useRef(priceQueries);
  const rows = React.useMemo(
    () => buildProductPriceListRows(effectiveProduct),
    [effectiveProduct],
  );
  const isPriceFetching = priceQueries.some((query) => query.isFetching);
  const hasUserEditedRef = React.useRef(false);

  React.useEffect(() => {
    priceQueriesRef.current = priceQueries;
  }, [priceQueries]);

  React.useEffect(() => {
    hasUserEditedRef.current = false;
  }, [product.id]);

  function valueKey(priceListId: string, rowKey: string): string {
    return `${priceListId}:${rowKey}`;
  }

  const draftByKey = React.useMemo(
    () =>
      new Map(
        drafts.map((draft) => [
          valueKey(draft.priceListId, draft.rowKey),
          draft,
        ]),
      ),
    [drafts],
  );

  const priceQueriesDataSignature = priceQueries
    .map((query, index) => {
      const priceListId = priceLists[index]?.id ?? "";
      const prices = query.data ?? [];
      return `${priceListId}:${prices
        .map((price) => `${price.target}:${price.targetId}:${price.price}`)
        .join(",")}`;
    })
    .join("|");

  React.useEffect(() => {
    if (hasUserEditedRef.current || hasExternalEdits) {
      return;
    }

    const nextDrafts: ProductPriceListPriceDraft[] = [];
    const savedRows = buildProductPriceListRows(product);

    priceLists.forEach((priceList, index) => {
      const pricesByKey = new Map(
        (priceQueriesRef.current[index]?.data ?? []).map((price) => [
          `${price.target}:${price.targetId}`,
          price.price,
        ]),
      );
      const pricesByStableKey = new Map<string, string>();

      for (const savedRow of savedRows) {
        const savedPrice = pricesByKey.get(savedRow.key);

        if (savedPrice === undefined) {
          continue;
        }

        for (const stableKey of savedRow.stableKeys) {
          if (!pricesByStableKey.has(stableKey)) {
            pricesByStableKey.set(stableKey, savedPrice);
          }
        }
      }

      for (const row of rows) {
        const price =
          pricesByKey.get(row.key) ??
          row.stableKeys
            .map((stableKey) => pricesByStableKey.get(stableKey))
            .find((value): value is string => value !== undefined) ??
          "";

        nextDrafts.push({
          priceListId: priceList.id,
          rowKey: row.key,
          target: row.target,
          targetId: row.targetId,
          price,
        });
      }
    });

    onChange(nextDrafts);
  }, [
    hasExternalEdits,
    onChange,
    priceLists,
    priceQueriesDataSignature,
    product,
    rows,
  ]);

  const handleValueChange = React.useCallback(
    (priceListId: string, rowKey: string, value: string) => {
      const row = rows.find((item) => item.key === rowKey);
      if (!row) {
        return;
      }

      hasUserEditedRef.current = true;
      onChange((current) => {
        const key = valueKey(priceListId, rowKey);
        const withoutCurrent = current.filter(
          (draft) => valueKey(draft.priceListId, draft.rowKey) !== key,
        );

        return [
          ...withoutCurrent,
          {
            priceListId,
            rowKey,
            target: row.target,
            targetId: row.targetId,
            price: value,
          },
        ];
      });
    },
    [onChange, rows],
  );

  if (renderMode === "controller") {
    return null;
  }

  if (priceListsQuery.isLoading) {
    return (
      <div className="space-y-3 px-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
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
            isFetching={isPriceFetching}
            priceLists={priceLists}
            rowLabel={row.label}
            getValue={(priceList) =>
              draftByKey.get(valueKey(priceList.id, row.key))?.price ?? ""
            }
            onChange={(priceList, value) =>
              handleValueChange(priceList.id, row.key, value)
            }
          />
        </div>
      ))}
    </section>
  );
};

export const ProductPriceListInlineFields: React.FC<
  ProductPriceListInlineFieldsProps
> = ({
  className,
  disabled = false,
  drafts,
  gridClassName,
  inputClassName,
  layout,
  onEdited,
  onChange,
  rowKey,
  target,
  targetId,
}) => {
  const priceListsQuery = useCatalogPriceLists({}, { enabled: !disabled });
  const priceLists = priceListsQuery.data ?? [];
  const draftByKey = React.useMemo(
    () =>
      new Map(
        drafts.map((draft) => [`${draft.priceListId}:${draft.rowKey}`, draft]),
      ),
    [drafts],
  );

  const handleValueChange = React.useCallback(
    (priceListId: string, value: string) => {
      onEdited?.();
      onChange((current) => {
        const key = `${priceListId}:${rowKey}`;
        const withoutCurrent = current.filter(
          (draft) => `${draft.priceListId}:${draft.rowKey}` !== key,
        );

        return [
          ...withoutCurrent,
          {
            priceListId,
            rowKey,
            target,
            targetId,
            price: value,
          },
        ];
      });
    },
    [onChange, onEdited, rowKey, target, targetId],
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
        draftByKey.get(`${priceList.id}:${rowKey}`)?.price ?? ""
      }
      onChange={(priceList, value) => handleValueChange(priceList.id, value)}
    />
  );
};
