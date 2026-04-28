"use client";

import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";

const PRODUCT_DRAWER_PREVIEW_STORAGE_KEY = "product-drawer-preview";

type ProductDrawerPreviewStorage = Record<string, ProductWithAttributesDto>;

function readPreviewStorage(): ProductDrawerPreviewStorage {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(PRODUCT_DRAWER_PREVIEW_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ProductDrawerPreviewStorage)
      : {};
  } catch {
    return {};
  }
}

export function saveProductDrawerPreview(product: ProductWithAttributesDto): void {
  if (typeof window === "undefined" || !product.slug) {
    return;
  }

  const previews = readPreviewStorage();
  previews[product.slug] = product;

  try {
    window.sessionStorage.setItem(
      PRODUCT_DRAWER_PREVIEW_STORAGE_KEY,
      JSON.stringify(previews),
    );
  } catch {
    // Preview is a UX optimization; navigation should never depend on storage.
  }
}

export function getProductDrawerPreview(
  slug: string,
): ProductWithAttributesDto | null {
  const preview = readPreviewStorage()[slug];
  return preview?.slug === slug ? preview : null;
}
