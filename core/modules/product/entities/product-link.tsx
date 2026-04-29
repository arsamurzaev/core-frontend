"use client";

import { saveProductDrawerPreview } from "@/core/widgets/product-drawer/model/product-drawer-preview";
import { dispatchProductDrawerInstantOpen } from "@/core/widgets/product-drawer/model/product-drawer-instant-events";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { buildProductHrefWithCatalogQuery } from "@/shared/lib/product-route";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const href = React.useMemo(
    () => buildProductHrefWithCatalogQuery(slug, searchParams),
    [searchParams, slug],
  );
  const prepareNavigation = React.useCallback(() => {
    if (product) {
      saveProductDrawerPreview(product);
    }

    router.prefetch(href);
  }, [href, product, router]);
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

    prepareNavigation();

    if (product) {
      dispatchProductDrawerInstantOpen({ href, product });
    }
  }, [href, prepareNavigation, product]);

  return (
    <Link
      href={href}
      scroll={scroll}
      className={cn(className)}
      onClick={openInstantDrawer}
      onFocus={prepareNavigation}
      onMouseEnter={prepareNavigation}
      onPointerDownCapture={prepareNavigation}
      onTouchStartCapture={prepareNavigation}
    >
      {children}
    </Link>
  );
};
