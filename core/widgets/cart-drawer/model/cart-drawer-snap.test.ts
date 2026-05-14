import { describe, expect, it } from "vitest";
import {
  getPublicCartAccessKey,
  shouldExpandPublicCart,
  shouldLockCartDrawerPageScroll,
} from "./cart-drawer-snap";

describe("cart drawer snap state", () => {
  it("uses public access keys only in public mode", () => {
    expect(
      getPublicCartAccessKey({
        isPublicMode: true,
        publicAccessPublicKey: "public-key",
      }),
    ).toBe("public-key");

    expect(
      getPublicCartAccessKey({
        isPublicMode: false,
        publicAccessPublicKey: "public-key",
      }),
    ).toBeNull();
  });

  it("auto-expands each public cart access key once", () => {
    expect(
      shouldExpandPublicCart({
        autoExpandPublicCartAccessKey: "public-key",
        lastExpandedPublicCartAccessKey: null,
        publicCartAccessKey: "public-key",
      }),
    ).toBe(true);

    expect(
      shouldExpandPublicCart({
        autoExpandPublicCartAccessKey: "public-key",
        lastExpandedPublicCartAccessKey: "public-key",
        publicCartAccessKey: "public-key",
      }),
    ).toBe(false);
  });

  it("locks page scroll only for visible fully expanded cart drawer", () => {
    expect(
      shouldLockCartDrawerPageScroll({
        isFullyExpanded: true,
        shouldHideCartWhileProductRouteOpen: false,
        shouldHideDrawer: false,
      }),
    ).toBe(true);

    expect(
      shouldLockCartDrawerPageScroll({
        isFullyExpanded: true,
        shouldHideCartWhileProductRouteOpen: true,
        shouldHideDrawer: false,
      }),
    ).toBe(false);
  });
});
