"use client";

import {
  buildCartLineSelectionKey,
  buildCartProductSelection,
  getCartItemMaxQuantity,
  useCart,
} from "@/core/modules/cart";
import {
  CART_PRODUCT_CONTROL_MESSAGES,
  CartProductDrawerFooterAction,
  useCartProductControls,
} from "@/core/modules/cart";
import {
  buildCartModifierSelectionPayload,
  buildDefaultProductModifierSelection,
  getApplicableProductModifierGroups,
  getProductModifierSelectionError,
  getProductModifierUnitTotal,
  ProductModifierPicker,
  useProductModifiers,
  type ProductModifierSelection,
} from "@/core/modules/product-modifier";
import type { ProductUnavailableState } from "@/core/widgets/product-drawer/model/product-availability";
import {
  resolveProductPurchaseEffectiveMaxQuantity,
  resolveProductPurchaseTotalPricing,
} from "@/core/widgets/product-drawer/model/product-purchase-selection-model";
import type { ProductDrawerViewModel } from "@/core/widgets/product-drawer/model/product-drawer-view";
import { useProductPurchaseSelection } from "@/core/widgets/product-drawer/model/use-product-purchase-selection";
import { ProductDetailsPanel } from "@/core/widgets/product-drawer/ui/product-details-panel";
import { ProductSaleUnitPicker } from "@/core/widgets/product-drawer/ui/product-sale-unit-picker";
import { ProductVariantPicker } from "@/core/widgets/product-drawer/ui/product-variant-picker";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { toast } from "sonner";

interface ProductPurchaseDetailsPanelProps {
  className?: string;
  footerClassName?: string;
  initialSaleUnitId?: string | null;
  initialVariantId?: string | null;
  isLoading: boolean;
  product: ProductWithDetailsDto | null;
  productKey: string;
  resetKey: string;
  scrollAreaClassName?: string;
  ScrollAreaComponent?: React.ElementType<{
    children?: React.ReactNode;
    className?: string;
  }>;
  unavailableState?: ProductUnavailableState | null;
  viewModel: ProductDrawerViewModel;
}

const VARIANT_PICKER_SCROLL_PADDING_PX = 12;

function findNearestScrollContainer(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const canScrollY =
      style.overflowY === "auto" ||
      style.overflowY === "scroll" ||
      style.overflowY === "overlay";

    if (canScrollY && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

function scrollVariantPickerIntoView(element: HTMLElement | null) {
  if (!element || typeof window === "undefined") {
    return;
  }

  const scrollContainer = findNearestScrollContainer(element);
  if (!scrollContainer) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const topLimit = containerRect.top + VARIANT_PICKER_SCROLL_PADDING_PX;
  const bottomLimit = containerRect.bottom - VARIANT_PICKER_SCROLL_PADDING_PX;
  const scrollDelta =
    elementRect.top < topLimit
      ? elementRect.top - topLimit
      : elementRect.bottom > bottomLimit
        ? elementRect.bottom - bottomLimit
        : 0;

  if (Math.abs(scrollDelta) < 1) {
    return;
  }

  const maxScrollTop = Math.max(
    0,
    scrollContainer.scrollHeight - scrollContainer.clientHeight,
  );
  const nextScrollTop = Math.min(
    maxScrollTop,
    Math.max(0, scrollContainer.scrollTop + scrollDelta),
  );

  scrollContainer.scrollTo({
    top: nextScrollTop,
    behavior: "smooth",
  });
}

export function ProductPurchaseDetailsPanel({
  className,
  footerClassName,
  initialSaleUnitId,
  initialVariantId,
  isLoading,
  product,
  productKey,
  resetKey,
  scrollAreaClassName,
  ScrollAreaComponent,
  unavailableState,
  viewModel,
}: ProductPurchaseDetailsPanelProps) {
  const { catalog } = useCatalogState();
  const features = useCatalogCapabilities();
  const { items, shouldUseCartUi } = useCart();
  const canUseProductVariants = features.canUseProductVariants;
  const canUseCatalogSaleUnits = features.canUseCatalogSaleUnits;
  const canUseCatalogModifiers = features.canUseCatalogModifiers;
  const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
  const variantPickerRef = React.useRef<HTMLDivElement | null>(null);
  const saleUnitPickerRef = React.useRef<HTMLDivElement | null>(null);
  const modifierPickerRef = React.useRef<HTMLDivElement | null>(null);
  const variantHighlightTimerRef = React.useRef<number | null>(null);
  const saleUnitHighlightTimerRef = React.useRef<number | null>(null);
  const modifierHighlightTimerRef = React.useRef<number | null>(null);
  const [isVariantPickerHighlighted, setIsVariantPickerHighlighted] =
    React.useState(false);
  const [isSaleUnitPickerHighlighted, setIsSaleUnitPickerHighlighted] =
    React.useState(false);
  const [isModifierPickerHighlighted, setIsModifierPickerHighlighted] =
    React.useState(false);
  const [modifierSelection, setModifierSelection] =
    React.useState<ProductModifierSelection>({});
  const purchaseSelection = useProductPurchaseSelection({
    canUseCatalogSaleUnits,
    canUseProductVariants,
    initialSaleUnitId,
    initialVariantId,
    product,
    productKey,
    shouldEnforceStock,
    viewModel,
  });
  const modifiersQuery = useProductModifiers(product?.id, {
    enabled:
      canUseCatalogModifiers &&
      Boolean(product?.id) &&
      !Boolean(unavailableState),
  });
  const modifierGroups = React.useMemo(
    () =>
      getApplicableProductModifierGroups({
        groups: modifiersQuery.data,
        variantId:
          purchaseSelection.selectedVariant?.id ??
          (!canUseProductVariants
            ? (purchaseSelection.selectedSaleUnit?.variantId ??
              product?.defaultVariantId ??
              null)
            : null),
      }),
    [
      canUseProductVariants,
      modifiersQuery.data,
      product?.defaultVariantId,
      purchaseSelection.selectedSaleUnit?.variantId,
      purchaseSelection.selectedVariant?.id,
    ],
  );
  const modifierSelectionResetKey = React.useMemo(
    () =>
      [
        product?.id ?? productKey,
        purchaseSelection.selectedVariant?.id ??
          (!canUseProductVariants
            ? (purchaseSelection.selectedSaleUnit?.variantId ??
              product?.defaultVariantId)
            : null) ??
          "default",
        modifierGroups
          .map(
            (group) =>
              `${group.id}:${group.options
                .map((option) => option.id)
                .join(",")}`,
          )
          .join("|"),
      ].join(":"),
    [
      canUseProductVariants,
      modifierGroups,
      product?.defaultVariantId,
      product?.id,
      productKey,
      purchaseSelection.selectedSaleUnit?.variantId,
      purchaseSelection.selectedVariant?.id,
    ],
  );

  React.useEffect(() => {
    const defaultSelection =
      buildDefaultProductModifierSelection(modifierGroups);

    setModifierSelection(defaultSelection);
  }, [modifierGroups, modifierSelectionResetKey]);

  const selectedModifiers = React.useMemo(
    () =>
      buildCartModifierSelectionPayload({
        groups: modifierGroups,
        selection: modifierSelection,
      }),
    [modifierGroups, modifierSelection],
  );
  const modifierUnitTotal = React.useMemo(
    () =>
      getProductModifierUnitTotal({
        groups: modifierGroups,
        selection: modifierSelection,
      }),
    [modifierGroups, modifierSelection],
  );
  const modifierSelectionError = React.useMemo(
    () => getProductModifierSelectionError(modifierGroups, modifierSelection),
    [modifierGroups, modifierSelection],
  );
  const isModifierSelectionLoading =
    canUseCatalogModifiers &&
    modifiersQuery.isFetching &&
    modifiersQuery.data === undefined;
  const handleModifierSelectionChange = React.useCallback(
    (selection: ProductModifierSelection) => {
      setModifierSelection(selection);
    },
    [],
  );
  const handleVariantSelectionRequired = React.useCallback(() => {
    toast.error(CART_PRODUCT_CONTROL_MESSAGES.variantSelectionRequired);
    setIsVariantPickerHighlighted(true);
    scrollVariantPickerIntoView(variantPickerRef.current);

    if (variantHighlightTimerRef.current !== null) {
      window.clearTimeout(variantHighlightTimerRef.current);
    }

    variantHighlightTimerRef.current = window.setTimeout(() => {
      setIsVariantPickerHighlighted(false);
      variantHighlightTimerRef.current = null;
    }, 1600);
  }, []);
  const handleSaleUnitSelectionRequired = React.useCallback(() => {
    toast.error(CART_PRODUCT_CONTROL_MESSAGES.saleUnitSelectionRequired);
    setIsSaleUnitPickerHighlighted(true);
    scrollVariantPickerIntoView(saleUnitPickerRef.current);

    if (saleUnitHighlightTimerRef.current !== null) {
      window.clearTimeout(saleUnitHighlightTimerRef.current);
    }

    saleUnitHighlightTimerRef.current = window.setTimeout(() => {
      setIsSaleUnitPickerHighlighted(false);
      saleUnitHighlightTimerRef.current = null;
    }, 1600);
  }, []);
  const handleModifierSelectionRequired = React.useCallback(() => {
    toast.error(modifierSelectionError ?? "Выберите добавки");
    setIsModifierPickerHighlighted(true);
    scrollVariantPickerIntoView(modifierPickerRef.current);

    if (modifierHighlightTimerRef.current !== null) {
      window.clearTimeout(modifierHighlightTimerRef.current);
    }

    modifierHighlightTimerRef.current = window.setTimeout(() => {
      setIsModifierPickerHighlighted(false);
      modifierHighlightTimerRef.current = null;
    }, 1600);
  }, [modifierSelectionError]);
  React.useEffect(
    () => () => {
      if (variantHighlightTimerRef.current !== null) {
        window.clearTimeout(variantHighlightTimerRef.current);
      }
      if (saleUnitHighlightTimerRef.current !== null) {
        window.clearTimeout(saleUnitHighlightTimerRef.current);
      }
      if (modifierHighlightTimerRef.current !== null) {
        window.clearTimeout(modifierHighlightTimerRef.current);
      }
    },
    [],
  );
  React.useEffect(() => {
    if (!purchaseSelection.isVariantSelectionRequired) {
      setIsVariantPickerHighlighted(false);
    }
  }, [purchaseSelection.isVariantSelectionRequired]);
  React.useEffect(() => {
    if (!purchaseSelection.isSaleUnitSelectionRequired) {
      setIsSaleUnitPickerHighlighted(false);
    }
  }, [purchaseSelection.isSaleUnitSelectionRequired]);
  React.useEffect(() => {
    if (!modifierSelectionError) {
      setIsModifierPickerHighlighted(false);
    }
  }, [modifierSelectionError]);
  const selectedSaleUnitId = canUseCatalogSaleUnits
    ? purchaseSelection.selectedSaleUnit?.id
    : undefined;
  const selectedVariantId =
    canUseProductVariants && !purchaseSelection.isVariantSelectionRequired
      ? purchaseSelection.selectedVariant?.id
      : undefined;
  const cartSelection = React.useMemo(
    () =>
      buildCartProductSelection({
        modifiers: selectedModifiers,
        productId: product?.id ?? "",
        saleUnitId: selectedSaleUnitId,
        variantId: selectedVariantId,
      }),
    [product?.id, selectedModifiers, selectedSaleUnitId, selectedVariantId],
  );
  const cartSelectionKey = React.useMemo(
    () => buildCartLineSelectionKey(cartSelection),
    [cartSelection],
  );
  const cartLineMaxQuantity = React.useMemo(() => {
    if (
      purchaseSelection.isVariantSelectionRequired ||
      purchaseSelection.isSaleUnitSelectionRequired
    ) {
      return undefined;
    }

    const line = items.find(
      (item) =>
        buildCartLineSelectionKey({
          productId: item.productId,
          modifiers: item.modifiers ?? [],
          saleUnitId: item.saleUnitId,
          variantId: item.variantId,
        }) === cartSelectionKey,
    );

    return line ? getCartItemMaxQuantity(line) : undefined;
  }, [
    cartSelectionKey,
    items,
    purchaseSelection.isSaleUnitSelectionRequired,
    purchaseSelection.isVariantSelectionRequired,
  ]);
  const effectiveMaxQuantity = React.useMemo(
    () =>
      resolveProductPurchaseEffectiveMaxQuantity({
        cartLineMaxQuantity,
        purchaseMaxQuantity: purchaseSelection.maxQuantity,
      }),
    [cartLineMaxQuantity, purchaseSelection.maxQuantity],
  );
  const selectedDisplayUnitPrice =
    purchaseSelection.displayPrice === null
      ? null
      : purchaseSelection.displayPrice + modifierUnitTotal;
  const selectedBaseUnitPrice =
    purchaseSelection.selectedBasePrice === null
      ? null
      : purchaseSelection.selectedBasePrice + modifierUnitTotal;
  const cartProductSnapshot = React.useMemo(
    () =>
      purchaseSelection.cartProductSnapshot
        ? {
            ...purchaseSelection.cartProductSnapshot,
            price:
              selectedDisplayUnitPrice === null
                ? purchaseSelection.cartProductSnapshot.price
                : selectedDisplayUnitPrice,
          }
        : undefined,
    [purchaseSelection.cartProductSnapshot, selectedDisplayUnitPrice],
  );
  const cartControls = useCartProductControls(
    cartSelection,
    cartProductSnapshot,
    {
      maxQuantity: effectiveMaxQuantity,
      onVariantSelectionRequired: handleVariantSelectionRequired,
      requiresVariantSelection: purchaseSelection.isVariantSelectionRequired,
    },
  );
  const isProductSelectionRequired =
    purchaseSelection.isVariantSelectionRequired ||
    purchaseSelection.isSaleUnitSelectionRequired ||
    Boolean(modifierSelectionError);
  const displayedCartQuantity = isProductSelectionRequired
    ? 0
    : cartControls.quantity;
  const drawerCartControls = React.useMemo(
    () => ({
      ...cartControls,
      handleAdd: async () => {
        if (purchaseSelection.isVariantSelectionRequired) {
          handleVariantSelectionRequired();
          return;
        }

        if (purchaseSelection.isSaleUnitSelectionRequired) {
          handleSaleUnitSelectionRequired();
          return;
        }

        if (isModifierSelectionLoading) {
          toast.info("Загружаем добавки...");
          return;
        }

        if (modifierSelectionError) {
          handleModifierSelectionRequired();
          return;
        }

        await cartControls.handleAdd();
      },
      handleIncrement: async () => {
        if (purchaseSelection.isVariantSelectionRequired) {
          handleVariantSelectionRequired();
          return;
        }

        if (purchaseSelection.isSaleUnitSelectionRequired) {
          handleSaleUnitSelectionRequired();
          return;
        }

        if (isModifierSelectionLoading) {
          toast.info("Загружаем добавки...");
          return;
        }

        if (modifierSelectionError) {
          handleModifierSelectionRequired();
          return;
        }

        await cartControls.handleIncrement();
      },
      quantity: displayedCartQuantity,
    }),
    [
      cartControls,
      displayedCartQuantity,
      handleModifierSelectionRequired,
      handleSaleUnitSelectionRequired,
      handleVariantSelectionRequired,
      isModifierSelectionLoading,
      modifierSelectionError,
      purchaseSelection.isSaleUnitSelectionRequired,
      purchaseSelection.isVariantSelectionRequired,
    ],
  );
  const totalPricing = React.useMemo(
    () =>
      resolveProductPurchaseTotalPricing({
        displayPrice: selectedDisplayUnitPrice,
        quantity: displayedCartQuantity,
        selectedBasePrice: selectedBaseUnitPrice,
      }),
    [displayedCartQuantity, selectedBaseUnitPrice, selectedDisplayUnitPrice],
  );

  return (
    <ProductDetailsPanel
      attributeRows={viewModel.attributeRows}
      brandName={viewModel.brandName ?? undefined}
      className={className}
      currency={viewModel.currency}
      description={viewModel.description}
      displayName={viewModel.displayName}
      displayPrice={totalPricing.displayPrice}
      discount={viewModel.discount}
      footerAction={
        !unavailableState && shouldUseCartUi && product?.id ? (
          <CartProductDrawerFooterAction
            controls={drawerCartControls}
            requiresSelection={isProductSelectionRequired}
          />
        ) : null
      }
      footerClassName={footerClassName}
      hasDiscount={
        purchaseSelection.hasSelectedDiscount || viewModel.hasDiscount
      }
      hasError={viewModel.hasError}
      imageUrls={viewModel.imageUrls}
      isLoading={isLoading}
      price={totalPricing.selectedBasePrice}
      priceFormatMode={viewModel.priceFormatMode}
      resetKey={resetKey}
      scrollAreaClassName={scrollAreaClassName}
      ScrollAreaComponent={ScrollAreaComponent}
      shareText={viewModel.shareText}
      subtitle={viewModel.subtitle}
      unavailableState={unavailableState}
      variantPicker={
        !unavailableState && canUseProductVariants && product ? (
          <div
            ref={variantPickerRef}
            className={cn(
              "scroll-mt-8 rounded-2xl transition-shadow",
              isVariantPickerHighlighted &&
                "ring-primary/45 ring-2 ring-offset-2 ring-offset-background",
            )}
          >
            <ProductVariantPicker
              currency={viewModel.currency}
              onChange={purchaseSelection.setSelectedVariantId}
              selectedVariantId={purchaseSelection.selectedVariantId}
              shouldEnforceStock={shouldEnforceStock}
              variants={purchaseSelection.selectableVariants}
            />
          </div>
        ) : null
      }
      saleUnitPicker={
        !unavailableState && canUseCatalogSaleUnits && product ? (
          <div
            ref={saleUnitPickerRef}
            className={cn(
              "scroll-mt-8 rounded-2xl transition-shadow",
              isSaleUnitPickerHighlighted &&
                "ring-primary/45 ring-2 ring-offset-2 ring-offset-background",
            )}
          >
            <ProductSaleUnitPicker
              currency={viewModel.currency}
              onChange={purchaseSelection.setSelectedSaleUnitId}
              priceFormatMode={viewModel.priceFormatMode}
              saleUnits={purchaseSelection.saleUnits}
              selectedSaleUnitId={
                purchaseSelection.selectedSaleUnit?.id ?? null
              }
            />
          </div>
        ) : null
      }
      modifierPicker={
        !unavailableState &&
        canUseCatalogModifiers &&
        product &&
        modifiersQuery.isLoading ? (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            Загружаем добавки...
          </div>
        ) : !unavailableState &&
          canUseCatalogModifiers &&
          product &&
          modifierGroups.length ? (
          <div
            ref={modifierPickerRef}
            className={cn(
              "scroll-mt-8 rounded-2xl transition-shadow",
              isModifierPickerHighlighted &&
                "ring-primary/45 ring-2 ring-offset-2 ring-offset-background",
            )}
          >
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Добавки</div>
              </div>
            </div>
            <ProductModifierPicker
              currency={viewModel.currency}
              groups={modifierGroups}
              onChange={handleModifierSelectionChange}
              priceFormatMode={viewModel.priceFormatMode}
              selection={modifierSelection}
              variant="chips"
            />
          </div>
        ) : null
      }
      variantsSummary={
        !unavailableState && canUseProductVariants
          ? viewModel.variantsSummary
          : null
      }
    />
  );
}
