"use client";

import {
  PRODUCT_DRAWER_INSTANT_OPEN_EVENT,
  PRODUCT_DRAWER_ROUTE_READY_EVENT,
  type ProductDrawerInstantOpenDetail,
} from "@/core/widgets/product-drawer/model/product-drawer-instant-events";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { buildHomeHrefWithCatalogQuery } from "@/shared/lib/product-route";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { ProductDrawer } from "./product-drawer";

interface InstantDrawerState {
  href: string;
  product: ProductWithAttributesDto;
}

export const ProductDrawerInstantHost: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = React.useState<InstantDrawerState | null>(null);
  const [open, setOpen] = React.useState(false);
  const homeHref = React.useMemo(
    () => buildHomeHrefWithCatalogQuery(searchParams),
    [searchParams],
  );

  React.useEffect(() => {
    const handleInstantOpen = (event: Event) => {
      const detail = (event as CustomEvent<ProductDrawerInstantOpenDetail>)
        .detail;

      if (!detail?.product?.slug) {
        return;
      }

      setState(detail);
      setOpen(true);
    };
    const handleRouteReady = () => {
      setOpen(false);
      setState(null);
    };

    window.addEventListener(PRODUCT_DRAWER_INSTANT_OPEN_EVENT, handleInstantOpen);
    window.addEventListener(PRODUCT_DRAWER_ROUTE_READY_EVENT, handleRouteReady);

    return () => {
      window.removeEventListener(
        PRODUCT_DRAWER_INSTANT_OPEN_EVENT,
        handleInstantOpen,
      );
      window.removeEventListener(PRODUCT_DRAWER_ROUTE_READY_EVENT, handleRouteReady);
    };
  }, []);

  React.useEffect(() => {
    if (!state) {
      return;
    }

    const targetPath = state.href.split("?")[0] || state.href;

    if (pathname === targetPath) {
      setOpen(false);
      setState(null);
    }
  }, [pathname, state]);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const handleAfterClose = React.useCallback(() => {
    setState(null);

    if (pathname.includes("/product/") || pathname.includes("/products/")) {
      router.push(homeHref, { scroll: false });
    }
  }, [homeHref, pathname, router]);

  if (!state) {
    return null;
  }

  return (
    <ProductDrawer
      open={open}
      productSlug={state.product.slug}
      previewProduct={state.product}
      onOpenChange={handleOpenChange}
      onAfterClose={handleAfterClose}
    />
  );
};
