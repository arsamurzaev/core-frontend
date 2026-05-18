import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import type { CartDto } from "@/shared/api/generated/react-query";
import type { QueryClient } from "@tanstack/react-query";

type CartDataOptions = { ignoreStale?: boolean };

interface ApplyCartRealtimeDataParams {
  access?: CartPublicAccess | null;
  cart: CartDto;
  setCurrentCartData: (
    cart: CartDto | null,
    options?: CartDataOptions,
  ) => void;
  setPublicCartData: (
    access: CartPublicAccess | null,
    cart: CartDto | null,
    options?: CartDataOptions,
  ) => void;
}

interface RemovePublicCartRealtimeDataParams {
  access: CartPublicAccess | null;
  clearStoredPublicAccess: () => void;
  queryClient: QueryClient;
}

export function applyCartRealtimeData({
  access,
  cart,
  setCurrentCartData,
  setPublicCartData,
}: ApplyCartRealtimeDataParams): void {
  if (access) {
    setPublicCartData(access, cart, { ignoreStale: true });
    return;
  }

  setCurrentCartData(cart, { ignoreStale: true });
}

export function removePublicCartRealtimeData({
  access,
  clearStoredPublicAccess,
  queryClient,
}: RemovePublicCartRealtimeDataParams): void {
  if (!access) {
    return;
  }

  queryClient.removeQueries({
    queryKey: cartQueryKeys.public(access.publicKey),
  });
  clearStoredPublicAccess();
}
