"use client";

import dynamic from "next/dynamic";
import React from "react";

const CartDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/cart-drawer/ui/cart-drawer").then(
      (module) => module.CartDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export const LazyCartDrawer: React.FC = () => {
  return <CartDrawerDynamic />;
};
