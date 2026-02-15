"use client";

import { HomeContent } from "@/core/views/home/home-content";
import { ProductDrawer } from "@/core/widgets/product-drawer/ui/product-drawer";
import { useParams, useRouter } from "next/navigation";
import React from "react";

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const [open, setOpen] = React.useState(true);

  return (
    <>
      <HomeContent />
      <ProductDrawer
        open={open}
        productId={productId}
        onOpenChange={setOpen}
        onAfterClose={() => router.replace("/")}
      />
    </>
  );
}
