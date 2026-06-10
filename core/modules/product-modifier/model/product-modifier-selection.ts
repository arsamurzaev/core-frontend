import type { CartLineModifierSelection } from "@/core/modules/cart/model/cart-line-key";
import { toNumberValue } from "@/shared/lib/attributes";
import type {
  ProductModifierGroup,
  ProductModifierOption,
  ProductModifierSelection,
} from "./product-modifier-types";

export function getApplicableProductModifierGroups(params: {
  groups?: ProductModifierGroup[] | null;
  variantId?: string | null;
}): ProductModifierGroup[] {
  const variantId = params.variantId?.trim() || null;

  return (params.groups ?? [])
    .filter((group) => {
      if (!group.isActive || group.options.length === 0) {
        return false;
      }

      return group.variantId ? group.variantId === variantId : true;
    })
    .map((group) => ({
      ...group,
      options: group.options
        .filter((option) => option.isAvailable)
        .slice()
        .sort(compareProductModifierOptions),
    }))
    .filter((group) => group.options.length > 0)
    .sort(compareProductModifierGroups);
}

export function compareProductModifierGroups(
  left: ProductModifierGroup,
  right: ProductModifierGroup,
): number {
  return (
    left.displayOrder - right.displayOrder ||
    left.name.localeCompare(right.name, "ru") ||
    left.id.localeCompare(right.id)
  );
}

export function compareProductModifierOptions(
  left: ProductModifierOption,
  right: ProductModifierOption,
): number {
  return (
    left.displayOrder - right.displayOrder ||
    left.name.localeCompare(right.name, "ru") ||
    left.id.localeCompare(right.id)
  );
}

export function getProductModifierOptionQuantity(
  selection: ProductModifierSelection,
  optionId: string,
): number {
  const quantity = selection[optionId] ?? 0;
  return Number.isFinite(quantity) ? Math.max(0, Math.trunc(quantity)) : 0;
}

export function getProductModifierGroupSelectedQuantity(
  group: ProductModifierGroup,
  selection: ProductModifierSelection,
): number {
  return group.options.reduce(
    (sum, option) =>
      sum + getProductModifierOptionQuantity(selection, option.id),
    0,
  );
}

export function setProductModifierOptionQuantity(params: {
  groups: ProductModifierGroup[];
  selection: ProductModifierSelection;
  groupId: string;
  optionId: string;
  quantity: number;
}): ProductModifierSelection {
  const group = params.groups.find((item) => item.id === params.groupId);
  const option = group?.options.find((item) => item.id === params.optionId);

  if (!group || !option) {
    return params.selection;
  }

  const next = { ...params.selection };
  const requestedQuantity = Math.max(0, Math.trunc(params.quantity));

  if (group.maxSelected === 1) {
    for (const groupOption of group.options) {
      delete next[groupOption.id];
    }

    if (requestedQuantity > 0) {
      next[option.id] = 1;
    }

    return cleanupProductModifierSelection(next);
  }

  const optionMax = option.maxQuantity ?? Number.POSITIVE_INFINITY;
  const selectedWithoutOption =
    getProductModifierGroupSelectedQuantity(group, next) -
    getProductModifierOptionQuantity(next, option.id);
  const groupRemaining =
    group.maxSelected === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, group.maxSelected - selectedWithoutOption);
  const nextQuantity = Math.min(requestedQuantity, optionMax, groupRemaining);

  if (nextQuantity > 0) {
    next[option.id] = nextQuantity;
  } else {
    delete next[option.id];
  }

  return cleanupProductModifierSelection(next);
}

export function buildDefaultProductModifierSelection(
  groups: ProductModifierGroup[],
): ProductModifierSelection {
  return groups.reduce<ProductModifierSelection>((selection, group) => {
    let nextSelection = selection;

    for (const option of group.options) {
      if (!option.isDefault) {
        continue;
      }

      nextSelection = setProductModifierOptionQuantity({
        groups,
        groupId: group.id,
        optionId: option.id,
        quantity: 1,
        selection: nextSelection,
      });
    }

    return nextSelection;
  }, {});
}

export function cleanupProductModifierSelection(
  selection: ProductModifierSelection,
): ProductModifierSelection {
  return Object.entries(selection).reduce<ProductModifierSelection>(
    (result, [optionId, quantity]) => {
      const nextQuantity = Math.max(0, Math.trunc(quantity));

      if (nextQuantity > 0) {
        result[optionId] = nextQuantity;
      }

      return result;
    },
    {},
  );
}

export function getProductModifierSelectionError(
  groups: ProductModifierGroup[],
  selection: ProductModifierSelection,
): string | null {
  for (const group of groups) {
    const selectedQuantity = getProductModifierGroupSelectedQuantity(
      group,
      selection,
    );
    const minSelected = group.isRequired
      ? Math.max(1, group.minSelected)
      : 0;

    if (selectedQuantity < minSelected) {
      return minSelected === 1
        ? `Выберите опцию: ${group.name}`
        : `Выберите минимум ${minSelected}: ${group.name}`;
    }

    if (group.maxSelected !== null && selectedQuantity > group.maxSelected) {
      return `Можно выбрать не больше ${group.maxSelected}: ${group.name}`;
    }
  }

  return null;
}

export function hasProductModifierSelectionError(
  groups: ProductModifierGroup[],
  selection: ProductModifierSelection,
): boolean {
  return Boolean(getProductModifierSelectionError(groups, selection));
}

export function getProductModifierUnitTotal(params: {
  groups: ProductModifierGroup[];
  selection: ProductModifierSelection;
}): number {
  return params.groups.reduce((sum, group) => {
    return (
      sum +
      group.options.reduce((optionSum, option) => {
        const quantity = getProductModifierOptionQuantity(
          params.selection,
          option.id,
        );
        const price = toNumberValue(option.price) ?? 0;

        return optionSum + price * quantity;
      }, 0)
    );
  }, 0);
}

export function buildCartModifierSelectionPayload(params: {
  groups: ProductModifierGroup[];
  selection: ProductModifierSelection;
}): CartLineModifierSelection[] {
  return params.groups.flatMap((group) => {
    const result: CartLineModifierSelection[] = [];

    for (const option of group.options) {
      const quantity = getProductModifierOptionQuantity(
        params.selection,
        option.id,
      );

      if (quantity <= 0) {
        continue;
      }

      result.push({
        groupName: group.name,
        optionName: option.name,
        productModifierGroupId: group.id,
        productModifierOptionId: option.id,
        quantity,
        unitPrice: option.price,
      });
    }

    return result;
  });
}
