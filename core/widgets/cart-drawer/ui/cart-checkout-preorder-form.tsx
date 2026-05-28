"use client";

import { updateCheckoutData } from "@/core/widgets/cart-drawer/model/cart-checkout-data";
import { CartCheckoutLocationDisplay } from "@/core/widgets/cart-drawer/ui/cart-checkout-location-display";
import type {
  CheckoutData,
  CheckoutLocation,
  CheckoutPreorderSettings,
} from "@/shared/lib/checkout-methods";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import React from "react";

interface CartCheckoutPreorderFormProps {
  data: CheckoutData;
  disabled: boolean;
  location: CheckoutLocation;
  onChange: (data: CheckoutData) => void;
  preorder: CheckoutPreorderSettings;
}

export const CartCheckoutPreorderForm: React.FC<
  CartCheckoutPreorderFormProps
> = ({ data, disabled, location, onChange, preorder }) => {
  const today = getTodayDateInput();
  const maxDate = getMaxDateInput(preorder.maxAdvanceDays);

  return (
    <>
      <CartCheckoutLocationDisplay location={location} />

      <div className="space-y-2">
        <Label htmlFor="cart-checkout-preorder-persons">
          Укажите количество гостей
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cart-checkout-preorder-date">Дата визита</Label>
          <Input
            id="cart-checkout-preorder-date"
            type="date"
            min={today}
            max={maxDate}
            value={data.visitDate ?? ""}
            onChange={(event) =>
              onChange(updateCheckoutData(data, "visitDate", event.target.value))
            }
            disabled={disabled}
            className="border border-black/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cart-checkout-preorder-time">Время визита</Label>
          <Input
            id="cart-checkout-preorder-time"
            type="time"
            value={data.visitTime ?? ""}
            onChange={(event) =>
              onChange(updateCheckoutData(data, "visitTime", event.target.value))
            }
            disabled={disabled}
            className="border border-black/10"
          />
        </div>
      </div>
    </>
  );
};

function getTodayDateInput(): string {
  return formatDateInput(new Date());
}

function getMaxDateInput(maxAdvanceDays: number): string {
  const now = new Date();
  now.setDate(now.getDate() + maxAdvanceDays);
  return formatDateInput(now);
}

function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}
