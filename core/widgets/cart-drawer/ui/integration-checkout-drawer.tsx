"use client";

import type { PrepareShareOrderInput } from "@/core/modules/cart";
import { updateCheckoutData } from "@/core/widgets/cart-drawer/model/cart-checkout-data";
import {
  buildIntegrationCheckoutOrderInput,
  DEFAULT_INTEGRATION_CHECKOUT_METHOD,
  validateIntegrationCheckout,
  type IntegrationCheckoutField,
} from "@/core/widgets/cart-drawer/model/integration-checkout";
import { CartDrawerFooterSummary } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer-summary";
import {
  CHECKOUT_METHOD_LABELS,
  type CheckoutData,
  type CheckoutLocation,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PhoneInput } from "@/shared/ui/phone-input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import React from "react";
import { toast } from "sonner";

interface IntegrationCheckoutDrawerProps {
  availableMethods: CheckoutMethod[];
  checkoutLocation: CheckoutLocation;
  currency: string;
  disabled?: boolean;
  fields: IntegrationCheckoutField[];
  hasDiscount: boolean;
  isBusy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input?: PrepareShareOrderInput) => Promise<void>;
  open: boolean;
  orderInput: PrepareShareOrderInput;
  price: number;
  priceFormatMode: CatalogPriceFormatMode;
  totalPrice: number;
}

function getInitialMethod(params: {
  availableMethods: CheckoutMethod[];
  orderInput: PrepareShareOrderInput;
}): CheckoutMethod {
  return (
    params.orderInput.checkoutMethod ??
    params.availableMethods[0] ??
    DEFAULT_INTEGRATION_CHECKOUT_METHOD
  );
}

function getSelectableMethods(methods: CheckoutMethod[]): CheckoutMethod[] {
  return methods.length > 0 ? methods : [DEFAULT_INTEGRATION_CHECKOUT_METHOD];
}

function hasField(
  fields: IntegrationCheckoutField[],
  field: IntegrationCheckoutField,
): boolean {
  return fields.includes(field);
}

function getHallTableLabel(data: CheckoutData): string {
  if (data.hallTableName ?? data.tableName) {
    return data.hallTableName ?? data.tableName ?? "Стол";
  }

  const tableNumber = data.hallTableNumber ?? data.tableNumber ?? data.table;
  if (tableNumber) return `Стол ${tableNumber}`;
  return "Стол";
}

export const IntegrationCheckoutDrawer: React.FC<
  IntegrationCheckoutDrawerProps
> = ({
  availableMethods,
  checkoutLocation,
  currency,
  disabled = false,
  fields,
  hasDiscount,
  isBusy = false,
  onOpenChange,
  onSubmit,
  open,
  orderInput,
  price,
  priceFormatMode,
  totalPrice,
}) => {
  const selectableMethods = React.useMemo(
    () => getSelectableMethods(availableMethods),
    [availableMethods],
  );
  const [draftMethod, setDraftMethod] = React.useState<CheckoutMethod>(
    getInitialMethod({ availableMethods: selectableMethods, orderInput }),
  );
  const [draftData, setDraftData] = React.useState<CheckoutData>(
    orderInput.checkoutData ?? {},
  );
  const mergedData = React.useMemo(
    () => ({
      ...(orderInput.checkoutData ?? {}),
      ...draftData,
    }),
    [draftData, orderInput.checkoutData],
  );
  const validationError = validateIntegrationCheckout({
    data: mergedData,
    fields,
    method: draftMethod,
  });
  const shouldShowMethod = hasField(fields, "checkoutMethod");
  const shouldShowHallTable = hasField(fields, "hallTable");
  const shouldShowPersonsCount = hasField(fields, "personsCount");
  const shouldShowAddress =
    draftMethod === "DELIVERY" && hasField(fields, "address");
  const hallTableLabel = getHallTableLabel(mergedData);
  const isHallOrder = Boolean(
    mergedData.orderMode === "HALL" ||
      mergedData.iikoTableId ||
      mergedData.hallTableId ||
      mergedData.integrationExternalItemCode ||
      mergedData.hallTableCode ||
      mergedData.tableCode ||
      mergedData.t,
  );
  const isSubmitDisabled = disabled || isBusy || Boolean(validationError);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraftMethod(
      getInitialMethod({ availableMethods: selectableMethods, orderInput }),
    );
    setDraftData(orderInput.checkoutData ?? {});
  }, [open, orderInput, selectableMethods]);

  const updateDraftData = React.useCallback(
    (key: keyof CheckoutData, value: string) => {
      setDraftData((current) => updateCheckoutData(current, key, value));
    },
    [],
  );

  const handleSubmit = React.useCallback(async () => {
    const error = validateIntegrationCheckout({
      data: mergedData,
      fields,
      method: draftMethod,
    });

    if (error) {
      toast.error(error);
      return;
    }

    await onSubmit(
      buildIntegrationCheckoutOrderInput({
        baseInput: orderInput,
        data: draftData,
        location: checkoutLocation,
        method: draftMethod,
      }),
    );
  }, [
    checkoutLocation,
    draftData,
    draftMethod,
    fields,
    mergedData,
    onSubmit,
    orderInput,
  ]);

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange}>
      <AppDrawer.Content className="max-h-[92dvh]">
        <AppDrawer.Header title="Данные для iiko" description={null} />

        <DrawerScrollArea>
          <div className="space-y-5 px-4 pb-4">
            {isHallOrder ? (
              <section className="rounded-lg border border-black/10 bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Заказ в зале
                </p>
                <p className="mt-1 text-base font-semibold">
                  {hallTableLabel}
                </p>
                {mergedData.iikoRestaurantSectionName ||
                mergedData.hallSectionName ? (
                  <p className="text-sm text-muted-foreground">
                    {mergedData.iikoRestaurantSectionName ??
                      mergedData.hallSectionName}
                  </p>
                ) : null}
              </section>
            ) : null}

            {hasField(fields, "customerName") || hasField(fields, "phone") ? (
              <section className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {hasField(fields, "customerName") ? (
                    <div className="space-y-2">
                      <Label htmlFor="integration-checkout-customer-name">
                        Имя
                      </Label>
                      <Input
                        id="integration-checkout-customer-name"
                        value={draftData.customerName ?? ""}
                        onChange={(event) =>
                          updateDraftData("customerName", event.target.value)
                        }
                        disabled={disabled}
                        placeholder="Иван"
                        className="border border-black/10"
                      />
                    </div>
                  ) : null}

                  {hasField(fields, "phone") ? (
                    <div className="space-y-2">
                      <Label htmlFor="integration-checkout-phone">
                        Телефон
                      </Label>
                      <PhoneInput
                        id="integration-checkout-phone"
                        value={draftData.phone ?? ""}
                        onValueChange={(value) =>
                          updateDraftData("phone", value)
                        }
                        disabled={disabled}
                        placeholder="+7 999 000-00-00"
                        className="border border-black/10"
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {shouldShowHallTable ? (
              <section className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
                Откройте каталог по QR-коду конкретного стола. Для iiko нужен
                UUID стола, поэтому обычной ссылки режима зала недостаточно.
              </section>
            ) : null}

            {shouldShowPersonsCount ? (
              <section className="space-y-2">
                <Label htmlFor="integration-checkout-persons-count">
                  Количество гостей
                </Label>
                <Input
                  id="integration-checkout-persons-count"
                  type="number"
                  min={1}
                  max={999}
                  inputMode="numeric"
                  value={draftData.personsCount ?? draftData.guestsCount ?? ""}
                  onChange={(event) =>
                    updateDraftData("personsCount", event.target.value)
                  }
                  disabled={disabled}
                  placeholder="2"
                  className="border border-black/10"
                />
              </section>
            ) : null}

            {shouldShowMethod ? (
              <section className="space-y-3 rounded-lg border border-black/10 p-3">
                <h3 className="text-base font-semibold">Способ заказа</h3>
                <Tabs
                  value={draftMethod}
                  onValueChange={(value) =>
                    setDraftMethod(value as CheckoutMethod)
                  }
                >
                  <TabsList
                    className="grid h-auto w-full"
                    style={{
                      gridTemplateColumns: `repeat(${selectableMethods.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {selectableMethods.map((method) => (
                      <TabsTrigger
                        key={method}
                        value={method}
                        disabled={disabled}
                        className="px-2 text-sm"
                      >
                        {CHECKOUT_METHOD_LABELS[method]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </section>
            ) : null}

            {shouldShowAddress ? (
              <section className="space-y-2">
                <Label htmlFor="integration-checkout-address">
                  Адрес доставки
                </Label>
                <Input
                  id="integration-checkout-address"
                  value={draftData.address ?? ""}
                  onChange={(event) =>
                    updateDraftData("address", event.target.value)
                  }
                  disabled={disabled}
                  placeholder="Москва, Тверская, 1"
                  className="border border-black/10"
                />
              </section>
            ) : null}
          </div>
        </DrawerScrollArea>

        <AppDrawer.Footer className="border-t">
          <div className="grid gap-3 sm:grid-cols-[minmax(110px,auto)_minmax(0,1fr)] sm:items-center">
            <CartDrawerFooterSummary
              currency={currency}
              hasDiscount={hasDiscount}
              price={price}
              priceFormatMode={priceFormatMode}
              totalPrice={totalPrice}
            />
            <Button
              type="button"
              className="w-full justify-center"
              disabled={isSubmitDisabled}
              onClick={() => void handleSubmit()}
              size="full"
            >
              Подтвердить заказ
            </Button>
          </div>
        </AppDrawer.Footer>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
