import type { CartItemView, PrepareShareOrderInput } from "@/core/modules/cart";
import type { CatalogExperienceMode } from "@/shared/lib/catalog-mode";
import {
  buildCheckoutSummary,
  type CheckoutData,
  type CheckoutLocation,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";

export type IntegrationCheckoutField =
  | "address"
  | "checkoutMethod"
  | "customerName"
  | "hallTable"
  | "personsCount"
  | "phone";

export const DEFAULT_INTEGRATION_CHECKOUT_METHOD: CheckoutMethod = "DELIVERY";

export function hasIikoCartItems(items: CartItemView[]): boolean {
  return items.some((item) => {
    const productProvider = item.product?.integration?.provider;
    const variantProvider = item.product?.variants.find(
      (variant) => variant.id === item.variantId,
    )?.integration?.provider;

    return productProvider === "IIKO" || variantProvider === "IIKO";
  });
}

export function resolveIntegrationCheckoutFields(params: {
  catalogMode?: CatalogExperienceMode;
  hasIikoItems: boolean;
  orderInput: PrepareShareOrderInput;
}): IntegrationCheckoutField[] {
  if (!params.hasIikoItems) {
    return [];
  }

  const data = params.orderInput.checkoutData ?? {};
  const method = params.orderInput.checkoutMethod ?? null;
  const fields: IntegrationCheckoutField[] = [];

  if (params.catalogMode === "HALL") {
    if (!hasHallTableIdentity(data)) {
      fields.push("hallTable");
    }

    if (!hasPositiveInt(data.personsCount ?? data.guestsCount)) {
      fields.push("personsCount");
    }

    if (!hasText(data.customerName)) {
      fields.push("customerName");
    }

    return fields;
  }

  if (!hasText(data.customerName)) {
    fields.push("customerName");
  }

  if (!hasText(data.phone)) {
    fields.push("phone");
  }

  if (!method) {
    fields.push("checkoutMethod");
  }

  const effectiveMethod = method ?? DEFAULT_INTEGRATION_CHECKOUT_METHOD;
  if (effectiveMethod === "DELIVERY" && !hasText(data.address)) {
    fields.push("address");
  }

  return fields;
}

export function buildIntegrationCheckoutOrderInput(params: {
  baseInput: PrepareShareOrderInput;
  data: CheckoutData;
  location: CheckoutLocation;
  method: CheckoutMethod;
}): PrepareShareOrderInput {
  const checkoutData = normalizeIntegrationCheckoutData({
    data: {
      ...(params.baseInput.checkoutData ?? {}),
      ...params.data,
    },
    location: params.location,
    method: params.method,
  });

  return {
    ...params.baseInput,
    checkoutData,
    checkoutMethod: params.method,
    checkoutSummary: buildCheckoutSummary({
      data: checkoutData,
      method: params.method,
    }),
  };
}

export function validateIntegrationCheckout(params: {
  data: CheckoutData;
  fields: IntegrationCheckoutField[];
  method: CheckoutMethod | null;
}): string | null {
  if (
    params.fields.includes("hallTable") &&
    !hasHallTableIdentity(params.data)
  ) {
    return "Откройте заказ по QR-коду конкретного стола.";
  }

  if (
    params.fields.includes("personsCount") &&
    !hasPositiveInt(params.data.personsCount ?? params.data.guestsCount)
  ) {
    return "Укажите количество гостей.";
  }

  if (params.fields.includes("customerName") && !hasText(params.data.customerName)) {
    return "Укажите имя.";
  }

  if (params.fields.includes("phone") && !hasText(params.data.phone)) {
    return "Укажите телефон.";
  }

  if (params.fields.includes("checkoutMethod") && !params.method) {
    return "Выберите способ получения.";
  }

  if (params.method === "DELIVERY" && !hasText(params.data.address)) {
    return "Укажите адрес доставки.";
  }

  return null;
}

function normalizeIntegrationCheckoutData(params: {
  data: CheckoutData;
  location: CheckoutLocation;
  method: CheckoutMethod;
}): CheckoutData {
  const customerName = normalizeString(params.data.customerName);
  const phone = normalizeString(params.data.phone);
  const address = normalizeString(params.data.address);
  const personsCount = normalizePositiveInt(
    params.data.personsCount ?? params.data.guestsCount,
  );
  const data = {
    ...params.data,
    ...(customerName ? { customerName } : {}),
    ...(phone ? { phone } : {}),
    ...(address ? { address } : {}),
    ...(personsCount ? { personsCount, guestsCount: personsCount } : {}),
  };

  if (params.method === "PICKUP" || params.method === "PREORDER") {
    return {
      ...data,
      ...(data.address || !params.location.address
        ? {}
        : { address: params.location.address }),
      ...(data.mapUrl || !params.location.mapUrl
        ? {}
        : { mapUrl: params.location.mapUrl }),
    };
  }

  return data;
}

function hasText(value: unknown): boolean {
  return normalizeString(value).length > 0;
}

function hasHallTableIdentity(data: CheckoutData): boolean {
  return hasText(
    data.iikoTableId ??
      data.hallTableId ??
      data.tableId ??
      data.integrationExternalItemCode ??
      data.hallTableCode ??
      data.tableCode ??
      data.t ??
      data.integrationPayloadToken ??
      data.hallPayloadToken ??
      data.payloadToken ??
      data.h,
  );
}

function hasPositiveInt(value: unknown): boolean {
  return normalizePositiveInt(value) !== null;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePositiveInt(value: unknown): number | null {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isInteger(number) || number < 1) return null;
  return Math.min(number, 999);
}
