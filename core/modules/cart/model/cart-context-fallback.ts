import type { CartContextValue } from "@/core/modules/cart/model/cart-context.types";

const CART_NOT_READY_ERROR_MESSAGE =
  "\u041a\u043e\u0440\u0437\u0438\u043d\u0430 \u0435\u0449\u0435 \u043d\u0435 \u0433\u043e\u0442\u043e\u0432\u0430.";

async function rejectCartNotReady(): Promise<never> {
  throw new Error(CART_NOT_READY_ERROR_MESSAGE);
}

export const CART_CONTEXT_FALLBACK_VALUE: CartContextValue = {
  autoExpandPublicCartAccessKey: null,
  canCreateManagerOrder: false,
  cart: null,
  catalogMode: "DELIVERY",
  clearCart: async () => {},
  completeManagedOrder: rejectCartNotReady,
  deleteCurrentCart: async () => {},
  decrementLine: async () => {},
  decrementProduct: async () => {},
  detachPublicCart: () => {},
  incrementLine: async () => {},
  incrementProduct: async () => {},
  setLineQuantity: async () => {},
  setProductQuantity: async () => {},
  isBusy: false,
  isHydrated: false,
  isLoading: true,
  isManagerOrderCart: false,
  isManagedPublicCart: false,
  isOwnSharedCart: false,
  isPublicMode: false,
  items: [],
  mode: "current",
  prepareShareOrder: rejectCartNotReady,
  canShare: false,
  publicAccess: null,
  quantityByLineKey: {},
  quantityByProductId: {},
  shouldUseCartUi: false,
  startManagerOrder: async () => {},
  status: null,
  statusMessage: null,
  totals: {
    hasDiscount: false,
    itemsCount: 0,
    originalSubtotal: 0,
    subtotal: 0,
  },
};
