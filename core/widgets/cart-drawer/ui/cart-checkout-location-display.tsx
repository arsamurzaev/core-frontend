"use client";

import type { CheckoutLocation } from "@/shared/lib/checkout-methods";
import { MapPin } from "lucide-react";
import React from "react";

interface CartCheckoutLocationDisplayProps {
  location: CheckoutLocation;
}

const LOCATION_PIN_CLASS_NAME = "mt-0.5 size-4 shrink-0 text-status-danger";
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
        className="inline-flex min-w-0 items-start gap-2 text-sm font-medium text-action-link underline-offset-4 hover:underline"
      >
        <MapPin className={LOCATION_PIN_CLASS_NAME} />
        <span className={LOCATION_ADDRESS_CLASS_NAME}>{location.address}</span>
      </a>
    );
  }

  if (location.address) {
    return (
      <p className="inline-flex min-w-0 items-start gap-2 text-sm text-text-muted">
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
        className="inline-flex size-10 items-center justify-center rounded-pill border border-line-default text-action-link hover:bg-surface-muted"
      >
        <MapPin className="size-5 text-status-danger" />
      </a>
    );
  }

  return (
    <p className="text-sm text-text-muted">Адрес заведения не указан.</p>
  );
};
