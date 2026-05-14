import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";

export const CART_PRODUCT_CONTROL_MESSAGES = {
  cartUpdateFallback:
    "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043a\u043e\u0440\u0437\u0438\u043d\u0443.",
  confirmCancel: "\u041e\u0442\u043c\u0435\u043d\u0430",
  confirmRemove:
    "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",
  confirmRemoveDescription:
    "\u0422\u043e\u0432\u0430\u0440 \u0431\u0443\u0434\u0435\u0442 \u0443\u0434\u0430\u043b\u0435\u043d \u0438\u0437 \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u043a\u043e\u0440\u0437\u0438\u043d\u044b.",
  confirmRemoveTitle:
    "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0442\u043e\u0432\u0430\u0440 \u0438\u0437 \u043a\u043e\u0440\u0437\u0438\u043d\u044b?",
  saleUnitUnavailable:
    "\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u0430\u044f \u0435\u0434\u0438\u043d\u0438\u0446\u0430 \u043f\u0440\u043e\u0434\u0430\u0436\u0438 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430.",
  variantSelectionRequired:
    "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u044e \u0442\u043e\u0432\u0430\u0440\u0430",
} as const;

export function normalizeCartMaxQuantity(
  maxQuantity: number | undefined,
): number | undefined {
  return typeof maxQuantity === "number" && Number.isFinite(maxQuantity)
    ? Math.max(0, maxQuantity)
    : undefined;
}

export function isCartIncrementDisabled(params: {
  maxQuantity?: number;
  quantity: number;
}): boolean {
  return (
    params.maxQuantity !== undefined && params.quantity >= params.maxQuantity
  );
}

export function shouldConfirmCartLineRemoval(quantity: number): boolean {
  return quantity === 1;
}

interface CartProductVariantSelectionProduct {
  productType?: ProductWithAttributesDto["productType"];
  variantSummary?: ProductWithAttributesDto["variantSummary"];
}

export function shouldRequireCartProductVariantSelection(params: {
  canUseProductVariants?: boolean;
  product?: CartProductVariantSelectionProduct | null;
  requiresVariantSelection?: boolean;
  variantId?: string | null;
}): boolean {
  if (params.variantId?.trim()) {
    return false;
  }

  if (params.requiresVariantSelection !== undefined) {
    return params.requiresVariantSelection;
  }

  if (params.canUseProductVariants === false || !params.product?.productType?.id) {
    return false;
  }

  const activeVariantCount = Math.max(
    0,
    params.product.variantSummary?.activeCount ?? 0,
  );
  if (activeVariantCount <= 0) {
    return false;
  }

  const singleVariantId =
    params.product.variantSummary?.singleVariantId?.trim() || undefined;

  return !(activeVariantCount === 1 && Boolean(singleVariantId));
}

export function isVariantSelectionRequiredMessage(message: string): boolean {
  return message.includes(CART_PRODUCT_CONTROL_MESSAGES.variantSelectionRequired);
}

export function getCartProductControlErrorMessage(error: unknown): string {
  return (
    extractApiErrorMessage(error) ||
    CART_PRODUCT_CONTROL_MESSAGES.cartUpdateFallback
  );
}
