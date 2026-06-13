"use client";

import {
  useCatalogPriceLists,
  type CatalogPriceList,
} from "@/core/modules/catalog-price-list";
import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { ChevronRight, Loader2 } from "lucide-react";
import React from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

interface EditCatalogPriceListsDrawerProps {
  disabled?: boolean;
  form: UseFormReturn<CatalogEditFormValues>;
}

const EMPTY_PRICE_LISTS_LABEL = "Активных прайс-листов пока нет.";

function sortPriceLists(priceLists: CatalogPriceList[]): CatalogPriceList[] {
  return priceLists.slice().sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.name.localeCompare(right.name, "ru");
  });
}

function getSelectedLabel(
  selectedValue: string | null | undefined,
  priceLists: CatalogPriceList[],
): string {
  if (!selectedValue) {
    return "Прайс-лист не выбран";
  }

  return (
    priceLists.find((priceList) => priceList.id === selectedValue)?.name ??
    "Выбранный прайс"
  );
}

export const EditCatalogPriceListsDrawer: React.FC<
  EditCatalogPriceListsDrawerProps
> = ({ disabled = false, form }) => {
  const { catalog } = useCatalogState();
  const isChildCatalog = Boolean(catalog?.parentId);
  const [open, setOpen] = React.useState(false);
  const activePriceListId = useWatch({
    control: form.control,
    name: "activePriceListId",
  });
  const selectedValue = activePriceListId ?? "";
  const priceListsQuery = useCatalogPriceLists(
    { includeInactive: !isChildCatalog },
    { enabled: !disabled },
  );
  const priceLists = React.useMemo(
    () => sortPriceLists(priceListsQuery.data ?? []),
    [priceListsQuery.data],
  );
  const selectablePriceLists = React.useMemo(() => {
    const active = priceLists.filter((priceList) => priceList.isActive);
    const selected = activePriceListId
      ? priceLists.find((priceList) => priceList.id === activePriceListId)
      : null;

    if (!selected || active.some((priceList) => priceList.id === selected.id)) {
      return active;
    }

    return [selected, ...active];
  }, [activePriceListId, priceLists]);
  const selectedLabel = getSelectedLabel(selectedValue, selectablePriceLists);

  const handleValueChange = React.useCallback(
    (value: string) => {
      form.setValue(
        "activePriceListId",
        value,
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        },
      );
      setOpen(false);
    },
    [form],
  );

  const selector = (
    <AppDrawer
      nested
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          className="h-12 min-w-0 flex-1 justify-between rounded-2xl border border-black/10 px-4 text-left hover:bg-muted/30"
        >
          <span className="min-w-0 truncate text-sm font-medium">
            {selectedLabel}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="z-[70] w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Прайс-листы"
            description={
              isChildCatalog
                ? "Выберите прайс родительского каталога для этой витрины."
                : "Выберите прайс, по которому будет работать родительский каталог."
            }
            withCloseButton
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            {priceListsQuery.isLoading ? (
              <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Загрузка...
              </div>
            ) : (
              <RadioGroup
                value={selectedValue}
                onValueChange={handleValueChange}
                disabled={disabled}
                className="gap-2"
              >
                {selectablePriceLists.map((priceList) => (
                  <label
                    key={priceList.id}
                    htmlFor={`catalog-active-price-list-${priceList.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3 transition-colors",
                      selectedValue === priceList.id && "bg-muted/50",
                    )}
                  >
                    <RadioGroupItem
                      id={`catalog-active-price-list-${priceList.id}`}
                      value={priceList.id}
                      disabled={!priceList.isActive}
                      className="mt-0.5"
                    />
                    <span className="grid min-w-0 gap-1">
                      <span className="truncate text-sm font-medium">
                        {priceList.name}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            )}

            {!priceListsQuery.isLoading && selectablePriceLists.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 p-3 text-sm text-muted-foreground">
                {EMPTY_PRICE_LISTS_LABEL}
              </div>
            ) : null}
          </DrawerScrollArea>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      {selector}
    </div>
  );
};
