"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { ProductDrawer } from "./product-drawer";

type CloseStrategy = "replace-home" | "back-or-home";

interface ProductDrawerRouteProps {
  productSlug: string;
  closeStrategy: CloseStrategy;
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
}) => {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !productSlug) return;
    setOpen(true);
  }, [mounted, productSlug]);

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

  if (!productSlug || !mounted) {
    return null;
  }

  return (
    <ProductDrawer
      open={open}
      productSlug={productSlug}
      onOpenChange={setOpen}
      onAfterClose={handleCloseRoute}
    />
  );
};
