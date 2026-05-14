import { describe, expect, it } from "vitest";
import {
  buildCartDrawerCheckoutOrderInput,
  resolveCartDrawerCheckoutDisplay,
  resolveCartDrawerCheckoutLocks,
  validateCartDrawerCheckout,
} from "./cart-drawer-checkout";

describe("cart drawer checkout model", () => {
  it("locks comment and checkout after share/public states", () => {
    expect(
      resolveCartDrawerCheckoutLocks({
        hasPreparedShareOrder: true,
        hasSharedCart: false,
        isManagedPublicCart: false,
        isPublicMode: false,
      }),
    ).toEqual({
      isCheckoutLocked: true,
      isCommentLocked: true,
    });
  });

  it("uses persisted cart checkout data only while locked", () => {
    const cart = {
      comment: "cart comment",
      checkoutData: { address: "Saved address" },
      checkoutMethod: "DELIVERY",
    };

    expect(
      resolveCartDrawerCheckoutDisplay({
        cart,
        checkoutData: { address: "Draft address" },
        checkoutMethod: "PICKUP",
        comment: "draft comment",
        isCheckoutLocked: true,
        isCommentLocked: true,
      }),
    ).toEqual({
      displayedCheckoutData: { address: "Saved address" },
      displayedCheckoutMethod: "DELIVERY",
      displayedComment: "cart comment",
    });

    expect(
      resolveCartDrawerCheckoutDisplay({
        cart,
        checkoutData: { address: "Draft address" },
        checkoutMethod: "PICKUP",
        comment: "draft comment",
        isCheckoutLocked: false,
        isCommentLocked: false,
      }),
    ).toEqual({
      displayedCheckoutData: { address: "Draft address" },
      displayedCheckoutMethod: "DELIVERY",
      displayedComment: "draft comment",
    });
  });

  it("validates editable checkout data before sharing", () => {
    expect(
      validateCartDrawerCheckout({
        checkoutData: {},
        checkoutLocation: {
          address: null,
          mapUrl: null,
        },
        checkoutMethod: "DELIVERY",
      }).error,
    ).toBeTruthy();

    expect(
      validateCartDrawerCheckout({
        checkoutData: {},
        checkoutLocation: {
          address: "Cafe address",
          mapUrl: null,
        },
        checkoutMethod: "PICKUP",
      }),
    ).toEqual({
      data: { address: "Cafe address" },
      error: null,
    });
  });

  it("ignores checkout data when checkout is disabled for the current catalog mode", () => {
    expect(
      resolveCartDrawerCheckoutDisplay({
        cart: {
          checkoutData: { address: "Saved address" },
          checkoutMethod: "DELIVERY",
        },
        checkoutData: { address: "Draft address" },
        checkoutMethod: "PICKUP",
        comment: "",
        isCheckoutEnabled: false,
        isCheckoutLocked: true,
        isCommentLocked: false,
      }),
    ).toEqual({
      displayedCheckoutData: {},
      displayedCheckoutMethod: null,
      displayedComment: "",
    });

    expect(
      validateCartDrawerCheckout({
        checkoutData: {},
        checkoutLocation: {
          address: null,
          mapUrl: null,
        },
        checkoutMethod: "DELIVERY",
        isCheckoutEnabled: false,
      }),
    ).toEqual({
      data: {},
      error: null,
    });
  });

  it("builds order input from validated data while editable and displayed data while locked", () => {
    expect(
      buildCartDrawerCheckoutOrderInput({
        checkoutValidationData: { address: "Draft address" },
        comment: "please call",
        displayedCheckoutData: { address: "Saved address" },
        displayedCheckoutMethod: "DELIVERY",
        isCheckoutLocked: false,
      }),
    ).toEqual({
      checkoutData: { address: "Draft address" },
      checkoutMethod: "DELIVERY",
      checkoutSummary: expect.arrayContaining([
        expect.stringContaining("Draft address"),
      ]),
      comment: "please call",
    });

    expect(
      buildCartDrawerCheckoutOrderInput({
        checkoutValidationData: { address: "Draft address" },
        comment: "",
        displayedCheckoutData: { address: "Saved address" },
        displayedCheckoutMethod: "DELIVERY",
        isCheckoutLocked: true,
      }).checkoutData,
    ).toEqual({ address: "Saved address" });
  });

  it("builds empty order input when checkout is disabled", () => {
    expect(
      buildCartDrawerCheckoutOrderInput({
        checkoutValidationData: { address: "Draft address" },
        comment: "table 5",
        displayedCheckoutData: { address: "Saved address" },
        displayedCheckoutMethod: "DELIVERY",
        isCheckoutEnabled: false,
        isCheckoutLocked: false,
      }),
    ).toEqual({});
  });
});
