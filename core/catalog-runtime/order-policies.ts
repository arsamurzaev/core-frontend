import type {
  CatalogRuntimeCapabilities,
  CatalogRuntimePolicies,
} from "./metadata-contracts";

type CatalogRuntimeOrderPolicySource = {
  manifest: {
    capabilities: Pick<
      CatalogRuntimeCapabilities,
      "hasCartCardActionSlot" | "supportsManagerOrder" | "supportsPreorderCheckout"
    >;
    policies: Pick<
      CatalogRuntimePolicies,
      "cartActionMode" | "checkoutMethods" | "defaultCheckoutMethods"
    >;
  };
};

export interface CatalogRuntimeOrderPolicy {
  checkoutMethods: CatalogRuntimePolicies["checkoutMethods"];
  defaultCheckoutMethods: CatalogRuntimePolicies["defaultCheckoutMethods"];
  supportsPreorderCheckout: boolean;
  supportsManagerOrder: boolean;
  usesCustomCartCardAction: boolean;
}

export function getCatalogRuntimeOrderPolicy(
  runtime: CatalogRuntimeOrderPolicySource,
): CatalogRuntimeOrderPolicy {
  return {
    checkoutMethods: runtime.manifest.policies.checkoutMethods,
    defaultCheckoutMethods: runtime.manifest.policies.defaultCheckoutMethods,
    supportsPreorderCheckout:
      runtime.manifest.capabilities.supportsPreorderCheckout,
    supportsManagerOrder: runtime.manifest.capabilities.supportsManagerOrder,
    usesCustomCartCardAction:
      runtime.manifest.capabilities.hasCartCardActionSlot &&
      runtime.manifest.policies.cartActionMode === "runtime-slot",
  };
}

export function catalogRuntimeSupportsPreorderCheckout(
  runtime: CatalogRuntimeOrderPolicySource,
): boolean {
  return getCatalogRuntimeOrderPolicy(runtime).supportsPreorderCheckout;
}

export function catalogRuntimeSupportsManagerOrder(
  runtime: CatalogRuntimeOrderPolicySource,
): boolean {
  return getCatalogRuntimeOrderPolicy(runtime).supportsManagerOrder;
}

export function shouldUseCatalogRuntimeCartCardAction(
  runtime: CatalogRuntimeOrderPolicySource,
): boolean {
  return getCatalogRuntimeOrderPolicy(runtime).usesCustomCartCardAction;
}
