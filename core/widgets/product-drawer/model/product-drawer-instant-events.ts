"use client";

import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";

export const PRODUCT_DRAWER_INSTANT_OPEN_EVENT = "product-drawer:instant-open";
export const PRODUCT_DRAWER_ROUTE_READY_EVENT = "product-drawer:route-ready";

export interface ProductDrawerInstantOpenDetail {
  href: string;
  product: ProductWithAttributesDto;
}

export function dispatchProductDrawerInstantOpen(
  detail: ProductDrawerInstantOpenDetail,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ProductDrawerInstantOpenDetail>(
      PRODUCT_DRAWER_INSTANT_OPEN_EVENT,
      { detail },
    ),
  );
}

export function dispatchProductDrawerRouteReady(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(PRODUCT_DRAWER_ROUTE_READY_EVENT));
}
