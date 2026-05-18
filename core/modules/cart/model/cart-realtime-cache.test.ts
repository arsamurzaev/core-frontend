import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CartDto } from "@/shared/api/generated/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  applyCartRealtimeData,
  removePublicCartRealtimeData,
} from "./cart-realtime-cache";

function cart(overrides: Partial<CartDto> = {}): CartDto {
  return {
    id: "cart-1",
    items: [],
    status: "DRAFT",
    ...overrides,
  } as CartDto;
}

function access(publicKey = "public-key"): CartPublicAccess {
  return {
    publicKey,
    rawLink: `/?c=${publicKey}`,
  };
}

describe("cart realtime cache helpers", () => {
  it("writes current-cart SSE events only through the current cart writer", () => {
    const setCurrentCartData = vi.fn();
    const setPublicCartData = vi.fn();
    const snapshot = cart();

    applyCartRealtimeData({
      cart: snapshot,
      setCurrentCartData,
      setPublicCartData,
    });

    expect(setCurrentCartData).toHaveBeenCalledWith(snapshot, {
      ignoreStale: true,
    });
    expect(setPublicCartData).not.toHaveBeenCalled();
  });

  it("writes public-cart SSE events only through the public cart writer", () => {
    const setCurrentCartData = vi.fn();
    const setPublicCartData = vi.fn();
    const publicAccess = access();
    const snapshot = cart({ publicKey: publicAccess.publicKey });

    applyCartRealtimeData({
      access: publicAccess,
      cart: snapshot,
      setCurrentCartData,
      setPublicCartData,
    });

    expect(setCurrentCartData).not.toHaveBeenCalled();
    expect(setPublicCartData).toHaveBeenCalledWith(publicAccess, snapshot, {
      ignoreStale: true,
    });
  });

  it("removes only the related public cart query when public access is dismissed", () => {
    const removeQueries = vi.fn();
    const clearStoredPublicAccess = vi.fn();
    const publicAccess = access("shared-cart");

    removePublicCartRealtimeData({
      access: publicAccess,
      clearStoredPublicAccess,
      queryClient: { removeQueries } as unknown as QueryClient,
    });

    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: cartQueryKeys.public(publicAccess.publicKey),
    });
    expect(clearStoredPublicAccess).toHaveBeenCalledTimes(1);
  });
});
