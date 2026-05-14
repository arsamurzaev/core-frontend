"use client";

import { buildProductDrawerViewModel } from "@/core/widgets/product-drawer/model/product-drawer-view";
import {
  PRODUCT_UNAVAILABLE_STATE,
  isProductPubliclyAvailable,
  shouldHideProductFromCustomer,
} from "@/core/widgets/product-drawer/model/product-availability";
import { useProductDrawerAfterClose } from "@/core/widgets/product-drawer/model/use-product-drawer-after-close";
import { ProductPurchaseDetailsPanel } from "@/core/widgets/product-drawer/ui/product-purchase-details-panel";
import {
  type ProductWithAttributesDto,
  type ProductWithDetailsDto,
  useProductControllerGetBySlug,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
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
  const { isLoading: isSessionLoading, user } = useSession();
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
  const shouldWaitForProductVisibility =
    Boolean(resolvedProduct) &&
    !isProductPubliclyAvailable(resolvedProduct) &&
    isSessionLoading;
  const unavailableState =
    !shouldWaitForProductVisibility &&
    shouldHideProductFromCustomer({
      product: resolvedProduct,
      userRole: user?.role,
    })
      ? PRODUCT_UNAVAILABLE_STATE
      : null;
  const visibleProduct =
    unavailableState || shouldWaitForProductVisibility ? null : resolvedProduct;
  const visiblePreviewProduct =
    unavailableState || shouldWaitForProductVisibility
      ? null
      : resolvedPreviewProduct;
  const shouldShowSkeleton =
    (isLoading && !resolvedProduct && !resolvedPreviewProduct) ||
    shouldWaitForProductVisibility;
  const viewModel = React.useMemo(
    () =>
      buildProductDrawerViewModel({
        catalog,
        isError,
        isLoading: shouldShowSkeleton,
        previewProduct: visiblePreviewProduct,
        product: visibleProduct ?? undefined,
        supportsBrands,
      }),
    [
      catalog,
      isError,
      shouldShowSkeleton,
      supportsBrands,
      visiblePreviewProduct,
      visibleProduct,
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
        <DrawerTitle className="sr-only">
          {unavailableState?.title ?? viewModel.displayName}
        </DrawerTitle>
        <ProductPurchaseDetailsPanel
          initialSaleUnitId={initialSaleUnitId}
          initialVariantId={initialVariantId}
          isLoading={shouldShowSkeleton}
          product={visibleProduct}
          productKey={productSlug}
          resetKey={productSlug}
          ScrollAreaComponent={DrawerScrollArea}
          unavailableState={unavailableState}
          viewModel={viewModel}
        />
      </DrawerContent>
    </Drawer>
  );
};
