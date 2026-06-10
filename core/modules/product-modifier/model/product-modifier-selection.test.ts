import { describe, expect, it } from "vitest";
import {
  buildCartModifierSelectionPayload,
  getApplicableProductModifierGroups,
  getProductModifierSelectionError,
} from "./product-modifier-selection";
import type { ProductModifierGroup } from "./product-modifier-types";

function createModifierGroup(
  overrides: Partial<ProductModifierGroup> = {},
): ProductModifierGroup {
  return {
    catalogModifierGroupId: null,
    code: "addons",
    description: null,
    displayOrder: 0,
    id: "group-1",
    isActive: true,
    isRequired: false,
    maxSelected: null,
    minSelected: 0,
    name: "Добавки",
    options: [
      {
        catalogModifierOptionId: null,
        code: "cheese",
        displayOrder: 0,
        id: "option-1",
        isAvailable: true,
        isDefault: false,
        maxQuantity: null,
        name: "Сыр",
        price: "100",
        productModifierGroupId: "group-1",
      },
    ],
    productId: "product-1",
    scope: "PRODUCT",
    variantId: null,
    ...overrides,
  };
}

describe("product modifier selection", () => {
  it("does not require optional groups even when minSelected is stored", () => {
    expect(
      getProductModifierSelectionError(
        [createModifierGroup({ isRequired: false, minSelected: 2 })],
        {},
      ),
    ).toBeNull();
  });

  it("requires required groups", () => {
    expect(
      getProductModifierSelectionError(
        [createModifierGroup({ isRequired: true, minSelected: 1 })],
        {},
      ),
    ).toBe("Выберите опцию: Добавки");
  });

  it("filters groups without available options", () => {
    expect(
      getApplicableProductModifierGroups({
        groups: [
          createModifierGroup({
            options: [
              {
                ...createModifierGroup().options[0],
                isAvailable: false,
              },
            ],
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("builds cart payload from selected option quantities", () => {
    expect(
      buildCartModifierSelectionPayload({
        groups: [createModifierGroup()],
        selection: { "option-1": 2 },
      }),
    ).toEqual([
      {
        groupName: "Добавки",
        optionName: "Сыр",
        productModifierGroupId: "group-1",
        productModifierOptionId: "option-1",
        quantity: 2,
        unitPrice: "100",
      },
    ]);
  });
});
