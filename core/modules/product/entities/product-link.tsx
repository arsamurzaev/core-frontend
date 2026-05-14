"use client";

import { dispatchProductDrawerInstantOpen } from "@/core/modules/product/model/product-drawer-instant-events";
import { saveProductDrawerPreview } from "@/core/modules/product/model/product-drawer-preview";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { buildProductHrefWithCatalogQuery } from "@/shared/lib/product-route";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

interface ProductLinkProps extends React.PropsWithChildren {
  slug: string;
  className?: string;
  product?: ProductWithAttributesDto;
  scroll?: boolean;
}

export const ProductLink: React.FC<ProductLinkProps> = ({
  slug,
  className,
  product,
  scroll = false,
  children,
}) => {
  const searchParams = useSearchParams();
  const href = React.useMemo(
    () => buildProductHrefWithCatalogQuery(slug, searchParams),
    [searchParams, slug],
  );
  const saveDrawerPreview = React.useCallback(() => {
    if (product) {
      saveProductDrawerPreview(product);
    }
  }, [product]);

  const openInstantDrawer = React.useCallback((event: React.MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    saveDrawerPreview();

    if (product) {
      dispatchProductDrawerInstantOpen({ href, product });
    }
  }, [href, product, saveDrawerPreview]);

  return (
    <Link
      href={href}
      prefetch={false}
      scroll={scroll}
      className={cn(className)}
      onClick={openInstantDrawer}
      onFocus={saveDrawerPreview}
      onPointerDownCapture={saveDrawerPreview}
      onTouchStartCapture={saveDrawerPreview}
    >
      {children}
    </Link>
  );
};
