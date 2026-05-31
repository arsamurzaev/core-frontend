import type { CartDto, CartItemDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { getPublicCartDeleteItemIds } from "./cart-public-delete";

function item(id: string, guestSessionId?: string | null): CartItemDto {
  return {
    id,
    guestSessionId,
  } as CartItemDto;
}

function cart(items: CartItemDto[]): CartDto {
  return { items } as CartDto;
}

describe("getPublicCartDeleteItemIds", () => {
  it("selects only current guest items when guest session is known", () => {
    expect(
      getPublicCartDeleteItemIds({
        cart: cart([
          item("current-1", "guest-1"),
          item("other-1", "guest-2"),
          item("current-2", "guest-1"),
          item("shared", null),
        ]),
        guestSessionId: "guest-1",
      }),
    ).toEqual(["current-1", "current-2"]);
  });

  it("selects all public cart items when there is no guest scope", () => {
    expect(
      getPublicCartDeleteItemIds({
        cart: cart([item("first", "guest-1"), item("second", null)]),
        guestSessionId: null,
      }),
    ).toEqual(["first", "second"]);
  });
});
