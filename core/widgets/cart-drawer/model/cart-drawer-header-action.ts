type CartHeaderActionSnapshot = {
  assignedManagerId?: string | null;
  publicKey?: string | null;
  status?: string | null;
};

export type CartDrawerHeaderActionKind =
  | "delete-current-cart"
  | "detach-public-cart"
  | "none";

export interface CartDeleteConfirmationCopy {
  cancelText: string;
  confirmText: string;
  description: string;
  title: string;
}

const DELETE_CART_TITLE = "Удалить корзину?";
const DELETE_CART_CONFIRM_TEXT = "Удалить";
const CANCEL_TEXT = "Отмена";
const ASSIGNED_MANAGER_DELETE_DESCRIPTION =
  "Корзина уже в работе у менеджера, поэтому она только отвяжется от вас.";
const SHARED_CART_DELETE_DESCRIPTION =
  "Корзина и публичная ссылка будут удалены. Восстановить товары не получится.";
const DEFAULT_CART_DELETE_DESCRIPTION =
  "Корзина будет удалена полностью. Восстановить товары не получится.";

export const DETACH_PUBLIC_CART_CONFIRMATION: CartDeleteConfirmationCopy = {
  title: "Открепить публичную корзину?",
  description:
    "Ссылка останется рабочей, но эта корзина перестанет быть привязанной к текущей сессии.",
  confirmText: "Открепить",
  cancelText: CANCEL_TEXT,
};

export const DETACH_PUBLIC_CART_SUCCESS_MESSAGE =
  "Публичная корзина откреплена.";
export const DELETE_ASSIGNED_CART_SUCCESS_MESSAGE = "Корзина отвязана.";
export const DELETE_CART_SUCCESS_MESSAGE = "Корзина удалена.";

export function resolveCartDrawerHeaderAction(params: {
  canDeleteCurrentCart: boolean;
  hasItems: boolean;
  isManagedPublicCart: boolean;
  isPublicMode: boolean;
}): CartDrawerHeaderActionKind {
  if (params.isManagedPublicCart) {
    return "none";
  }

  if (params.isPublicMode) {
    return "detach-public-cart";
  }

  if (!params.hasItems && !params.canDeleteCurrentCart) {
    return "none";
  }

  return "delete-current-cart";
}

export function isCartAssignedToManager(
  cart: CartHeaderActionSnapshot | null | undefined,
): boolean {
  return cart?.status === "IN_PROGRESS" || Boolean(cart?.assignedManagerId);
}

export function getDeleteCartConfirmationCopy(
  cart: CartHeaderActionSnapshot | null | undefined,
): CartDeleteConfirmationCopy {
  const isAssignedToManager = isCartAssignedToManager(cart);
  const isSharedCurrentCart = Boolean(cart?.publicKey);

  return {
    title: DELETE_CART_TITLE,
    description: isAssignedToManager
      ? ASSIGNED_MANAGER_DELETE_DESCRIPTION
      : isSharedCurrentCart
        ? SHARED_CART_DELETE_DESCRIPTION
        : DEFAULT_CART_DELETE_DESCRIPTION,
    confirmText: DELETE_CART_CONFIRM_TEXT,
    cancelText: CANCEL_TEXT,
  };
}

export function getDeleteCartSuccessMessage(
  cart: CartHeaderActionSnapshot | null | undefined,
): string {
  return isCartAssignedToManager(cart)
    ? DELETE_ASSIGNED_CART_SUCCESS_MESSAGE
    : DELETE_CART_SUCCESS_MESSAGE;
}
