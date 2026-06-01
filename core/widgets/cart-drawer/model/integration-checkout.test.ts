import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { describe, expect, it } from "vitest";
import {
  buildIntegrationCheckoutOrderInput,
  getInitialIntegrationCheckoutMethod,
  hasIikoCartItems,
  resolveIntegrationCheckoutFields,
  resolveEffectiveIntegrationCheckoutFields,
  validateIntegrationCheckout,
  validateIntegrationPolicyConsent,
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
        } as unknown as CartItemView["product"])
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

  it("resolves default method and extra preorder fields for inline checkout", () => {
    expect(
      getInitialIntegrationCheckoutMethod({
        availableMethods: ["PICKUP", "DELIVERY"],
        orderInput: {},
      }),
    ).toBe("PICKUP");

    expect(
      getInitialIntegrationCheckoutMethod({
        availableMethods: ["PICKUP", "DELIVERY"],
        orderInput: { checkoutMethod: "DELIVERY" },
      }),
    ).toBe("DELIVERY");

    expect(
      resolveEffectiveIntegrationCheckoutFields({
        fields: ["checkoutMethod"],
        method: "PREORDER",
      }),
    ).toEqual(["checkoutMethod", "hallTable", "personsCount"]);
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

  it("requires an iiko table for preorder only when manager completes it", () => {
    expect(
      resolveIntegrationCheckoutFields({
        hasIikoItems: true,
        orderInput: {
          checkoutData: {
            customerName: "Ivan",
            phone: "+79990000000",
            personsCount: 2,
            visitDate: "2026-05-26",
            visitTime: "19:30",
          },
          checkoutMethod: "PREORDER",
        },
      }),
    ).toEqual([]);

    expect(
      resolveIntegrationCheckoutFields({
        hasIikoItems: true,
        requirePreorderTable: true,
        orderInput: {
          checkoutData: {
            customerName: "Ivan",
            phone: "+79990000000",
            personsCount: 2,
            visitDate: "2026-05-26",
            visitTime: "19:30",
          },
          checkoutMethod: "PREORDER",
        },
      }),
    ).toEqual(["hallTable"]);

    expect(
      resolveIntegrationCheckoutFields({
        hasIikoItems: true,
        requirePreorderTable: true,
        orderInput: {
          checkoutData: {
            customerName: "Ivan",
            phone: "+79990000000",
            personsCount: 2,
            tableNumber: "11",
            visitDate: "2026-05-26",
            visitTime: "19:30",
          },
          checkoutMethod: "PREORDER",
        },
      }),
    ).toEqual(["hallTable"]);

    expect(
      resolveIntegrationCheckoutFields({
        hasIikoItems: true,
        requirePreorderTable: true,
        orderInput: {
          checkoutData: {
            customerName: "Ivan",
            iikoTableId: "table-11",
            phone: "+79990000000",
            personsCount: 2,
            tableNumber: "11",
            visitDate: "2026-05-26",
            visitTime: "19:30",
          },
          checkoutMethod: "PREORDER",
        },
      }),
    ).toEqual([]);

    expect(
      validateIntegrationCheckout({
        data: { iikoTableId: "table-11", tableNumber: "11" },
        fields: ["hallTable"],
        method: "PREORDER",
      }),
    ).toBeNull();
  });

  it("does not accept legacy encrypted hall payload as table identity", () => {
    expect(
      resolveIntegrationCheckoutFields({
        catalogMode: "HALL",
        hasIikoItems: true,
        orderInput: {
          checkoutData: {
            orderMode: "HALL",
            personsCount: 2,
            customerName: "Ivan",
          },
          checkoutMethod: "PICKUP",
        },
      }),
    ).toEqual(["hallTable"]);

    expect(
      validateIntegrationCheckout({
        data: {
          orderMode: "HALL",
        },
        fields: ["hallTable"],
        method: "PICKUP",
      }),
    ).toBeTruthy();
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

  it("requires integration policy consent", () => {
    expect(validateIntegrationPolicyConsent(false)).toBeTruthy();
    expect(validateIntegrationPolicyConsent(true)).toBeNull();
  });
});
