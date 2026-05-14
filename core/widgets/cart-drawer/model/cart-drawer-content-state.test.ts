import type { CheckoutConfig } from "@/shared/lib/checkout-methods";
import { describe, expect, it } from "vitest";
import { resolveCartDrawerContentState } from "./cart-drawer-content-state";

const checkoutConfig: CheckoutConfig = {
  availableMethods: ["DELIVERY", "PICKUP"],
  enabledMethods: ["DELIVERY"],
  methodContacts: {},
  methodFields: {
    DELIVERY: [],
    PICKUP: [],
    PREORDER: [],
  },
};

describe("cart drawer content state", () => {
  it("shows status message for in-progress customer carts", () => {
    expect(
      resolveCartDrawerContentState({
        checkoutConfig,
        checkoutMethod: "DELIVERY",
        comment: "",
        isCommentLocked: false,
        isManagedPublicCart: false,
        itemsCount: 1,
        status: "IN_PROGRESS",
        statusMessage: "Manager joined",
      }).shouldShowStatusMessage,
    ).toBe(true);
  });

  it("hides status message for managed public carts", () => {
    expect(
      resolveCartDrawerContentState({
        checkoutConfig,
        checkoutMethod: "DELIVERY",
        comment: "",
        isCommentLocked: false,
        isManagedPublicCart: true,
        itemsCount: 1,
        status: "IN_PROGRESS",
        statusMessage: "Manager joined",
      }).shouldShowStatusMessage,
    ).toBe(false);
  });

  it("shows readonly comment even when checkout method is missing", () => {
    const state = resolveCartDrawerContentState({
      checkoutConfig,
      checkoutMethod: null,
      comment: " please call ",
      isCommentLocked: true,
      isManagedPublicCart: false,
      itemsCount: 1,
      status: null,
      statusMessage: null,
    });

    expect(state.normalizedComment).toBe("please call");
    expect(state.shouldShowReadonlyComment).toBe(true);
    expect(state.shouldShowReadonlySection).toBe(true);
  });

  it("hides checkout methods when checkout is disabled for the current catalog mode", () => {
    const state = resolveCartDrawerContentState({
      checkoutConfig,
      checkoutMethod: "DELIVERY",
      comment: "",
      isCheckoutEnabled: false,
      isCommentLocked: true,
      isManagedPublicCart: false,
      itemsCount: 1,
      status: null,
      statusMessage: null,
    });

    expect(state.hasCheckoutMethods).toBe(false);
    expect(state.shouldShowReadonlySection).toBe(false);
  });
});
