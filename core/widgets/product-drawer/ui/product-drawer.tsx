"use client";

import { buildProductDrawerViewModel } from "@/core/widgets/product-drawer/model/product-drawer-view";
import { useProductDrawerAfterClose } from "@/core/widgets/product-drawer/model/use-product-drawer-after-close";
import { ProductPurchaseDetailsPanel } from "@/core/widgets/product-drawer/ui/product-purchase-details-panel";
import {
  type ProductWithAttributesDto,
  type ProductWithDetailsDto,
  useProductControllerGetBySlug,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import {
  Drawer,
  DrawerContent,
  DrawerScrollArea,
  DrawerTitle,
} from "@/shared/ui/drawer";
import React from "react";

interface ProductDrawerProps {
  open: boolean;
  productSlug: string;
  initialSaleUnitId?: string | null;
  initialVariantId?: string | null;
  initialProduct?: ProductWithDetailsDto | null;
  previewProduct?: ProductWithAttributesDto | null;
  product?: ProductWithDetailsDto | null;
  supportsBrands?: boolean;
  className?: string;
  onOpenChange: (open: boolean) => void;
  onAfterClose?: () => void;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  open,
  productSlug,
  initialSaleUnitId,
  initialVariantId,
  initialProduct,
  previewProduct,
  product,
  supportsBrands = true,
  className,
  onOpenChange,
  onAfterClose,
}) => {
  const { catalog } = useCatalogState();
  const productSlugForApi = React.useMemo(
    () => encodeURIComponent(productSlug),
    [productSlug],
  );
  const { data, isError, isLoading } = useProductControllerGetBySlug(
    productSlugForApi,
    {
      query: {
        enabled: Boolean(productSlug) && !product,
        initialData: product ?? initialProduct ?? undefined,
        staleTime: 30_000,
      },
    },
  );
  const resolvedProduct = product ?? data ?? initialProduct ?? null;
  const resolvedPreviewProduct = previewProduct ?? null;
  const shouldShowSkeleton =
    isLoading && !resolvedProduct && !resolvedPreviewProduct;
  const viewModel = React.useMemo(
    () =>
      buildProductDrawerViewModel({
        catalog,
        isError,
        isLoading: shouldShowSkeleton,
        previewProduct: resolvedPreviewProduct,
        product: resolvedProduct ?? undefined,
        supportsBrands,
      }),
    [
      catalog,
      isError,
      resolvedPreviewProduct,
      resolvedProduct,
      shouldShowSkeleton,
      supportsBrands,
    ],
  );
  const handleCloseAnimationEnd = useProductDrawerAfterClose({
    open,
    onAfterClose,
    resetKey: productSlug,
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible>
      <DrawerContent
        onAnimationEnd={handleCloseAnimationEnd}
        onTransitionEnd={handleCloseAnimationEnd}
        className={cn(
          "mx-auto w-full data-[vaul-drawer-direction=bottom]:max-w-120 rounded-t-2xl border bg-background shadow-custom",
          className,
        )}
      >
        <DrawerTitle className="sr-only">{viewModel.displayName}</DrawerTitle>
        <ProductPurchaseDetailsPanel
          initialSaleUnitId={initialSaleUnitId}
          initialVariantId={initialVariantId}
          isLoading={shouldShowSkeleton}
          product={resolvedProduct}
          productKey={productSlug}
          resetKey={productSlug}
          ScrollAreaComponent={DrawerScrollArea}
          viewModel={viewModel}
        />
      </DrawerContent>
    </Drawer>
  );
};
