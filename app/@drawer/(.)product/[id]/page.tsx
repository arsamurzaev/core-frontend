"use client";

import { ProductDrawer } from "@/core/widgets/product-drawer/ui/product-drawer";
import { useParams, useRouter } from "next/navigation";
import React from "react";

export default function ProductDrawerRoute() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const [open, setOpen] = React.useState(true);

  const handleCloseRoute = React.useCallback(() => {
    if (typeof window === "undefined") {
      router.replace("/");
      return;
    }

    const hasHistory = window.history.length > 1;
    const referrer = document.referrer;
    let hasSameOriginReferrer = false;
    if (referrer) {
      try {
        hasSameOriginReferrer =
          new URL(referrer).origin === window.location.origin;
      } catch {
        hasSameOriginReferrer = false;
      }
    }

    if (hasHistory && hasSameOriginReferrer) {
      router.back();
      return;
    }

    router.replace("/");
  }, [router]);

  return (
    <ProductDrawer
      open={open}
      productId={productId}
      onOpenChange={setOpen}
      onAfterClose={handleCloseRoute}
    />
  );
}
