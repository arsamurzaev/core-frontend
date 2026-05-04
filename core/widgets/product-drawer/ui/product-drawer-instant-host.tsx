"use client";

import {
  PRODUCT_DRAWER_INSTANT_OPEN_EVENT,
  PRODUCT_DRAWER_ROUTE_CLOSE_EVENT,
  PRODUCT_DRAWER_ROUTE_OPEN_EVENT,
  type ProductDrawerCloseStrategy,
  type ProductDrawerInstantOpenDetail,
  type ProductDrawerRouteCloseDetail,
  type ProductDrawerRouteOpenDetail,
} from "@/core/widgets/product-drawer/model/product-drawer-instant-events";
import type {
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { buildHomeHrefWithCatalogQuery } from "@/shared/lib/product-route";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { ProductDrawer } from "./product-drawer";

interface InstantDrawerState {
  closeStrategy?: ProductDrawerCloseStrategy;
  href?: string;
  initialProduct?: ProductWithDetailsDto | null;
  productSlug: string;
  previewProduct?: ProductWithAttributesDto | null;
}

interface ProductDrawerInstantHostProps {
  supportsBrands?: boolean;
}

export const ProductDrawerInstantHost: React.FC<
  ProductDrawerInstantHostProps
> = ({ supportsBrands = true }) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = React.useState<InstantDrawerState | null>(null);
  const [open, setOpen] = React.useState(false);
  const stateRef = React.useRef<InstantDrawerState | null>(null);
  const homeHref = React.useMemo(
    () => buildHomeHrefWithCatalogQuery(searchParams),
    [searchParams],
  );

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    const handleInstantOpen = (event: Event) => {
      const detail = (event as CustomEvent<ProductDrawerInstantOpenDetail>)
        .detail;

      if (!detail?.product?.slug) {
        return;
      }

      setState((current) => ({
        ...current,
        href: detail.href,
        productSlug: detail.product.slug,
        previewProduct: detail.product,
      }));
      setOpen(true);
    };
    const handleRouteOpen = (event: Event) => {
      const detail = (event as CustomEvent<ProductDrawerRouteOpenDetail>)
        .detail;

      if (!detail?.productSlug) {
        return;
      }

      setState((current) => ({
        ...current,
        closeStrategy: detail.closeStrategy,
        initialProduct: detail.initialProduct ?? null,
        productSlug: detail.productSlug,
        previewProduct:
          current?.productSlug === detail.productSlug
            ? current.previewProduct
            : null,
      }));
      setOpen(true);
    };
    const handleRouteClose = (event: Event) => {
      const detail = (event as CustomEvent<ProductDrawerRouteCloseDetail>)
        .detail;
      const current = stateRef.current;

      if (current?.productSlug === detail?.productSlug) {
        setOpen(false);
      }
    };

    window.addEventListener(PRODUCT_DRAWER_INSTANT_OPEN_EVENT, handleInstantOpen);
    window.addEventListener(PRODUCT_DRAWER_ROUTE_OPEN_EVENT, handleRouteOpen);
    window.addEventListener(PRODUCT_DRAWER_ROUTE_CLOSE_EVENT, handleRouteClose);

    return () => {
      window.removeEventListener(
        PRODUCT_DRAWER_INSTANT_OPEN_EVENT,
        handleInstantOpen,
      );
      window.removeEventListener(PRODUCT_DRAWER_ROUTE_OPEN_EVENT, handleRouteOpen);
      window.removeEventListener(
        PRODUCT_DRAWER_ROUTE_CLOSE_EVENT,
        handleRouteClose,
      );
    };
  }, []);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const handleAfterClose = React.useCallback(() => {
    const closeStrategy = state?.closeStrategy;

    setState(null);

    if (!pathname.includes("/product/")) {
      return;
    }

    if (closeStrategy === "back") {
      if (typeof window !== "undefined" && window.history.length <= 1) {
        router.push(homeHref, { scroll: false });
        return;
      }

      router.back();
      return;
    }

    if (closeStrategy === "push-home" || !closeStrategy) {
      router.push(homeHref, { scroll: false });
    }
  }, [homeHref, pathname, router, state?.closeStrategy]);

  if (!state) {
    return null;
  }

  return (
    <ProductDrawer
      open={open}
      productSlug={state.productSlug}
      initialProduct={state.initialProduct}
      previewProduct={state.previewProduct}
      supportsBrands={supportsBrands}
      onOpenChange={handleOpenChange}
      onAfterClose={handleAfterClose}
    />
  );
};
