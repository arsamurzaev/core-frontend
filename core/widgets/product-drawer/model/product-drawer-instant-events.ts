"use client";

import type {
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";

export const PRODUCT_DRAWER_INSTANT_OPEN_EVENT = "product-drawer:instant-open";
export const PRODUCT_DRAWER_ROUTE_OPEN_EVENT = "product-drawer:route-open";
export const PRODUCT_DRAWER_ROUTE_CLOSE_EVENT = "product-drawer:route-close";

export type ProductDrawerCloseStrategy = "push-home" | "back";

export interface ProductDrawerInstantOpenDetail {
  href: string;
  product: ProductWithAttributesDto;
}

export interface ProductDrawerRouteOpenDetail {
  closeStrategy: ProductDrawerCloseStrategy;
  initialProduct?: ProductWithDetailsDto | null;
  productSlug: string;
}

export interface ProductDrawerRouteCloseDetail {
  productSlug: string;
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

export function dispatchProductDrawerRouteOpen(
  detail: ProductDrawerRouteOpenDetail,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ProductDrawerRouteOpenDetail>(
      PRODUCT_DRAWER_ROUTE_OPEN_EVENT,
      { detail },
    ),
  );
}

export function dispatchProductDrawerRouteClose(
  detail: ProductDrawerRouteCloseDetail,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ProductDrawerRouteCloseDetail>(
      PRODUCT_DRAWER_ROUTE_CLOSE_EVENT,
      { detail },
    ),
  );
}
