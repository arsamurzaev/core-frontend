"use client";

import { useRouter } from "next/navigation";
import React from "react";
import type { ProductWithDetailsDto } from "@/shared/api/generated";
import { ProductDrawer } from "./product-drawer";

type CloseStrategy = "replace-home" | "back-or-home";

interface ProductDrawerRouteProps {
  productSlug: string;
  closeStrategy: CloseStrategy;
  initialProduct?: ProductWithDetailsDto | null;
}

function hasSameOriginReferrer(): boolean {
  if (typeof window === "undefined") return false;
  const referrer = document.referrer;
  if (!referrer) return false;

  try {
    return new URL(referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export const ProductDrawerRoute: React.FC<ProductDrawerRouteProps> = ({
  productSlug,
  closeStrategy,
  initialProduct,
}) => {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    if (!productSlug) return;
    setOpen(true);
  }, [productSlug]);

  const handleCloseRoute = React.useCallback(() => {
    if (closeStrategy === "replace-home") {
      router.replace("/");
      return;
    }

    if (typeof window === "undefined") {
      router.replace("/");
      return;
    }

    const canGoBack = window.history.length > 1 && hasSameOriginReferrer();
    if (canGoBack) {
      router.back();
      return;
    }

    router.replace("/");
  }, [closeStrategy, router]);

  if (!productSlug) {
    return null;
  }

  return (
    <ProductDrawer
      open={open}
      productSlug={productSlug}
      initialProduct={initialProduct}
      onOpenChange={setOpen}
      onAfterClose={handleCloseRoute}
    />
  );
};
