"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { CartIcon } from "@/shared/ui/icons/cart-icon";
import { Trash2, X } from "lucide-react";
import React from "react";

interface CartDrawerHeaderProps {
  className?: string;
  currency: string;
  hasAction: boolean;
  hasDiscount: boolean;
  onActionClick: () => void;
  price: number;
  setSnapPoint: (snapPoint: number | string) => void;
  snapPoint: number | string | null;
  totalPrice: number;
  totalQuantity: number;
}

function formatPrice(value: number) {
  return Intl.NumberFormat("ru").format(value);
}

export const CartDrawerHeader: React.FC<CartDrawerHeaderProps> = ({
  className,
  currency,
  hasAction,
  hasDiscount,
  onActionClick,
  price,
  setSnapPoint,
  snapPoint,
  totalPrice,
  totalQuantity,
}) => {
  return (
    <DrawerHeader className="grid gap-1.5 px-4 py-0">
      <DrawerTitle className="sr-only">
        {"\u041a\u043e\u0440\u0437\u0438\u043d\u0430"}
      </DrawerTitle>
      <div className={cn(className)}>
        <Button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setSnapPoint(1);
          }}
          className={cn(
            "relative flex h-11 w-full justify-between overflow-hidden rounded-full font-light transition-all",
            snapPoint === 1 && "h-0 p-0",
          )}
        >
          <div className="basis-1/3">
            <div className="relative w-fit">
              <CartIcon />
              {totalQuantity > 0 ? (
                <span className="absolute -top-[9px] -right-[6px] text-[9px] leading-none">
                  {totalQuantity}
                </span>
              ) : null}
            </div>
          </div>
          <p className="basis-1/3">Корзина</p>
          <div className={cn("basis-1/3", hasDiscount && "pt-0")}>
            {hasDiscount ? (
              <p className="absolute top-1 right-0 -translate-x-1/2 text-[9px] leading-none line-through">
                {formatPrice(totalPrice)} {currency}
              </p>
            ) : null}
            <p className="text-end">
              {formatPrice(price)} {currency}
            </p>
          </div>
        </Button>

        <div
          className={cn(
            "flex h-full items-center justify-between overflow-hidden transition-all",
            snapPoint !== 1 && "h-0 p-0",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onActionClick}
            className={cn(
              "h-5 w-5",
              !hasAction && "pointer-events-none opacity-0",
            )}
            size="icon"
            aria-label="Действие с корзиной"
          >
            <Trash2 className="text-muted" />
          </Button>

          <h3 className="sm:text-2xl">Корзина</h3>

          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-5 w-5"
              size="icon"
              aria-label="Свернуть корзину"
            >
              <X className="text-muted" />
            </Button>
          </DrawerClose>
        </div>
      </div>
      <DrawerDescription className="sr-only">Корзина</DrawerDescription>
    </DrawerHeader>
  );
};
