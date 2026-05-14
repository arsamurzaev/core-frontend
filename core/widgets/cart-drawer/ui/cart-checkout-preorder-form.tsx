"use client";

import {
  formatTimeTextInput,
  updateCheckoutData,
} from "@/core/widgets/cart-drawer/model/cart-checkout-data";
import { CartCheckoutLocationDisplay } from "@/core/widgets/cart-drawer/ui/cart-checkout-location-display";
import type {
  CheckoutData,
  CheckoutLocation,
} from "@/shared/lib/checkout-methods";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import React from "react";

interface CartCheckoutPreorderFormProps {
  data: CheckoutData;
  disabled: boolean;
  location: CheckoutLocation;
  onChange: (data: CheckoutData) => void;
}

export const CartCheckoutPreorderForm: React.FC<
  CartCheckoutPreorderFormProps
> = ({ data, disabled, location, onChange }) => {
  return (
    <>
      <CartCheckoutLocationDisplay location={location} />

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
    </>
  );
};
