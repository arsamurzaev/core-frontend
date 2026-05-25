import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { describe, expect, it } from "vitest";
import {
  buildIntegrationCheckoutOrderInput,
  hasIikoCartItems,
  resolveIntegrationCheckoutFields,
  validateIntegrationCheckout,
} from "./integration-checkout";

function item(provider?: "IIKO" | "MOYSKLAD"): CartItemView {
  return {
    currency: "RUB",
    displayLineTotal: 100,
    hasDiscount: false,
    id: "cart-item-1",
    imageUrl: "/image.png",
    name: "Pizza",
    originalLineTotal: 100,
    product: provider
      ? ({
          integration: {
            externalCode: null,
            externalId: "external-product-1",
            lastSyncedAt: null,
            provider,
          },
          variants: [],
        } as CartItemView["product"])
      : undefined,
    productId: "product-1",
    productSlug: "pizza",
    quantity: 1,
    saleUnitId: null,
    saleUnitLabel: null,
    subtitle: "",
    variantId: null,
    variantLabel: null,
  };
}

describe("integration checkout model", () => {
  it("detects iiko cart items", () => {
    expect(hasIikoCartItems([item("MOYSKLAD")])).toBe(false);
    expect(hasIikoCartItems([item("IIKO")])).toBe(true);
  });

  it("asks only for missing iiko fields", () => {
    expect(
      resolveIntegrationCheckoutFields({
        hasIikoItems: false,
        orderInput: {},
      }),
    ).toEqual([]);

    expect(
      resolveIntegrationCheckoutFields({
        hasIikoItems: true,
        orderInput: {},
      }),
    ).toEqual(["customerName", "phone", "checkoutMethod", "address"]);

    expect(
      resolveIntegrationCheckoutFields({
        hasIikoItems: true,
        orderInput: {
          checkoutData: {
            address: "Client street, 2",
            customerName: "Ivan",
            phone: "+79990000000",
          },
          checkoutMethod: "DELIVERY",
        },
      }),
    ).toEqual([]);
  });

  it("keeps normal cart data and adds integration-only fields", () => {
    const input = buildIntegrationCheckoutOrderInput({
      baseInput: {
        checkoutData: {
          address: "Client street, 2",
        },
        checkoutMethod: "DELIVERY",
        comment: "no onion",
      },
      data: {
        customerName: "Ivan",
        phone: "+79990000000",
      },
      location: {
        address: "Cafe address",
        mapUrl: "https://maps.example",
      },
      method: "DELIVERY",
    });

    expect(input).toMatchObject({
      checkoutData: {
        address: "Client street, 2",
        customerName: "Ivan",
        phone: "+79990000000",
      },
      checkoutMethod: "DELIVERY",
      comment: "no onion",
    });
    expect(input.checkoutSummary).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Ivan"),
        expect.stringContaining("+79990000000"),
        expect.stringContaining("Client street, 2"),
      ]),
    );
  });

  it("validates delivery address and fills pickup location snapshot", () => {
    expect(
      validateIntegrationCheckout({
        data: { customerName: "Ivan", phone: "+79990000000" },
        fields: ["customerName", "phone", "checkoutMethod", "address"],
        method: "DELIVERY",
      }),
    ).toBeTruthy();

    expect(
      buildIntegrationCheckoutOrderInput({
        baseInput: {},
        data: {
          customerName: "Ivan",
          phone: "+79990000000",
        },
        location: {
          address: "Cafe address",
          mapUrl: "https://maps.example",
        },
        method: "PICKUP",
      }).checkoutData,
    ).toEqual({
      address: "Cafe address",
      customerName: "Ivan",
      mapUrl: "https://maps.example",
      phone: "+79990000000",
    });
  });

  it("accepts protected hall payload token as table identity", () => {
    expect(
      resolveIntegrationCheckoutFields({
        catalogMode: "HALL",
        hasIikoItems: true,
        orderInput: {
          checkoutData: {
            integrationPayloadToken: "ip1.test.encrypted",
            orderMode: "HALL",
            personsCount: 2,
            customerName: "Ivan",
          },
          checkoutMethod: "PICKUP",
        },
      }),
    ).toEqual([]);

    expect(
      validateIntegrationCheckout({
        data: {
          integrationPayloadToken: "ip1.test.encrypted",
          orderMode: "HALL",
        },
        fields: ["hallTable"],
        method: "PICKUP",
      }),
    ).toBeNull();
  });

  it("accepts backend-stored hall table code as table identity", () => {
    expect(
      resolveIntegrationCheckoutFields({
        catalogMode: "HALL",
        hasIikoItems: true,
        orderInput: {
          checkoutData: {
            t: "Ab7Kp92x",
            orderMode: "HALL",
            personsCount: 2,
            customerName: "Ivan",
          },
          checkoutMethod: "PICKUP",
        },
      }),
    ).toEqual([]);

    expect(
      validateIntegrationCheckout({
        data: {
          tableCode: "Ab7Kp92x",
          orderMode: "HALL",
        },
        fields: ["hallTable"],
        method: "PICKUP",
      }),
    ).toBeNull();
  });
});
