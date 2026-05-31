import type { CartDto } from "@/shared/api/generated/react-query";
import { isCartItemForGuest } from "./cart-guest";

export function getPublicCartDeleteItemIds(params: {
  cart: CartDto | null | undefined;
  guestSessionId?: string | null;
}): string[] {
  return (params.cart?.items ?? [])
    .filter((item) => isCartItemForGuest(item, params.guestSessionId))
    .map((item) => item.id);
}
