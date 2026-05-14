"use client";

import React from "react";
import {
  getCatalogRuntimeCheckoutConfig,
  type CatalogCheckoutSource,
} from "./checkout";
import type { CheckoutConfig } from "@/shared/lib/checkout-methods";
import { useCatalogRuntime } from "./use-catalog-runtime";

export function useCatalogRuntimeCheckoutConfig(
  catalog: CatalogCheckoutSource,
): CheckoutConfig;
export function useCatalogRuntimeCheckoutConfig(
  catalog?: CatalogCheckoutSource | null,
): CheckoutConfig | undefined;
export function useCatalogRuntimeCheckoutConfig(
  catalog?: CatalogCheckoutSource | null,
) {
  const runtime = useCatalogRuntime();

  return React.useMemo(
    () => (catalog ? getCatalogRuntimeCheckoutConfig(catalog, runtime) : undefined),
    [catalog, runtime],
  );
}
