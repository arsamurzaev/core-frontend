import { describe, expect, it } from "vitest";
import {
  getCartCheckoutData,
  getCartCheckoutMethod,
  isCheckoutCartStatus,
  resolveCartDrawerVisibility,
} from "./cart-drawer-state";

describe("cart drawer state", () => {
  it("extracts checkout data from cart snapshots", () => {
    const cart = {
      checkoutMethod: "PICKUP",
      checkoutData: {
        address: "Main street",
        mapUrl: "https://maps.test/place",
      },
    };

    expect(getCartCheckoutMethod(cart)).toBe("PICKUP");
    expect(getCartCheckoutData(cart)).toEqual({
      address: "Main street",
      mapUrl: "https://maps.test/place",
    });
  });

  it("keeps empty checkout carts visible by runtime status", () => {
    const state = resolveCartDrawerVisibility({
      canCreateManagerOrder: false,
      cart: { publicKey: null, status: "DRAFT" },
      hasItems: false,
      hasPreparedShareOrder: false,
      isPublicMode: false,
      publicAccessPublicKey: null,
      shouldUseCartUi: true,
      status: "IN_PROGRESS",
    });

    expect(isCheckoutCartStatus("IN_PROGRESS")).toBe(true);
    expect(state.shouldKeepEmptySharedCartOpen).toBe(true);
    expect(state.shouldHideDrawer).toBe(false);
  });

  it("hides an empty private draft cart without public access", () => {
    const state = resolveCartDrawerVisibility({
      canCreateManagerOrder: false,
      cart: { publicKey: null, status: "DRAFT" },
      hasItems: false,
      hasPreparedShareOrder: false,
      isPublicMode: false,
      publicAccessPublicKey: null,
      shouldUseCartUi: true,
    });

    expect(state.canDeleteCurrentCart).toBe(false);
    expect(state.hasPublicCartLink).toBe(false);
    expect(state.hasSharedCart).toBe(false);
    expect(state.shouldHideDrawer).toBe(true);
  });

  it("exposes manager start bar when catalog supports manager orders without active cart UI", () => {
    const state = resolveCartDrawerVisibility({
      canCreateManagerOrder: true,
      cart: null,
      hasItems: false,
      hasPreparedShareOrder: false,
      isPublicMode: false,
      publicAccessPublicKey: null,
      shouldUseCartUi: false,
    });

    expect(state.shouldHideDrawer).toBe(true);
    expect(state.shouldShowManagerOrderStartBar).toBe(true);
  });
});
