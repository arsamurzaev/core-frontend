"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import type { ProductWithDetailsDto } from "@/shared/api/generated";
import { ProductDrawer } from "./product-drawer";

type CloseStrategy = "push-home" | "back";

interface ProductDrawerRouteProps {
  productSlug: string;
  closeStrategy: CloseStrategy;
  initialProduct?: ProductWithDetailsDto | null;
}

function getProductSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/product/")) return null;

  const slug = pathname.slice("/product/".length).split("/")[0] ?? "";
  if (!slug) return null;

  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export const ProductDrawerRoute: React.FC<ProductDrawerRouteProps> = ({
  productSlug,
  closeStrategy,
  initialProduct,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const currentPath = pathname ?? "";
    const currentSlug = getProductSlugFromPath(currentPath);

    if (currentSlug === productSlug) {
      setOpen(true);
    }
  }, [pathname, productSlug]);

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
        router.push("/");
        return;
      }

      router.back();
      return;
    }

    router.push("/");
  }, [closeStrategy, router]);

  if (!productSlug) {
    return null;
  }

  return (
    <ProductDrawer
      open={open}
      productSlug={productSlug}
      initialProduct={initialProduct}
      onOpenChange={handleOpenChange}
      onAfterClose={handleAfterClose}
    />
  );
};
