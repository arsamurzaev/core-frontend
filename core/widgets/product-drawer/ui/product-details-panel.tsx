"use client";

import { ProductDrawerImageCarousel } from "@/core/widgets/product-drawer/ui/product-drawer-image-carousel";
import {
  ProductDrawerOverviewHeader,
  ProductDrawerOverviewMeta,
} from "@/core/widgets/product-drawer/ui/product-drawer-overview";
import { ProductDrawerPrice } from "@/core/widgets/product-drawer/ui/product-drawer-price";
import { ProductDrawerShareActions } from "@/core/widgets/product-drawer/ui/product-drawer-share-actions";
import type { ProductUnavailableState } from "@/core/widgets/product-drawer/model/product-availability";
import type { ProductDrawerAttributeRow } from "@/core/widgets/product-drawer/model/product-drawer-view";
import { cn } from "@/shared/lib/utils";
import { PackageX } from "lucide-react";
import React from "react";

interface ProductDetailsPanelProps {
  attributeRows: ProductDrawerAttributeRow[];
  brandName?: string;
  className?: string;
  currency: string;
  description: string;
  displayName: string;
  displayPrice: number;
  discount: number;
  footerAction?: React.ReactNode;
  footerClassName?: string;
  hasDiscount: boolean;
  hasError: boolean;
  imageUrls: string[];
  isLoading: boolean;
  price: number;
  resetKey: string;
  scrollAreaClassName?: string;
  ScrollAreaComponent?: React.ElementType<{
    children?: React.ReactNode;
    className?: string;
  }>;
  shareText?: string;
  saleUnitPicker?: React.ReactNode;
  subtitle: string;
  unavailableState?: ProductUnavailableState | null;
  variantPicker?: React.ReactNode;
  variantsSummary: string | null;
}

export function ProductDetailsPanel({
  attributeRows,
  brandName,
  className,
  currency,
  description,
  displayName,
  displayPrice,
  discount,
  footerAction,
  footerClassName,
  hasDiscount,
  hasError,
  imageUrls,
  isLoading,
  price,
  resetKey,
  saleUnitPicker,
  scrollAreaClassName,
  ScrollAreaComponent = "div",
  shareText,
  subtitle,
  unavailableState,
  variantPicker,
  variantsSummary,
}: ProductDetailsPanelProps) {
  const ScrollArea = ScrollAreaComponent;

  if (unavailableState && !isLoading) {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        <div className="flex min-h-[22rem] flex-1 flex-col items-center justify-center px-6 py-14 text-center">
          <div className="bg-secondary mb-4 flex size-12 items-center justify-center rounded-full">
            <PackageX className="size-6" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold">{unavailableState.title}</h2>
          <p className="text-muted-foreground mt-2 max-w-80 text-sm leading-6">
            {unavailableState.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <ScrollArea className={cn("min-h-0 flex-1", scrollAreaClassName)}>
        <div className="overflow-visible">
          <div className="relative">
            <span className="sr-only">carousel</span>
            <ProductDrawerImageCarousel
              key={resetKey}
              imageUrls={imageUrls}
              isLoading={isLoading}
              productName={displayName}
            />
            <ProductDrawerShareActions title={displayName} text={shareText} />
          </div>

          <div className="pb-4">
            <ProductDrawerOverviewHeader
              brandName={brandName}
              displayName={displayName}
              subtitle={subtitle}
              description={description}
              hasError={hasError}
              isLoading={isLoading}
            />
          </div>

          {variantPicker}
          {saleUnitPicker}

          <ProductDrawerOverviewMeta
            attributeRows={attributeRows}
            isLoading={isLoading}
            variantsSummary={variantsSummary}
          />
        </div>
      </ScrollArea>

      <div
        className={cn(
          "shadow-custom relative mx-2 flex min-h-[84px] flex-row items-center justify-between rounded-t-2xl px-6 py-0",
          footerClassName,
        )}
      >
        <ProductDrawerPrice
          currency={currency}
          discount={discount}
          displayPrice={displayPrice}
          hasDiscount={hasDiscount}
          isLoading={isLoading}
          price={price}
        />
        {footerAction}
      </div>
    </div>
  );
}
