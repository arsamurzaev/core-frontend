"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { buildCartLineSelectionKey } from "@/core/modules/cart/model/cart-line-selection";
import { buildCartProductSelection } from "@/core/modules/cart/model/cart-product-selection";
import {
  getCartProductVariantPickerItems,
  type CartProductVariantPickerItem,
} from "@/core/modules/cart/model/cart-product-variant-options";
import {
  findProductSaleUnit,
  getProductSaleUnitContainsText,
  getProductSaleUnits,
  getSaleUnitMaxQuantity,
  type ProductSaleUnit,
} from "@/core/modules/product/model/sale-units";
import { resolveProductCardVariantState } from "@/core/modules/product/model/product-card-variant";
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
import {
  type ProductVariantDto,
  type ProductVariantPickerOptionDto,
  type ProductWithAttributesDto,
  type ProductWithDetailsDto,
  useProductControllerGetBySlug,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { toNumberValue } from "@/shared/lib/attributes";
import {
  formatCatalogPrice,
  getCatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn, getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Minus, Plus } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const VARIANT_TITLE = "Выберите вариацию";
const SALE_UNIT_TITLE = "Выберите единицу";
const MODIFIER_TITLE = "Выберите добавки";
const QUANTITY_TITLE = "Укажите количество";
const LOADING_TITLE = "Загружаем товар";
const ERROR_TITLE = "Не удалось загрузить выбор";
const EMPTY_VARIANTS_LABEL = "Нет доступных вариаций";
const LOADING_VARIANTS_LABEL = "Загружаем вариации...";
const LOADING_UNITS_LABEL = "Загружаем единицы продажи...";
const LOADING_MODIFIERS_LABEL = "Загружаем добавки...";
const RETRY_LABEL = "Повторить";
const ADD_TO_CART_LABEL = "Добавить в корзину";
const UPDATE_CART_LABEL = "Обновить корзину";
const CONTINUE_LABEL = "Далее";
const SOLD_OUT_LABEL = "В корзине максимум";
const UNIT_UNAVAILABLE_MESSAGE = "Выбранная единица продажи недоступна.";
const VARIANT_LIMIT_MESSAGE = "Выбранная вариация недоступна.";

type DrawerStep =
  | "variant"
  | "saleUnit"
  | "modifier"
  | "quantity"
  | "loading"
  | "error";

function getDrawerTitle(step: DrawerStep): string {
  switch (step) {
    case "variant":
      return VARIANT_TITLE;
    case "saleUnit":
      return SALE_UNIT_TITLE;
    case "modifier":
      return MODIFIER_TITLE;
    case "quantity":
      return QUANTITY_TITLE;
    case "error":
      return ERROR_TITLE;
    case "loading":
    default:
      return LOADING_TITLE;
  }
}

function clampPurchaseQuantity(
  quantity: number,
  maxQuantity: number | undefined,
): number {
  const normalized = Math.max(1, Math.trunc(quantity));

  if (maxQuantity === undefined) {
    return normalized;
  }

  return Math.min(normalized, Math.max(0, maxQuantity));
}

function getInitialPurchaseQuantity(
  currentCartQuantity: number,
  maxQuantity: number | undefined,
): number {
  return clampPurchaseQuantity(
    currentCartQuantity > 0 ? currentCartQuantity : 1,
    maxQuantity,
  );
}

function resolveSelectedVariantStock(params: {
  product: ProductWithAttributesDto;
  selectedVariant: ProductVariantDto | null;
  selectedVariantOption: ProductVariantPickerOptionDto | null;
}): number | null | undefined {
  return (
    params.selectedVariant?.stock ??
    params.selectedVariantOption?.stock ??
    params.product.stock
  );
}

function getBaseProductVariant(
  product: ProductWithDetailsDto | null | undefined,
): ProductVariantDto | null {
  const variants = product?.variants ?? [];
  const defaultVariantId = product?.defaultVariantId?.trim();

  return (
    (defaultVariantId
      ? (variants.find((variant) => variant.id === defaultVariantId) ?? null)
      : null) ??
    variants.find(
      (variant) =>
        variant.kind === "DEFAULT" || variant.variantKey === "default",
    ) ??
    variants.find((variant) => (variant.attributes ?? []).length === 0) ??
    null
  );
}

function getSaleUnitSource(params: {
  detailedProduct: ProductWithDetailsDto | null | undefined;
  product: ProductWithAttributesDto;
  selectedVariant: ProductVariantDto | null;
}): ProductVariantDto | ProductWithAttributesDto | ProductWithDetailsDto {
  if (params.selectedVariant) {
    return params.selectedVariant;
  }

  const baseVariant = getBaseProductVariant(params.detailedProduct);
  if (baseVariant && getProductSaleUnits(baseVariant).length > 0) {
    return baseVariant;
  }

  if (
    params.detailedProduct &&
    getProductSaleUnits(params.detailedProduct).length > 0
  ) {
    return params.detailedProduct;
  }

  return params.product;
}

function resolveSelectionMaxQuantity(params: {
  product: ProductWithAttributesDto;
  selectedSaleUnit: ProductSaleUnit | null;
  selectedVariant: ProductVariantDto | null;
  selectedVariantOption: ProductVariantPickerOptionDto | null;
  shouldEnforceStock: boolean;
}): number | undefined {
  if (!params.shouldEnforceStock) {
    return undefined;
  }

  const stock = resolveSelectedVariantStock(params);

  if (params.selectedSaleUnit) {
    return getSaleUnitMaxQuantity(stock, params.selectedSaleUnit);
  }

  if (typeof params.selectedVariantOption?.maxQuantity === "number") {
    return params.selectedVariantOption.maxQuantity;
  }

  return getSaleUnitMaxQuantity(stock, null);
}

function resolveDisplayUnitPrice(params: {
  product: ProductWithAttributesDto;
  selectedSaleUnit: ProductSaleUnit | null;
  selectedVariantOption: ProductVariantPickerOptionDto | null;
}): number | null {
  return (
    params.selectedSaleUnit?.price ??
    toNumberValue(
      params.selectedVariantOption?.saleUnitPrice ??
        params.selectedVariantOption?.price ??
        params.product.price,
    )
  );
}

function PurchaseQuantityControl({
  disabled,
  maxQuantity,
  onChange,
  value,
}: {
  disabled: boolean;
  maxQuantity?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  const decrementDisabled = disabled || value <= 1;
  const incrementDisabled =
    disabled || (maxQuantity !== undefined && value >= maxQuantity);

  return (
    <div className="flex h-11 items-center overflow-hidden rounded-pill border border-line-default bg-surface-base">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={decrementDisabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onChange(clampPurchaseQuantity(value - 1, maxQuantity));
        }}
        aria-label="Уменьшить количество"
        className="h-11 w-11 rounded-none"
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-12 px-3 text-center text-sm font-semibold">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={incrementDisabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onChange(clampPurchaseQuantity(value + 1, maxQuantity));
        }}
        aria-label="Увеличить количество"
        className="h-11 w-11 rounded-none"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

function SaleUnitButton({
  currency,
  disabled,
  isSelected,
  onClick,
  priceFormatMode,
  unit,
}: {
  currency: string;
  disabled: boolean;
  isSelected: boolean;
  onClick: () => void;
  priceFormatMode: ReturnType<typeof getCatalogPriceFormatMode>;
  unit: ProductSaleUnit;
}) {
  const containsText =
    getProductSaleUnitContainsText(unit) ?? "Минимальная единица";

  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "h-auto min-h-16 flex-col items-start justify-center gap-0.5 rounded-control px-3 py-2 text-left",
        isSelected && "shadow-surface",
      )}
    >
      <span className="max-w-full truncate text-xs font-normal">
        {unit.label}
      </span>
      <span className="text-sm font-semibold opacity-90">
        {formatCatalogPrice(unit.price, priceFormatMode)} {currency}
      </span>
      <span className="max-w-full truncate text-[10px] font-normal opacity-70">
        {disabled ? SOLD_OUT_LABEL : containsText}
      </span>
    </Button>
  );
}

function PurchaseSummaryCard({
  currency,
  priceFormatMode,
  productName,
  saleUnit,
  unitPrice,
  variantLabel,
}: {
  currency: string;
  priceFormatMode: ReturnType<typeof getCatalogPriceFormatMode>;
  productName: string;
  saleUnit: ProductSaleUnit | null;
  unitPrice: number | null;
  variantLabel: string | null;
}) {
  const containsText = saleUnit
    ? (getProductSaleUnitContainsText(saleUnit) ?? "Минимальная единица")
    : null;
  const title = saleUnit?.label ?? variantLabel ?? productName;

  return (
    <div className="w-full rounded-control border border-line-subtle bg-surface-base px-3 py-2 text-left shadow-control">
      <div className="max-w-full truncate text-xs font-normal">{title}</div>
      {unitPrice !== null ? (
        <div className="mt-0.5 text-sm font-semibold">
          {formatCatalogPrice(unitPrice, priceFormatMode)} {currency}
        </div>
      ) : null}
      {containsText ? (
        <div className="mt-0.5 max-w-full truncate text-[10px] text-text-muted">
          {containsText}
        </div>
      ) : variantLabel && !saleUnit ? (
        <div className="mt-0.5 max-w-full truncate text-[10px] text-text-muted">
          {productName}
        </div>
      ) : null}
    </div>
  );
}

interface CartProductVariantDrawerProps {
  canUseCatalogModifiers: boolean;
  canUseCatalogSaleUnits: boolean;
  canUseProductVariants: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  product: ProductWithAttributesDto;
}

export function CartProductVariantDrawer({
  canUseCatalogModifiers,
  canUseCatalogSaleUnits,
  canUseProductVariants,
  onOpenChange,
  open,
  product,
}: CartProductVariantDrawerProps) {
  const { isBusy, quantityByLineKey, setLineQuantity } = useCart();
  const { catalog } = useCatalogState();
  const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
  const currency = getCatalogCurrency(catalog, "RUB");
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
  const variantState = React.useMemo(
    () =>
      resolveProductCardVariantState(product, {
        canUseVariants: canUseProductVariants,
        shouldEnforceStock,
      }),
    [canUseProductVariants, product, shouldEnforceStock],
  );
  const [selectedVariantOption, setSelectedVariantOption] =
    React.useState<ProductVariantPickerOptionDto | null>(null);
  const [selectedSaleUnitId, setSelectedSaleUnitId] = React.useState<
    string | null
  >(null);
  const [isSaleUnitConfirmed, setIsSaleUnitConfirmed] = React.useState(false);
  const [isModifierConfirmed, setIsModifierConfirmed] = React.useState(false);
  const [modifierSelection, setModifierSelection] =
    React.useState<ProductModifierSelection>({});
  const [purchaseQuantity, setPurchaseQuantity] = React.useState(1);
  const productSlugForApi = React.useMemo(
    () => encodeURIComponent(product.slug),
    [product.slug],
  );
  const cardVariantItems = React.useMemo(
    () =>
      canUseProductVariants
        ? getCartProductVariantPickerItems({
            product,
            shouldEnforceStock,
          })
        : [],
    [canUseProductVariants, product, shouldEnforceStock],
  );
  const shouldLoadDetailedOptions =
    open &&
    (canUseCatalogSaleUnits ||
      (canUseProductVariants &&
        cardVariantItems.length === 0 &&
        variantState.requiresVariantSelection));
  const {
    data: detailedProduct,
    isError: isDetailedProductError,
    isFetching: isFetchingDetailedProduct,
    refetch: refetchDetailedProduct,
  } = useProductControllerGetBySlug(productSlugForApi, {
    query: {
      enabled: shouldLoadDetailedOptions,
      staleTime: 30_000,
    },
  });
  const modifiersQuery = useProductModifiers(product.id, {
    enabled: open && canUseCatalogModifiers,
  });
  const variantItems = React.useMemo(() => {
    if (cardVariantItems.length > 0) {
      return cardVariantItems;
    }

    if (!detailedProduct || !canUseProductVariants) {
      return [];
    }

    return getCartProductVariantPickerItems({
      product: detailedProduct,
      shouldEnforceStock,
    });
  }, [
    canUseProductVariants,
    cardVariantItems,
    detailedProduct,
    shouldEnforceStock,
  ]);
  const hasVariantStep =
    canUseProductVariants && variantState.requiresVariantSelection;
  const selectedVariant = React.useMemo(
    () =>
      detailedProduct
        ? (detailedProduct.variants.find(
            (variant) =>
              variant.id ===
              (selectedVariantOption?.id ?? variantState.singleVariantId),
          ) ?? null)
        : null,
    [detailedProduct, selectedVariantOption, variantState.singleVariantId],
  );
  const saleUnitSource = React.useMemo(
    () =>
      getSaleUnitSource({
        detailedProduct,
        product,
        selectedVariant,
      }),
    [detailedProduct, product, selectedVariant],
  );
  const saleUnits = React.useMemo(
    () => (canUseCatalogSaleUnits ? getProductSaleUnits(saleUnitSource) : []),
    [canUseCatalogSaleUnits, saleUnitSource],
  );
  const selectedSaleUnit = React.useMemo(() => {
    return findProductSaleUnit(saleUnits, selectedSaleUnitId);
  }, [saleUnits, selectedSaleUnitId]);
  const effectiveVariantId =
    selectedVariantOption?.id ??
    (!canUseProductVariants ? selectedSaleUnit?.variantId : null) ??
    variantState.singleVariantId ??
    product.variantSummary?.singleVariantId ??
    product.defaultVariantId ??
    null;
  const cartLineVariantId = canUseProductVariants ? effectiveVariantId : null;
  const modifierGroups = React.useMemo(
    () =>
      getApplicableProductModifierGroups({
        groups: modifiersQuery.data,
        variantId: effectiveVariantId,
      }),
    [effectiveVariantId, modifiersQuery.data],
  );
  const modifierSelectionResetKey = React.useMemo(
    () =>
      [
        product.id,
        effectiveVariantId ?? "default",
        modifierGroups
          .map(
            (group) =>
              `${group.id}:${group.options
                .map((option) => option.id)
                .join(",")}`,
          )
          .join("|"),
      ].join(":"),
    [effectiveVariantId, modifierGroups, product.id],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const defaultSelection =
      buildDefaultProductModifierSelection(modifierGroups);

    setModifierSelection(defaultSelection);
    setIsModifierConfirmed(
      !getProductModifierSelectionError(modifierGroups, defaultSelection),
    );
  }, [modifierGroups, modifierSelectionResetKey, open]);

  const selectedModifiers = React.useMemo(
    () =>
      buildCartModifierSelectionPayload({
        groups: modifierGroups,
        selection: modifierSelection,
      }),
    [modifierGroups, modifierSelection],
  );
  const modifierSelectionError = React.useMemo(
    () => getProductModifierSelectionError(modifierGroups, modifierSelection),
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
  const shouldShowVariantStep = hasVariantStep && !selectedVariantOption;
  const shouldWaitForSaleUnits =
    canUseCatalogSaleUnits &&
    !shouldShowVariantStep &&
    saleUnits.length === 0 &&
    !detailedProduct &&
    isFetchingDetailedProduct;
  const shouldShowSaleUnitStep =
    canUseCatalogSaleUnits &&
    saleUnits.length > 0 &&
    !isSaleUnitConfirmed &&
    !shouldWaitForSaleUnits;
  const shouldWaitForModifiers =
    canUseCatalogModifiers &&
    !shouldShowVariantStep &&
    !shouldShowSaleUnitStep &&
    !shouldWaitForSaleUnits &&
    modifiersQuery.isFetching &&
    modifiersQuery.data === undefined;
  const shouldShowModifierStep =
    canUseCatalogModifiers &&
    Boolean(modifierSelectionError) &&
    !isModifierConfirmed &&
    !shouldShowVariantStep &&
    !shouldShowSaleUnitStep &&
    !shouldWaitForSaleUnits &&
    !shouldWaitForModifiers;
  const step: DrawerStep = shouldShowVariantStep
    ? "variant"
    : isDetailedProductError &&
        canUseCatalogSaleUnits &&
        saleUnits.length === 0 &&
        !detailedProduct
      ? "error"
      : shouldWaitForSaleUnits
        ? "loading"
        : shouldWaitForModifiers
          ? "loading"
          : shouldShowSaleUnitStep
            ? "saleUnit"
            : shouldShowModifierStep
              ? "modifier"
              : "quantity";
  const loadingLabel = shouldWaitForModifiers
    ? LOADING_MODIFIERS_LABEL
    : LOADING_UNITS_LABEL;
  const cartSelection = React.useMemo(
    () =>
      buildCartProductSelection({
        modifiers: selectedModifiers,
        productId: product.id,
        saleUnitId:
          selectedSaleUnit?.id ?? selectedVariantOption?.saleUnitId ?? null,
        variantId: cartLineVariantId,
      }),
    [
      cartLineVariantId,
      product.id,
      selectedModifiers,
      selectedSaleUnit,
      selectedVariantOption,
    ],
  );
  const cartSelectionKey = React.useMemo(
    () => buildCartLineSelectionKey(cartSelection),
    [cartSelection],
  );
  const currentCartQuantity = quantityByLineKey[cartSelectionKey] ?? 0;
  const maxQuantity = React.useMemo(
    () =>
      resolveSelectionMaxQuantity({
        product,
        selectedSaleUnit,
        selectedVariant,
        selectedVariantOption,
        shouldEnforceStock,
      }),
    [
      product,
      selectedSaleUnit,
      selectedVariant,
      selectedVariantOption,
      shouldEnforceStock,
    ],
  );
  const purchaseMaxQuantity =
    maxQuantity === undefined
      ? undefined
      : Math.max(maxQuantity, currentCartQuantity);
  const canSubmit =
    step === "quantity" &&
    !modifierSelectionError &&
    purchaseQuantity > 0 &&
    (purchaseMaxQuantity === undefined ||
      purchaseQuantity <= purchaseMaxQuantity);
  const unitPrice = resolveDisplayUnitPrice({
    product,
    selectedSaleUnit,
    selectedVariantOption,
  });
  const unitPriceWithModifiers =
    unitPrice === null && modifierUnitTotal <= 0
      ? null
      : (unitPrice ?? 0) + modifierUnitTotal;
  const displayTotal =
    unitPriceWithModifiers === null || purchaseQuantity <= 0
      ? null
      : unitPriceWithModifiers * purchaseQuantity;
  const submitLabel =
    currentCartQuantity > 0 ? UPDATE_CART_LABEL : ADD_TO_CART_LABEL;
  const quantityHint =
    currentCartQuantity > 0 && maxQuantity !== undefined
      ? `В корзине: ${currentCartQuantity} · Максимум: ${maxQuantity}`
      : currentCartQuantity > 0
        ? `В корзине: ${currentCartQuantity}`
        : maxQuantity !== undefined
          ? `Максимум: ${maxQuantity}`
          : null;
  const variantLabel = selectedVariantOption?.label ?? null;

  React.useEffect(() => {
    if (!open) {
      setSelectedVariantOption(null);
      setSelectedSaleUnitId(null);
      setIsSaleUnitConfirmed(false);
      setIsModifierConfirmed(false);
      setModifierSelection({});
      setPurchaseQuantity(1);
    }
  }, [open, product.id]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (!findProductSaleUnit(saleUnits, selectedSaleUnitId)) {
      setSelectedSaleUnitId(null);
      setIsSaleUnitConfirmed(false);
    }
  }, [open, saleUnits, selectedSaleUnitId]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setPurchaseQuantity(
      getInitialPurchaseQuantity(currentCartQuantity, purchaseMaxQuantity),
    );
  }, [cartSelectionKey, currentCartQuantity, open, purchaseMaxQuantity]);

  const handleVariantClick = React.useCallback(
    (item: CartProductVariantPickerItem) => {
      if (!item.availability.isSelectable) {
        return;
      }

      setSelectedVariantOption(item.option);
      setSelectedSaleUnitId(null);
      setIsSaleUnitConfirmed(false);
      setIsModifierConfirmed(false);
      setPurchaseQuantity(1);
    },
    [],
  );

  const handleSaleUnitClick = React.useCallback((unit: ProductSaleUnit) => {
    setSelectedSaleUnitId(unit.id);
    setIsSaleUnitConfirmed(true);
    setIsModifierConfirmed(false);
    setPurchaseQuantity(1);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (modifierSelectionError) {
      toast.error(modifierSelectionError);
      return;
    }

    if (!canSubmit) {
      toast.error(UNIT_UNAVAILABLE_MESSAGE);
      return;
    }

    try {
      await setLineQuantity(cartSelection, purchaseQuantity, {
        id: product.id,
        name: product.name,
        price: unitPriceWithModifiers,
        slug: product.slug,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  }, [
    canSubmit,
    cartSelection,
    modifierSelectionError,
    onOpenChange,
    product,
    purchaseQuantity,
    setLineQuantity,
    unitPriceWithModifiers,
  ]);

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange}>
      <AppDrawer.Content
        className="max-h-[84dvh] pb-4"
        onClick={(event) => event.stopPropagation()}
      >
        <AppDrawer.Header
          title={getDrawerTitle(step)}
          description={null}
          titleClassName="text-lg"
        />

        <DrawerScrollArea className="px-4 pb-2">
          {step === "variant" ? (
            <div className="flex flex-wrap justify-center gap-2">
              {isFetchingDetailedProduct && !variantItems.length ? (
                <Button type="button" variant="outline" disabled>
                  {LOADING_VARIANTS_LABEL}
                </Button>
              ) : null}

              {!isFetchingDetailedProduct && !variantItems.length ? (
                <Button type="button" variant="outline" disabled>
                  {EMPTY_VARIANTS_LABEL}
                </Button>
              ) : null}

              {variantItems.map((item) => {
                const { availability, option } = item;
                const selection = buildCartProductSelection({
                  productId: product.id,
                  saleUnitId: option.saleUnitId,
                  variantId: option.id,
                });
                const quantity =
                  quantityByLineKey[buildCartLineSelectionKey(selection)] ?? 0;
                const isQuantityLimitReached =
                  shouldEnforceStock &&
                  typeof option.maxQuantity === "number" &&
                  quantity <= 0 &&
                  option.maxQuantity <= 0;
                const disabledReason = !availability.isSelectable
                  ? availability.label
                  : isQuantityLimitReached
                    ? SOLD_OUT_LABEL
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

                      if (isQuantityLimitReached) {
                        toast.error(VARIANT_LIMIT_MESSAGE);
                        return;
                      }

                      handleVariantClick(item);
                    }}
                    className="h-auto min-h-10 flex-col gap-0.5 rounded-pill px-4 py-2"
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
          ) : null}

          {step === "loading" ? (
            <div className="flex justify-center py-6 text-sm text-text-muted">
              {loadingLabel}
            </div>
          ) : null}

          {step === "error" ? (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-text-muted">
                Проверьте соединение и попробуйте еще раз.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void refetchDetailedProduct()}
              >
                {RETRY_LABEL}
              </Button>
            </div>
          ) : null}

          {step === "saleUnit" ? (
            <div className="space-y-3">
              {variantLabel ? (
                <div className="text-center text-sm text-text-muted">
                  {variantLabel}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {saleUnits.map((unit) => {
                  const unitSelection = buildCartProductSelection({
                    productId: product.id,
                    saleUnitId: unit.id,
                    variantId: canUseProductVariants
                      ? effectiveVariantId
                      : null,
                  });
                  const unitMaxQuantity = shouldEnforceStock
                    ? getSaleUnitMaxQuantity(
                        resolveSelectedVariantStock({
                          product,
                          selectedVariant,
                          selectedVariantOption,
                        }),
                        unit,
                      )
                    : undefined;
                  const unitCartQuantity =
                    quantityByLineKey[
                      buildCartLineSelectionKey(unitSelection)
                    ] ?? 0;
                  const isUnitLimitReached =
                    unitMaxQuantity !== undefined &&
                    unitCartQuantity <= 0 &&
                    unitMaxQuantity <= 0;

                  return (
                    <SaleUnitButton
                      key={unit.id}
                      currency={currency}
                      disabled={isBusy || isUnitLimitReached}
                      isSelected={selectedSaleUnit?.id === unit.id}
                      onClick={() => {
                        if (isUnitLimitReached) {
                          toast.error(UNIT_UNAVAILABLE_MESSAGE);
                          return;
                        }

                        handleSaleUnitClick(unit);
                      }}
                      priceFormatMode={priceFormatMode}
                      unit={unit}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === "modifier" ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-text-muted">
                Можно выбрать несколько штук у одной опции.
              </p>

              <ProductModifierPicker
                className="px-0 pb-0"
                currency={currency}
                disabled={isBusy}
                groups={modifierGroups}
                onChange={setModifierSelection}
                priceFormatMode={priceFormatMode}
                selection={modifierSelection}
              />

              <Button
                type="button"
                className="h-11 w-full rounded-pill"
                disabled={isBusy}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  if (modifierSelectionError) {
                    toast.error(modifierSelectionError);
                    return;
                  }

                  setIsModifierConfirmed(true);
                }}
              >
                {CONTINUE_LABEL}
              </Button>
            </div>
          ) : null}

          {step === "quantity" ? (
            <div className="space-y-4">
              <PurchaseSummaryCard
                currency={currency}
                priceFormatMode={priceFormatMode}
                productName={product.name}
                saleUnit={selectedSaleUnit}
                unitPrice={unitPriceWithModifiers}
                variantLabel={variantLabel}
              />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Количество</div>
                  {quantityHint ? (
                    <div className="text-xs text-text-muted">
                      {quantityHint}
                    </div>
                  ) : null}
                </div>
                <PurchaseQuantityControl
                  disabled={isBusy || purchaseMaxQuantity === 0}
                  maxQuantity={purchaseMaxQuantity}
                  onChange={setPurchaseQuantity}
                  value={purchaseQuantity}
                />
              </div>

              <Button
                type="button"
                className="h-11 w-full rounded-pill"
                disabled={isBusy || !canSubmit}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleSubmit();
                }}
              >
                {displayTotal === null
                  ? submitLabel
                  : `${submitLabel} · ${formatCatalogPrice(
                      displayTotal,
                      priceFormatMode,
                    )} ${currency}`}
              </Button>
            </div>
          ) : null}
        </DrawerScrollArea>
      </AppDrawer.Content>
    </AppDrawer>
  );
}
