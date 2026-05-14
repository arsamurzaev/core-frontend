"use client";

import { CartCheckoutDeliveryForm } from "@/core/widgets/cart-drawer/ui/cart-checkout-delivery-form";
import { CartCheckoutLocationDisplay } from "@/core/widgets/cart-drawer/ui/cart-checkout-location-display";
import { CartCheckoutLockedSummary } from "@/core/widgets/cart-drawer/ui/cart-checkout-locked-summary";
import { CartCheckoutPreorderForm } from "@/core/widgets/cart-drawer/ui/cart-checkout-preorder-form";
import {
  CHECKOUT_METHOD_LABELS,
  type CheckoutConfig,
  type CheckoutData,
  type CheckoutLocation,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import React from "react";

type CartCheckoutTabsProps = {
  config: CheckoutConfig;
  data: CheckoutData;
  disabled?: boolean;
  error?: string | null;
  location: CheckoutLocation;
  locked?: boolean;
  method: CheckoutMethod | null;
  onChange: (method: CheckoutMethod, data: CheckoutData) => void;
};

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
  if (!method) {
    return null;
  }

  if (locked) {
    return <CartCheckoutLockedSummary data={data} method={method} />;
  }

  if (config.enabledMethods.length === 0) {
    return null;
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
          <CartCheckoutDeliveryForm
            data={data}
            disabled={disabled}
            onChange={(nextData) => onChange("DELIVERY", nextData)}
          />
        </TabsContent>

        <TabsContent value="PICKUP" className="pt-3">
          <CartCheckoutLocationDisplay location={location} />
        </TabsContent>

        <TabsContent value="PREORDER" className="space-y-3 pt-3">
          <CartCheckoutPreorderForm
            data={data}
            disabled={disabled}
            location={location}
            onChange={(nextData) => onChange("PREORDER", nextData)}
          />
        </TabsContent>
      </Tabs>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
};
