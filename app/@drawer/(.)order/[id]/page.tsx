"use client";

import { usePublicOrderQuery } from "@/core/modules/cart";
import { OrderDrawer } from "@/core/modules/order/order-drawer";
import { useCurrentBusiness } from "@/shared/providers/business-provider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function OrderDrawerRoute() {
  const router = useRouter();
  const { hasCapability } = useCurrentBusiness();
  const searchParams = useSearchParams();
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const orderId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const checkoutKey = searchParams.get("checkoutKey");
  const [open, setOpen] = React.useState(true);

  usePublicOrderQuery({
    publicKey: orderId,
    checkoutKey,
  });

  React.useEffect(() => {
    if (!hasCapability("order-live")) {
      router.back();
    }
  }, [hasCapability, router]);

  return (
    <OrderDrawer
      open={open}
      orderId={orderId}
      onOpenChange={setOpen}
      onAfterClose={() => router.back()}
    />
  );
}
