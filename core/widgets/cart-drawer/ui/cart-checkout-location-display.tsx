"use client";

import type { CheckoutLocation } from "@/shared/lib/checkout-methods";
import { MapPin } from "lucide-react";
import React from "react";

interface CartCheckoutLocationDisplayProps {
  location: CheckoutLocation;
}

const LOCATION_PIN_CLASS_NAME = "mt-0.5 size-4 shrink-0 text-red-800";
const LOCATION_ADDRESS_CLASS_NAME = "min-w-0 whitespace-pre-wrap break-words";

export const CartCheckoutLocationDisplay: React.FC<
  CartCheckoutLocationDisplayProps
> = ({ location }) => {
  if (location.address && location.mapUrl) {
    return (
      <a
        href={location.mapUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-w-0 items-start gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <MapPin className={LOCATION_PIN_CLASS_NAME} />
        <span className={LOCATION_ADDRESS_CLASS_NAME}>{location.address}</span>
      </a>
    );
  }

  if (location.address) {
    return (
      <p className="inline-flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
        <MapPin className={LOCATION_PIN_CLASS_NAME} />
        <span className={LOCATION_ADDRESS_CLASS_NAME}>{location.address}</span>
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
        <MapPin className="size-5 text-red-800" />
      </a>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">Адрес заведения не указан.</p>
  );
};
