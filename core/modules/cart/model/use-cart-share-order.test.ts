import type {
  CartDto,
  CatalogContactDto,
} from "@/shared/api/generated/react-query";
import { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import {
  DEFAULT_PREORDER_SETTINGS,
  METHOD_FIELDS,
  type CheckoutConfig,
} from "@/shared/lib/checkout-methods";
import { describe, expect, it } from "vitest";
import { resolveCartShareContactsOverride } from "./use-cart-share-order";

function checkoutConfig(
  overrides: Partial<CheckoutConfig> = {},
): CheckoutConfig {
  return {
    availableMethods: ["DELIVERY", "PICKUP"],
    enabledMethods: ["PICKUP"],
    methodContacts: {},
    methodFields: METHOD_FIELDS,
    preorder: DEFAULT_PREORDER_SETTINGS,
    ...overrides,
  };
}

function contact(
  type: CatalogContactDtoType,
  value: string,
  position = 0,
): CatalogContactDto {
  return {
    id: `${type}-${position}`,
    type,
    position,
    value,
  };
}

describe("resolveCartShareContactsOverride", () => {
  it("uses fresh catalog contacts instead of stale contacts saved on the cart", () => {
    const contacts = [
      contact(CatalogContactDtoType.WHATSAPP, "+72222222222"),
    ];
    const cart = {
      checkoutContacts: {
        [CatalogContactDtoType.WHATSAPP]: "+71111111111",
      },
      checkoutMethod: "PICKUP",
    } as unknown as CartDto;

    expect(
      resolveCartShareContactsOverride({
        cart,
        catalogContacts: contacts,
        checkoutConfig: checkoutConfig(),
        input: {},
      }),
    ).toMatchObject({
      [CatalogContactDtoType.WHATSAPP]: "+72222222222",
    });
  });
});
