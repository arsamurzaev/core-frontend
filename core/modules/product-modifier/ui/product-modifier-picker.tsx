"use client";

import {
  getProductModifierGroupSelectedQuantity,
  getProductModifierOptionQuantity,
  setProductModifierOptionQuantity,
} from "@/core/modules/product-modifier/model/product-modifier-selection";
import type {
  ProductModifierGroup,
  ProductModifierOption,
  ProductModifierSelection,
} from "@/core/modules/product-modifier/model/product-modifier-types";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Minus, Plus, X } from "lucide-react";
import React from "react";

interface ProductModifierPickerProps {
  className?: string;
  currency: string;
  disabled?: boolean;
  groups: ProductModifierGroup[];
  onChange: (selection: ProductModifierSelection) => void;
  priceFormatMode: CatalogPriceFormatMode;
  selection: ProductModifierSelection;
  variant?: "list" | "chips";
}

function getGroupLimitText(group: ProductModifierGroup): string | null {
  const minSelected = group.isRequired
    ? Math.max(1, group.minSelected)
    : 0;

  if (minSelected > 0 && group.maxSelected !== null) {
    return `${minSelected}-${group.maxSelected}`;
  }

  if (minSelected > 0) {
    return `от ${minSelected}`;
  }

  if (group.maxSelected !== null) {
    return `до ${group.maxSelected}`;
  }

  return null;
}

function getOptionLimit(
  group: ProductModifierGroup,
  option: ProductModifierOption,
  selection: ProductModifierSelection,
): number | null {
  const optionLimit = option.maxQuantity ?? null;
  if (group.maxSelected === null) {
    return optionLimit;
  }

  const optionQuantity = getProductModifierOptionQuantity(selection, option.id);
  const selectedQuantity = getProductModifierGroupSelectedQuantity(
    group,
    selection,
  );
  const groupRemaining = Math.max(0, group.maxSelected - selectedQuantity);
  const groupLimit = optionQuantity + groupRemaining;

  return optionLimit === null ? groupLimit : Math.min(optionLimit, groupLimit);
}

function getOptionPriceLabel(
  option: ProductModifierOption,
  priceFormatMode: CatalogPriceFormatMode,
  currency: string,
): string {
  const price = Number(option.price);

  return Number.isFinite(price) && price > 0
    ? `+${formatCatalogPrice(price, priceFormatMode)} ${currency}`
    : "Включено";
}

function shouldKeepRequiredSingleSelection(
  group: ProductModifierGroup,
  quantity: number,
): boolean {
  const minSelected = group.isRequired
    ? Math.max(1, group.minSelected)
    : 0;

  return group.maxSelected === 1 && minSelected > 0 && quantity > 0;
}

function ProductModifierOptionRow({
  currency,
  disabled,
  group,
  groups,
  onChange,
  option,
  priceFormatMode,
  quantity,
  selection,
}: {
  currency: string;
  disabled: boolean;
  group: ProductModifierGroup;
  groups: ProductModifierGroup[];
  onChange: (selection: ProductModifierSelection) => void;
  option: ProductModifierOption;
  priceFormatMode: CatalogPriceFormatMode;
  quantity: number;
  selection: ProductModifierSelection;
}) {
  const optionLimit = getOptionLimit(group, option, selection);
  const isSelected = quantity > 0;
  const canIncrement =
    !disabled && (optionLimit === null || quantity < optionLimit);
  const canDecrement =
    !disabled &&
    quantity > 0 &&
    !shouldKeepRequiredSingleSelection(group, quantity);
  const priceLabel = getOptionPriceLabel(option, priceFormatMode, currency);

  const setQuantity = React.useCallback(
    (nextQuantity: number) => {
      onChange(
        setProductModifierOptionQuantity({
          groups,
          groupId: group.id,
          optionId: option.id,
          quantity: nextQuantity,
          selection,
        }),
      );
    },
    [group.id, groups, onChange, option.id, selection],
  );

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setQuantity(
      quantity > 0 && !shouldKeepRequiredSingleSelection(group, quantity)
        ? 0
        : 1,
    );
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
        }
      }}
      className={cn(
        "flex min-h-14 cursor-pointer items-center gap-3 rounded-control border px-3 py-2 transition-colors",
        isSelected
          ? "border-action-primary bg-action-primary/5"
          : "border-line-subtle bg-surface-base hover:bg-surface-muted/30",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-pill border text-[11px] font-semibold",
          isSelected
            ? "border-action-primary bg-action-primary text-action-primary-foreground"
            : "border-text-muted/40",
        )}
      >
        {isSelected ? quantity : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {option.name}
        </span>
        <span className="block text-xs text-text-muted">
          {priceLabel}
        </span>
      </span>

      {group.maxSelected !== 1 || (option.maxQuantity ?? 1) > 1 ? (
        <span className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8 rounded-pill"
            disabled={!canDecrement}
            aria-label="Уменьшить"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuantity(quantity - 1);
            }}
          >
            <Minus className="size-3" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8 rounded-pill"
            disabled={!canIncrement}
            aria-label="Увеличить"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuantity(quantity + 1);
            }}
          >
            <Plus className="size-3" />
          </Button>
        </span>
      ) : null}
    </div>
  );
}

function ProductModifierOptionChip({
  activeOptionId,
  currency,
  disabled,
  group,
  groups,
  onChange,
  option,
  priceFormatMode,
  quantity,
  selection,
  setActiveOptionId,
}: {
  activeOptionId: string | null;
  currency: string;
  disabled: boolean;
  group: ProductModifierGroup;
  groups: ProductModifierGroup[];
  onChange: (selection: ProductModifierSelection) => void;
  option: ProductModifierOption;
  priceFormatMode: CatalogPriceFormatMode;
  quantity: number;
  selection: ProductModifierSelection;
  setActiveOptionId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const optionLimit = getOptionLimit(group, option, selection);
  const isSelected = quantity > 0;
  const isActive = activeOptionId === option.id;
  const canIncrement =
    !disabled && (optionLimit === null || quantity < optionLimit);
  const canDecrement =
    !disabled &&
    quantity > 0 &&
    !shouldKeepRequiredSingleSelection(group, quantity);
  const priceLabel = getOptionPriceLabel(option, priceFormatMode, currency);

  const setQuantity = React.useCallback(
    (nextQuantity: number) => {
      onChange(
        setProductModifierOptionQuantity({
          groups,
          groupId: group.id,
          optionId: option.id,
          quantity: nextQuantity,
          selection,
        }),
      );
    },
    [group.id, groups, onChange, option.id, selection],
  );

  const handleActivate = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setActiveOptionId(option.id);

    if (quantity <= 0) {
      setQuantity(1);
    }
  }, [disabled, option.id, quantity, setActiveOptionId, setQuantity]);

  const handleClear = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!canDecrement) {
        return;
      }

      setActiveOptionId((current) => (current === option.id ? null : current));
      setQuantity(0);
    },
    [canDecrement, option.id, setActiveOptionId, setQuantity],
  );

  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
        return;
      }

      setActiveOptionId((current) => (current === option.id ? null : current));
    },
    [option.id, setActiveOptionId],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      handleActivate();
    },
    [handleActivate],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      onBlur={handleBlur}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={cn(
        "group inline-flex min-h-12 max-w-full cursor-pointer items-center gap-2 rounded-pill border px-3 py-1.5 text-left shadow-control transition-all duration-150",
        isSelected
          ? "border-action-primary/80 bg-surface-base text-text-primary"
          : "border-line-subtle bg-surface-base text-text-primary/85 hover:border-line-default hover:bg-surface-muted/30",
        isActive && "border-action-primary bg-surface-base shadow-surface",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span className="min-w-0 max-w-[10.5rem] py-0.5">
        <span className="block truncate text-[13px] font-semibold leading-4">
          {option.name}
        </span>
        <span className="block truncate text-[11px] leading-3 text-text-muted">
          {priceLabel}
        </span>
      </span>

      {isSelected && isActive ? (
        <span className="flex shrink-0 items-center gap-1 rounded-pill bg-surface-muted p-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7 rounded-pill text-text-primary hover:bg-surface-base"
            disabled={!canDecrement}
            aria-label="Уменьшить"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuantity(quantity - 1);
            }}
          >
            <Minus className="size-3" />
          </Button>
          <span className="flex size-6 items-center justify-center rounded-pill bg-action-primary text-xs font-bold text-action-primary-foreground tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7 rounded-pill text-text-primary hover:bg-surface-base"
            disabled={!canIncrement}
            aria-label="Увеличить"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuantity(quantity + 1);
            }}
          >
            <Plus className="size-3" />
          </Button>
        </span>
      ) : null}

      {isSelected && !isActive ? (
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-pill bg-action-primary text-xs font-bold text-action-primary-foreground tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6 rounded-pill text-text-muted hover:bg-surface-muted hover:text-text-primary"
            disabled={!canDecrement}
            aria-label="Убрать"
            onClick={handleClear}
          >
            <X className="size-3.5" />
          </Button>
        </span>
      ) : null}
    </div>
  );
}

export function ProductModifierPicker({
  className,
  currency,
  disabled = false,
  groups,
  onChange,
  priceFormatMode,
  selection,
  variant = "list",
}: ProductModifierPickerProps) {
  const [activeOptionId, setActiveOptionId] = React.useState<string | null>(
    null,
  );
  const availableOptionIds = React.useMemo(
    () =>
      new Set(
        groups.flatMap((group) => group.options.map((option) => option.id)),
      ),
    [groups],
  );

  React.useEffect(() => {
    setActiveOptionId((current) =>
      current && availableOptionIds.has(current) ? current : null,
    );
  }, [availableOptionIds]);

  if (!groups.length) {
    return null;
  }

  return (
    <div className={cn("space-y-4 px-4 pb-4", className)}>
      {groups.map((group) => {
        const limitText = getGroupLimitText(group);
        const selectedQuantity = getProductModifierGroupSelectedQuantity(
          group,
          selection,
        );

        return (
          <section key={group.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div
                className={cn(
                  "min-w-0 font-medium text-text-muted",
                  variant === "chips" ? "text-xs" : "text-sm",
                )}
              >
                {group.name}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {limitText ? (
                  <Badge variant="secondary">{limitText}</Badge>
                ) : null}
                {selectedQuantity > 0 && variant !== "chips" ? (
                  <Badge variant="outline">{selectedQuantity}</Badge>
                ) : null}
              </div>
            </div>

            <div
              className={variant === "chips" ? "flex flex-wrap gap-2" : "grid gap-2"}
            >
              {group.options.map((option) =>
                variant === "chips" ? (
                  <ProductModifierOptionChip
                    key={option.id}
                    activeOptionId={activeOptionId}
                    currency={currency}
                    disabled={disabled}
                    group={group}
                    groups={groups}
                    onChange={onChange}
                    option={option}
                    priceFormatMode={priceFormatMode}
                    quantity={getProductModifierOptionQuantity(
                      selection,
                      option.id,
                    )}
                    selection={selection}
                    setActiveOptionId={setActiveOptionId}
                  />
                ) : (
                  <ProductModifierOptionRow
                    key={option.id}
                    currency={currency}
                    disabled={disabled}
                    group={group}
                    groups={groups}
                    onChange={onChange}
                    option={option}
                    priceFormatMode={priceFormatMode}
                    quantity={getProductModifierOptionQuantity(
                      selection,
                      option.id,
                    )}
                    selection={selection}
                  />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
