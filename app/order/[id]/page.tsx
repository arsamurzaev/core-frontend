"use client";

import { usePublicOrderQuery } from "@/core/modules/cart";
import { OrderDrawer } from "@/core/modules/order/order-drawer";
import { HomeContent } from "@/core/views/home/home-content";
import { useCurrentBusiness } from "@/shared/providers/business-provider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function OrderPage() {
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
      router.replace("/");
    }
  }, [hasCapability, router]);

  return (
    <>
      <HomeContent />
      <OrderDrawer
        open={open}
        orderId={orderId}
        onOpenChange={setOpen}
        onAfterClose={() => router.replace("/")}
      />
    </>
  );
}
