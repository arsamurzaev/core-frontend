"use client";

import type { CartProductSnapshot } from "@/core/modules/cart/model/cart-context";
import { useCart } from "@/core/modules/cart/model/cart-context";
import { buildCartLineSelectionKey } from "@/core/modules/cart/model/cart-line-selection";
import { getCartProductVariantPickerOptions } from "@/core/modules/cart/model/cart-product-variant-options";
import {
  type ProductVariantPickerOptionDto,
  type ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";
import React from "react";
import { toast } from "sonner";

const DRAWER_TITLE = "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u044e";
const EMPTY_LABEL = "\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u0439";
const VARIANT_LIMIT_MESSAGE =
  "\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u0430\u044f \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430.";

interface CartProductVariantDrawerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  product: ProductWithAttributesDto;
}

function buildCartSnapshot(
  product: ProductWithAttributesDto,
  option: ProductVariantPickerOptionDto,
): CartProductSnapshot {
  return {
    id: product.id,
    name: product.name,
    price: option.price ?? product.price,
    slug: product.slug,
  };
}

export function CartProductVariantDrawer({
  onOpenChange,
  open,
  product,
}: CartProductVariantDrawerProps) {
  const { incrementLine, isBusy, quantityByLineKey } = useCart();
  const { catalog } = useCatalogState();
  const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
  const variantOptions = React.useMemo(
    () =>
      getCartProductVariantPickerOptions({
        product,
        shouldEnforceStock,
      }),
    [product, shouldEnforceStock],
  );

  const handleVariantClick = React.useCallback(
    async (option: ProductVariantPickerOptionDto) => {
      const quantity =
        quantityByLineKey[
          buildCartLineSelectionKey({
            productId: product.id,
            variantId: option.id,
          })
        ] ??
        0;

      if (shouldEnforceStock && quantity >= option.maxQuantity) {
        toast.error(VARIANT_LIMIT_MESSAGE);
        return;
      }

      try {
        await incrementLine(
          {
            productId: product.id,
            variantId: option.id,
          },
          buildCartSnapshot(product, option),
        );
        onOpenChange(false);
      } catch (error) {
        toast.error(extractApiErrorMessage(error));
      }
    },
    [
      incrementLine,
      onOpenChange,
      product,
      quantityByLineKey,
      shouldEnforceStock,
    ],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        hideHandle
        className="p-4 pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        <DrawerTitle className="text-center text-lg font-semibold">
          {DRAWER_TITLE}
        </DrawerTitle>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {!variantOptions.length ? (
            <Button type="button" disabled>
              {EMPTY_LABEL}
            </Button>
          ) : null}

          {variantOptions.map((option) => {
            const quantity =
              quantityByLineKey[
                buildCartLineSelectionKey({
                  productId: product.id,
                  variantId: option.id,
                })
              ] ?? 0;
            const isQuantityLimitReached =
              shouldEnforceStock && quantity >= option.maxQuantity;

            return (
              <Button
                key={option.id}
                type="button"
                disabled={isBusy || isQuantityLimitReached}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleVariantClick(option);
                }}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
