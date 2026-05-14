import { describe, expect, it } from "vitest";
import {
  getCartDrawerShareButtonLabel,
  resolveCartDrawerFooterAction,
} from "./cart-drawer-footer-state";

describe("cart drawer footer state", () => {
  it("prioritizes manager completion over share and collapse actions", () => {
    expect(
      resolveCartDrawerFooterAction({
        canShare: true,
        hasCollapseAction: true,
        isManagerOrderCart: true,
      }),
    ).toBe("complete-order");
  });

  it("uses share before collapse for customer carts", () => {
    expect(
      resolveCartDrawerFooterAction({
        canShare: true,
        hasCollapseAction: true,
        isManagerOrderCart: false,
      }),
    ).toBe("share");
  });

  it("falls back to collapse when no checkout action is available", () => {
    expect(
      resolveCartDrawerFooterAction({
        canShare: false,
        hasCollapseAction: true,
        isManagerOrderCart: false,
      }),
    ).toBe("collapse");
  });

  it("switches share button label after cart is shared or share drawer opened", () => {
    expect(
      getCartDrawerShareButtonLabel({
        hasOpenedShareDrawer: false,
        hasSharedCart: false,
      }),
    ).toBe("Оформить заказ");

    expect(
      getCartDrawerShareButtonLabel({
        hasOpenedShareDrawer: true,
        hasSharedCart: false,
      }),
    ).toBe("Поделиться");
  });
});
