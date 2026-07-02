import {
  buildCartLineSelectionKey,
  buildCartProductSelection,
  getCartItemMaxQuantity,
  type CartItemView,
  type NormalizedCartLineSelection,
} from "@/core/modules/cart";

type CartProductSelectionInput = Parameters<typeof buildCartProductSelection>[0];

export type ProductCartSelection = NormalizedCartLineSelection;

export interface BuildProductCartSelectionInput {
  modifiers?: CartProductSelectionInput["modifiers"];
  productId?: string | null;
  saleUnitId?: string | null;
  variantId?: string | null;
}

export function buildProductCartSelection({
  modifiers,
  productId,
  saleUnitId,
  variantId,
}: BuildProductCartSelectionInput): ProductCartSelection {
  return buildCartProductSelection({
    modifiers,
    productId: productId ?? "",
    saleUnitId,
    variantId,
  });
}

export function findProductCartLineBySelection(params: {
  items: CartItemView[];
  selection: ProductCartSelection;
}): CartItemView | null {
  const selectionKey = buildCartLineSelectionKey(params.selection);

  return (
    params.items.find(
      (item) =>
        buildCartLineSelectionKey({
          modifiers: item.modifiers ?? [],
          productId: item.productId,
          saleUnitId: item.saleUnitId,
          variantId: item.variantId,
        }) === selectionKey,
    ) ?? null
  );
}

export function getProductCartLineMaxQuantity(params: {
  isSelectionRequired?: boolean;
  items: CartItemView[];
  selection: ProductCartSelection;
}): number | undefined {
  if (params.isSelectionRequired) {
    return undefined;
  }

  const line = findProductCartLineBySelection({
    items: params.items,
    selection: params.selection,
  });

  return line ? getCartItemMaxQuantity(line) : undefined;
}
