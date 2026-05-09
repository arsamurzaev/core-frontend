"use client";

import {
  CHECKOUT_METHOD_LABELS,
  buildCheckoutSummary,
  type CheckoutConfig,
  type CheckoutData,
  type CheckoutLocation,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { MapPin } from "lucide-react";
import React from "react";

type CartCheckoutTabsProps = {
  config: CheckoutConfig;
  data: CheckoutData;
  disabled?: boolean;
  error?: string | null;
  location: CheckoutLocation;
  locked?: boolean;
  method: CheckoutMethod;
  onChange: (method: CheckoutMethod, data: CheckoutData) => void;
};

function updateCheckoutData(
  data: CheckoutData,
  key: keyof CheckoutData,
  value: string,
): CheckoutData {
  if (key === "personsCount") {
    const numeric = value.trim() ? Number(value) : undefined;
    return { ...data, personsCount: numeric };
  }

  return { ...data, [key]: value };
}

function formatTimeTextInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function CheckoutLocationDisplay({ location }: { location: CheckoutLocation }) {
  if (location.address && location.mapUrl) {
    return (
      <a
        href={location.mapUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <MapPin className="size-4 shrink-0" />
        <span className="min-w-0 break-words">{location.address}</span>
      </a>
    );
  }

  if (location.address) {
    return (
      <p className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0" />
        <span className="min-w-0 break-words">{location.address}</span>
      </p>
    );
  }

  if (location.mapUrl) {
    return (
      <a
        href={location.mapUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Открыть карту"
        className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 text-primary hover:bg-muted"
      >
        <MapPin className="size-5" />
      </a>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Адрес заведения не указан.
    </p>
  );
}

export const CartCheckoutTabs: React.FC<CartCheckoutTabsProps> = ({
  config,
  data,
  disabled = false,
  error,
  location,
  locked = false,
  method,
  onChange,
}) => {
  if (locked) {
    const lines = buildCheckoutSummary({ data, method });
    return (
      <section className="space-y-2 rounded-lg border border-black/10 p-3">
        <h3 className="text-base font-semibold">Способ заказа</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-black/10 p-3">
      <h3 className="text-base font-semibold">Способ заказа</h3>
      <Tabs
        value={method}
        onValueChange={(value) => {
          const nextMethod = value as CheckoutMethod;
          onChange(nextMethod, data);
        }}
      >
        <TabsList
          className="grid h-auto w-full"
          style={{
            gridTemplateColumns: `repeat(${config.enabledMethods.length}, minmax(0, 1fr))`,
          }}
        >
          {config.enabledMethods.map((item) => (
            <TabsTrigger
              key={item}
              value={item}
              disabled={disabled}
              className="px-2 text-sm"
            >
              {CHECKOUT_METHOD_LABELS[item]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="DELIVERY" className="pt-3">
          <div className="space-y-2">
            <Label htmlFor="cart-checkout-delivery-address">
              Укажите адрес доставки
            </Label>
            <Input
              id="cart-checkout-delivery-address"
              value={data.address ?? ""}
              onChange={(event) =>
                onChange(
                  "DELIVERY",
                  updateCheckoutData(data, "address", event.target.value),
                )
              }
              disabled={disabled}
              placeholder="Город, улица 1"
              className="border border-black/10"
            />
          </div>
        </TabsContent>

        <TabsContent value="PICKUP" className="pt-3">
          <CheckoutLocationDisplay location={location} />
        </TabsContent>

        <TabsContent value="PREORDER" className="space-y-3 pt-3">
          <CheckoutLocationDisplay location={location} />

          <div className="space-y-2">
            <Label htmlFor="cart-checkout-preorder-persons">
              Укажите кол-во гостей
            </Label>
            <Input
              id="cart-checkout-preorder-persons"
              type="number"
              min={1}
              value={data.personsCount ?? ""}
              onChange={(event) =>
                onChange(
                  "PREORDER",
                  updateCheckoutData(data, "personsCount", event.target.value),
                )
              }
              disabled={disabled}
              placeholder="4"
              className="border border-black/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cart-checkout-preorder-time">
              Укажите время посещения
            </Label>
            <Input
              id="cart-checkout-preorder-time"
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={data.visitTime ?? ""}
              onChange={(event) =>
                onChange(
                  "PREORDER",
                  updateCheckoutData(
                    data,
                    "visitTime",
                    formatTimeTextInput(event.target.value),
                  ),
                )
              }
              disabled={disabled}
              placeholder="16:00"
              className="border border-black/10"
            />
          </div>
        </TabsContent>
      </Tabs>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
};
