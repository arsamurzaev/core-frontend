"use client";

import {
  CartCard,
  CartCardAction,
  getCartItemMaxQuantity,
  useCart,
  type CartItemView,
} from "@/core/modules/cart";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import React from "react";

interface CartCardListProps {
  className?: string;
  hasAction?: boolean;
  actionRenderer?: (productId: string, item?: CartItemView) => React.ReactNode;
  items: CartItemView[];
  onItemClick?: (item: CartItemView) => void;
  priceFormatMode: CatalogPriceFormatMode;
}

type CartGuestGroup = {
  id: string;
  isCurrentGuest: boolean;
  items: CartItemView[];
  title: string;
};

function resolveGuestGroupTitle(
  item: CartItemView,
  currentGuestSessionId: string | null,
): string {
  if (
    currentGuestSessionId &&
    item.guestSessionId &&
    item.guestSessionId === currentGuestSessionId
  ) {
    return item.guestName?.trim() || "Вы";
  }

  return item.guestName?.trim() || "Гость";
}

function groupCartItemsByGuest(
  items: CartItemView[],
  currentGuestSessionId: string | null,
): CartGuestGroup[] {
  const groups = new Map<string, CartGuestGroup>();

  for (const item of items) {
    const id = item.guestSessionId || "shared";
    const existing = groups.get(id);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    const isCurrentGuest = Boolean(
      currentGuestSessionId &&
      item.guestSessionId &&
      item.guestSessionId === currentGuestSessionId,
    );
    groups.set(id, {
      id,
      isCurrentGuest,
      items: [item],
      title: resolveGuestGroupTitle(item, currentGuestSessionId),
    });
  }

  return [...groups.values()].sort(
    (left, right) =>
      Number(right.isCurrentGuest) - Number(left.isCurrentGuest) ||
      left.title.localeCompare(right.title),
  );
}

export const CartCardList: React.FC<CartCardListProps> = ({
  className,
  hasAction = true,
  actionRenderer,
  items,
  onItemClick,
  priceFormatMode,
}) => {
  const { cart, hallTableSession, publicAccess } = useCart();
  const guestSessionId = hallTableSession.guestSessionId;
  const isHallTableCart = Boolean(
    hallTableSession.publicKey ||
    publicAccess?.kind === "hallTable" ||
    cart?.tableSession,
  );
  const shouldGroupByGuest = Boolean(
    isHallTableCart && items.some((item) => item.guestSessionId),
  );

  const renderItem = React.useCallback(
    (item: CartItemView) => {
      const canMutateItem =
        !guestSessionId ||
        !item.guestSessionId ||
        item.guestSessionId === guestSessionId;

      return (
        <li key={item.id}>
          <CartCard
            item={item}
            priceFormatMode={priceFormatMode}
            onClick={
              item.product && onItemClick ? () => onItemClick(item) : undefined
            }
            actions={
              actionRenderer ? (
                actionRenderer(item.productId, item)
              ) : hasAction && canMutateItem ? (
                <CartCardAction
                  productId={item.productId}
                  guestName={item.guestName}
                  guestSessionId={item.guestSessionId}
                  maxQuantity={getCartItemMaxQuantity(item)}
                  modifiers={item.modifiers}
                  quantity={item.quantity}
                  saleUnitId={item.saleUnitId}
                  variantId={item.variantId}
                />
              ) : undefined
            }
          />
        </li>
      );
    },
    [actionRenderer, guestSessionId, hasAction, onItemClick, priceFormatMode],
  );

  if (shouldGroupByGuest) {
    const groups = groupCartItemsByGuest(items, guestSessionId);

    return (
      <div className={cn("space-y-5", className)}>
        {groups.map((group) => (
          <section key={group.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <h3 className="text-base font-semibold sm:text-lg">
                {group.title}
              </h3>
              <span className="text-text-muted text-sm">
                {group.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <ul className="space-y-3">{group.items.map(renderItem)}</ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-4", className)}>{items.map(renderItem)}</ul>
  );
};
