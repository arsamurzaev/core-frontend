"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { buildHomeHrefWithCatalogQuery } from "@/shared/lib/product-route";
import { getProductDrawerPreview } from "../model/product-drawer-preview";
import { ProductDrawer } from "./product-drawer";

type CloseStrategy = "push-home" | "back";

interface ProductDrawerRouteProps {
  productSlug: string;
  closeStrategy: CloseStrategy;
  initialProduct?: ProductWithDetailsDto | null;
}

export const ProductDrawerRoute: React.FC<ProductDrawerRouteProps> = ({
  productSlug,
  closeStrategy,
  initialProduct,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(true);
  const [previewProduct, setPreviewProduct] = React.useState(() =>
    getProductDrawerPreview(productSlug),
  );
  const homeHref = React.useMemo(
    () => buildHomeHrefWithCatalogQuery(searchParams),
    [searchParams],
  );

  React.useEffect(() => {
    setPreviewProduct(getProductDrawerPreview(productSlug));
    setOpen(true);
  }, [productSlug]);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true);
      return;
    }

    setOpen(false);
  }, []);

  const handleAfterClose = React.useCallback(() => {
    if (closeStrategy === "back") {
      if (typeof window !== "undefined" && window.history.length <= 1) {
        router.push(homeHref, { scroll: false });
        return;
      }

      router.back();
      return;
    }

    router.push(homeHref, { scroll: false });
  }, [closeStrategy, homeHref, router]);

  if (!productSlug) {
    return null;
  }

  return (
    <ProductDrawer
      open={open}
      productSlug={productSlug}
      initialProduct={initialProduct}
      previewProduct={previewProduct}
      onOpenChange={handleOpenChange}
      onAfterClose={handleAfterClose}
    />
  );
};
