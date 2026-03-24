"use client";

import {
  buildProductDrawerViewModel,
} from "@/core/widgets/product-drawer/model/product-drawer-view";
import { useProductDrawerAfterClose } from "@/core/widgets/product-drawer/model/use-product-drawer-after-close";
import { ProductDrawerImageCarousel } from "@/core/widgets/product-drawer/ui/product-drawer-image-carousel";
import { ProductDrawerOverviewHeader, ProductDrawerOverviewMeta } from "@/core/widgets/product-drawer/ui/product-drawer-overview";
import { ProductDrawerPrice } from "@/core/widgets/product-drawer/ui/product-drawer-price";
import { ProductDrawerShareActions } from "@/core/widgets/product-drawer/ui/product-drawer-share-actions";
import type { ProductWithDetailsDto } from "@/shared/api/generated";
import { useProductControllerGetBySlug } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
} from "@/shared/ui/drawer";
import React from "react";

interface ProductDrawerProps {
  open: boolean;
  productSlug: string;
  initialProduct?: ProductWithDetailsDto | null;
  className?: string;
  onOpenChange: (open: boolean) => void;
  onAfterClose?: () => void;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  open,
  productSlug,
  initialProduct,
  className,
  onOpenChange,
  onAfterClose,
}) => {
  const { catalog } = useCatalogState();
  const { data, isError, isLoading } = useProductControllerGetBySlug(
    productSlug,
    {
      query: {
        enabled: Boolean(productSlug),
        initialData: initialProduct ?? undefined,
        staleTime: 30_000,
      },
    },
  );

  const viewModel = React.useMemo(
    () =>
      buildProductDrawerViewModel({
        catalog,
        isError,
        isLoading,
        product: data,
      }),
    [catalog, data, isError, isLoading],
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

        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerScrollArea>
            <DrawerHeader className="overflow-visible px-0 pb-4">
              <div className="relative">
                <span className="sr-only">carousel</span>
                <ProductDrawerImageCarousel
                  key={productSlug}
                  imageUrls={viewModel.imageUrls}
                  isLoading={isLoading}
                  productName={viewModel.displayName}
                />
                <ProductDrawerShareActions
                  title={viewModel.displayName}
                  text={viewModel.shareText}
                />
              </div>

              <ProductDrawerOverviewHeader
                displayName={viewModel.displayName}
                subtitle={viewModel.subtitle}
                description={viewModel.description}
                hasError={viewModel.hasError}
                isLoading={isLoading}
              />
            </DrawerHeader>

            <ProductDrawerOverviewMeta
              brandName={viewModel.brandName}
              isLoading={isLoading}
              variantsSummary={viewModel.variantsSummary}
            />
          </DrawerScrollArea>

          <DrawerFooter className="shadow-custom relative mx-2 flex min-h-[84px] flex-row items-center justify-between rounded-t-2xl px-6 py-0">
            <ProductDrawerPrice
              currency={viewModel.currency}
              discount={viewModel.discount}
              displayPrice={viewModel.displayPrice}
              hasDiscount={viewModel.hasDiscount}
              isLoading={isLoading}
              price={viewModel.price}
            />
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
