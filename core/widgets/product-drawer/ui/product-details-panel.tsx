"use client";

import { ProductDrawerImageCarousel } from "@/core/widgets/product-drawer/ui/product-drawer-image-carousel";
import {
  ProductDrawerOverviewHeader,
  ProductDrawerOverviewMeta,
} from "@/core/widgets/product-drawer/ui/product-drawer-overview";
import { ProductDrawerPrice } from "@/core/widgets/product-drawer/ui/product-drawer-price";
import { ProductDrawerShareActions } from "@/core/widgets/product-drawer/ui/product-drawer-share-actions";
import { cn } from "@/shared/lib/utils";
import React from "react";

interface ProductDetailsPanelProps {
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
  subtitle: string;
  variantsSummary: string | null;
}

export function ProductDetailsPanel({
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
  scrollAreaClassName,
  ScrollAreaComponent = "div",
  shareText,
  subtitle,
  variantsSummary,
}: ProductDetailsPanelProps) {
  const ScrollArea = ScrollAreaComponent;

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
              displayName={displayName}
              subtitle={subtitle}
              description={description}
              hasError={hasError}
              isLoading={isLoading}
            />
          </div>

          <ProductDrawerOverviewMeta
            brandName={brandName}
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
