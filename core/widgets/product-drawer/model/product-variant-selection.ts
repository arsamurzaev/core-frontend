"use client";

import {
  findKnownProductVariant,
  getInitialProductVariantId,
  isProductVariantPurchasable,
} from "@/core/widgets/product-drawer/model/product-variant-picker-model";
import type { ProductVariantDto } from "@/shared/api/generated/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

const VARIANT_QUERY_PARAM = "variantId";
const LEGACY_VARIANT_QUERY_PARAM = "variant";

export function useProductVariantSelection(params: {
  initialVariantId?: string | null;
  productId?: string | null;
  shouldEnforceStock?: boolean;
  singleVariantId?: string | null;
  variants: ProductVariantDto[];
}) {
  const {
    initialVariantId,
    productId,
    shouldEnforceStock,
    singleVariantId,
    variants,
  } = params;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const previousProductIdRef = React.useRef<string | null>(null);
  const queryVariantId =
    searchParams.get(VARIANT_QUERY_PARAM) ??
    searchParams.get(LEGACY_VARIANT_QUERY_PARAM);
  const [selectedVariantId, setSelectedVariantIdState] = React.useState<
    string | null
  >(null);
  const previousSelectionKeyRef = React.useRef<string | null>(null);
  const selectionKey = [
    productId ?? "",
    initialVariantId?.trim() ?? "",
    queryVariantId ?? "",
    shouldEnforceStock === false ? "stock-off" : "stock-on",
    singleVariantId ?? "",
  ].join(":");

  React.useEffect(() => {
    setSelectedVariantIdState((current) => {
      const productChanged = previousProductIdRef.current !== (productId ?? null);
      const selectionKeyChanged = previousSelectionKeyRef.current !== selectionKey;
      previousProductIdRef.current = productId ?? null;
      previousSelectionKeyRef.current = selectionKey;

      const currentVariant = findKnownProductVariant(variants, current);
      if (
        !selectionKeyChanged &&
        !productChanged &&
        !queryVariantId &&
        currentVariant &&
        isProductVariantPurchasable(currentVariant, {
          shouldEnforceStock,
        })
      ) {
        return current;
      }

      return getInitialProductVariantId({
        initialVariantId,
        queryVariantId,
        shouldEnforceStock,
        singleVariantId,
        variants,
      });
    });
  }, [
    initialVariantId,
    productId,
    queryVariantId,
    selectionKey,
    shouldEnforceStock,
    singleVariantId,
    variants,
  ]);

  const setSelectedVariantId = React.useCallback(
    (variantId: string) => {
      setSelectedVariantIdState(variantId);

      if (!pathname.includes("/product/")) {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set(VARIANT_QUERY_PARAM, variantId);
      nextSearchParams.delete(LEGACY_VARIANT_QUERY_PARAM);

      const query = nextSearchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const selectedVariant = React.useMemo(
    () =>
      selectedVariantId
        ? (variants.find((variant) => variant.id === selectedVariantId) ?? null)
        : null,
    [selectedVariantId, variants],
  );

  return {
    selectedVariant,
    selectedVariantId,
    setSelectedVariantId,
  };
}
