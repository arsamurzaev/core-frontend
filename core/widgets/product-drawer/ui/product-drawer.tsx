"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductDrawerFooterAction } from "@/core/modules/cart/ui/cart-product-drawer-footer-action";
import {
  buildProductDrawerViewModel,
} from "@/core/widgets/product-drawer/model/product-drawer-view";
import { useProductDrawerAfterClose } from "@/core/widgets/product-drawer/model/use-product-drawer-after-close";
import { ProductDetailsPanel } from "@/core/widgets/product-drawer/ui/product-details-panel";
import {
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
  initialProduct?: ProductWithDetailsDto | null;
  product?: ProductWithDetailsDto | null;
  className?: string;
  onOpenChange: (open: boolean) => void;
  onAfterClose?: () => void;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  open,
  productSlug,
  initialProduct,
  product,
  className,
  onOpenChange,
  onAfterClose,
}) => {
  const { catalog } = useCatalogState();
  const { shouldUseCartUi } = useCart();
  const { data, isError, isLoading } = useProductControllerGetBySlug(
    productSlug,
    {
      query: {
        enabled: Boolean(productSlug) && !product,
        initialData: product ?? initialProduct ?? undefined,
        staleTime: 30_000,
      },
    },
  );
  const resolvedProduct = product ?? data ?? initialProduct ?? null;

  const viewModel = React.useMemo(
    () =>
      buildProductDrawerViewModel({
        catalog,
        isError,
        isLoading,
        product: resolvedProduct ?? undefined,
      }),
    [catalog, isError, isLoading, resolvedProduct],
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
          "mx-auto w-full max-w-[30rem] rounded-t-2xl border bg-background shadow-custom",
          className,
        )}
      >
        <DrawerTitle className="sr-only">{viewModel.displayName}</DrawerTitle>
        <ProductDetailsPanel
          brandName={viewModel.brandName ?? undefined}
          currency={viewModel.currency}
          description={viewModel.description}
          displayName={viewModel.displayName}
          displayPrice={viewModel.displayPrice}
          discount={viewModel.discount}
          footerAction={
            shouldUseCartUi && resolvedProduct?.id ? (
              <CartProductDrawerFooterAction productId={resolvedProduct.id} />
            ) : null
          }
          hasDiscount={viewModel.hasDiscount}
          hasError={viewModel.hasError}
          imageUrls={viewModel.imageUrls}
          isLoading={isLoading}
          price={viewModel.price}
          resetKey={productSlug}
          ScrollAreaComponent={DrawerScrollArea}
          shareText={viewModel.shareText}
          subtitle={viewModel.subtitle}
          variantsSummary={viewModel.variantsSummary}
        />
      </DrawerContent>
    </Drawer>
  );
};
