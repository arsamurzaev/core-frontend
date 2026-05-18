"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { buildCartLineSelectionKey } from "@/core/modules/cart/model/cart-line-selection";
import {
  buildCartProductSelectionFromVariantOption,
  buildCartProductVariantSnapshot,
} from "@/core/modules/cart/model/cart-product-selection";
import {
  getCartProductVariantPickerItems,
  type CartProductVariantPickerItem,
} from "@/core/modules/cart/model/cart-product-variant-options";
import {
  type ProductVariantPickerOptionDto,
  type ProductWithAttributesDto,
  useProductControllerGetBySlug,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import React from "react";
import { toast } from "sonner";

const DRAWER_TITLE = "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u044e";
const EMPTY_LABEL = "\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u0439";
const LOADING_LABEL = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u0438...";
const VARIANT_LIMIT_MESSAGE =
  "\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u0430\u044f \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430.";
const VARIANT_MAX_QUANTITY_LABEL = "\u0412 \u043a\u043e\u0440\u0437\u0438\u043d\u0435 \u043c\u0430\u043a\u0441\u0438\u043c\u0443\u043c";

function isVariantQuantityLimitReached(
  option: ProductVariantPickerOptionDto,
  quantity: number,
  shouldEnforceStock: boolean,
): boolean {
  return (
    shouldEnforceStock &&
    typeof option.maxQuantity === "number" &&
    quantity >= option.maxQuantity
  );
}

interface CartProductVariantDrawerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  product: ProductWithAttributesDto;
}

export function CartProductVariantDrawer({
  onOpenChange,
  open,
  product,
}: CartProductVariantDrawerProps) {
  const { incrementLine, isBusy, quantityByLineKey } = useCart();
  const { catalog } = useCatalogState();
  const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
  const productSlugForApi = React.useMemo(
    () => encodeURIComponent(product.slug),
    [product.slug],
  );
  const cardVariantItems = React.useMemo(
    () =>
      getCartProductVariantPickerItems({
        product,
        shouldEnforceStock,
      }),
    [product, shouldEnforceStock],
  );
  const shouldLoadDetailedOptions =
    open &&
    cardVariantItems.length === 0 &&
    (product.requiresVariantSelection ||
      (product.variantSummary?.activeCount ?? 0) > 1);
  const { data: detailedProduct, isFetching: isFetchingDetailedProduct } =
    useProductControllerGetBySlug(productSlugForApi, {
      query: {
        enabled: shouldLoadDetailedOptions,
        staleTime: 30_000,
      },
    });
  const variantItems = React.useMemo(() => {
    if (cardVariantItems.length > 0) {
      return cardVariantItems;
    }

    if (!detailedProduct) {
      return [];
    }

    return getCartProductVariantPickerItems({
      product: detailedProduct,
      shouldEnforceStock,
    });
  }, [cardVariantItems, detailedProduct, shouldEnforceStock]);

  const handleVariantClick = React.useCallback(
    async (item: CartProductVariantPickerItem) => {
      if (!item.availability.isSelectable) {
        return;
      }

      const option = item.option;
      const selection = buildCartProductSelectionFromVariantOption({
        option,
        productId: product.id,
      });
      const quantity =
        quantityByLineKey[buildCartLineSelectionKey(selection)] ?? 0;

      if (
        isVariantQuantityLimitReached(option, quantity, shouldEnforceStock)
      ) {
        toast.error(VARIANT_LIMIT_MESSAGE);
        return;
      }

      try {
        await incrementLine(
          selection,
          buildCartProductVariantSnapshot(product, option),
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
    <AppDrawer open={open} onOpenChange={onOpenChange}>
      <AppDrawer.Content
        className="max-h-[80dvh] pb-4"
        onClick={(event) => event.stopPropagation()}
      >
        <AppDrawer.Header
          title={DRAWER_TITLE}
          description={null}
          titleClassName="text-lg"
        />

        <DrawerScrollArea className="px-4 pb-2">
          <div className="flex flex-wrap justify-center gap-2">
            {isFetchingDetailedProduct && !variantItems.length ? (
              <Button type="button" variant="outline" disabled>
                {LOADING_LABEL}
              </Button>
            ) : null}

            {!isFetchingDetailedProduct && !variantItems.length ? (
              <Button type="button" variant="outline" disabled>
                {EMPTY_LABEL}
              </Button>
            ) : null}

            {variantItems.map((item) => {
              const { availability, option } = item;
              const selection = buildCartProductSelectionFromVariantOption({
                option,
                productId: product.id,
              });
              const quantity =
                quantityByLineKey[buildCartLineSelectionKey(selection)] ?? 0;
              const isQuantityLimitReached =
                isVariantQuantityLimitReached(
                  option,
                  quantity,
                  shouldEnforceStock,
                );
              const disabledReason = !availability.isSelectable
                ? availability.label
                : isQuantityLimitReached
                  ? VARIANT_MAX_QUANTITY_LABEL
                  : null;

              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="secondary"
                  disabled={
                    isBusy ||
                    !availability.isSelectable ||
                    isQuantityLimitReached
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void handleVariantClick(item);
                  }}
                  className="h-auto min-h-10 flex-col gap-0.5 rounded-full px-4 py-2"
                >
                  <span>{option.label}</span>
                  {disabledReason ? (
                    <span className="text-[10px] font-normal opacity-70">
                      {disabledReason}
                    </span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </DrawerScrollArea>
      </AppDrawer.Content>
    </AppDrawer>
  );
}
