import { describe, expect, it } from "vitest";
import {
  DELETE_ASSIGNED_CART_SUCCESS_MESSAGE,
  DELETE_CART_SUCCESS_MESSAGE,
  getDeleteCartConfirmationCopy,
  getDeleteCartSuccessMessage,
  isCartAssignedToManager,
  resolveCartDrawerHeaderAction,
} from "./cart-drawer-header-action";

describe("cart drawer header action model", () => {
  it("does not expose actions for managed public carts", () => {
    expect(
      resolveCartDrawerHeaderAction({
        canDeleteCurrentCart: true,
        hasItems: true,
        isManagedPublicCart: true,
        isPublicMode: true,
      }),
    ).toBe("none");
  });

  it("detaches public cart in public mode", () => {
    expect(
      resolveCartDrawerHeaderAction({
        canDeleteCurrentCart: false,
        hasItems: false,
        isManagedPublicCart: false,
        isPublicMode: true,
      }),
    ).toBe("detach-public-cart");
  });

  it("deletes current cart only when it can be deleted", () => {
    expect(
      resolveCartDrawerHeaderAction({
        canDeleteCurrentCart: false,
        hasItems: false,
        isManagedPublicCart: false,
        isPublicMode: false,
      }),
    ).toBe("none");

    expect(
      resolveCartDrawerHeaderAction({
        canDeleteCurrentCart: false,
        hasItems: true,
        isManagedPublicCart: false,
        isPublicMode: false,
      }),
    ).toBe("delete-current-cart");
  });

  it("treats in-progress or assigned carts as manager carts", () => {
    expect(isCartAssignedToManager({ status: "IN_PROGRESS" })).toBe(true);
    expect(isCartAssignedToManager({ assignedManagerId: "manager-1" })).toBe(
      true,
    );
    expect(isCartAssignedToManager({ status: "DRAFT" })).toBe(false);
  });

  it("returns manager-specific copy for assigned carts", () => {
    const assignedCopy = getDeleteCartConfirmationCopy({
      assignedManagerId: "manager-1",
    });
    const defaultCopy = getDeleteCartConfirmationCopy(null);

    expect(assignedCopy.description).not.toBe(defaultCopy.description);
    expect(
      getDeleteCartSuccessMessage({ assignedManagerId: "manager-1" }),
    ).toBe(DELETE_ASSIGNED_CART_SUCCESS_MESSAGE);
  });

  it("returns shared-current copy for carts with public links", () => {
    const sharedCopy = getDeleteCartConfirmationCopy({
      publicKey: "public-1",
    });
    const defaultCopy = getDeleteCartConfirmationCopy(null);

    expect(sharedCopy.description).not.toBe(defaultCopy.description);
    expect(getDeleteCartSuccessMessage({ publicKey: "public-1" })).toBe(
      DELETE_CART_SUCCESS_MESSAGE,
    );
  });
});
