"use client";

import { updateCheckoutData } from "@/core/widgets/cart-drawer/model/cart-checkout-data";
import type { CheckoutData } from "@/shared/lib/checkout-methods";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import React from "react";

interface CartCheckoutDeliveryFormProps {
  data: CheckoutData;
  disabled: boolean;
  onChange: (data: CheckoutData) => void;
}

export const CartCheckoutDeliveryForm: React.FC<
  CartCheckoutDeliveryFormProps
> = ({ data, disabled, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="cart-checkout-delivery-address">
        Укажите адрес доставки
      </Label>
      <Input
        id="cart-checkout-delivery-address"
        value={data.address ?? ""}
        onChange={(event) =>
          onChange(updateCheckoutData(data, "address", event.target.value))
        }
        disabled={disabled}
        placeholder="Город, улица 1"
        className="border border-black/10"
      />
    </div>
  );
};
