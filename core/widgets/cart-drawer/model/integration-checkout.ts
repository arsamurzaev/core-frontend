import type { CartItemView, PrepareShareOrderInput } from "@/core/modules/cart";
import type { CatalogExperienceMode } from "@/shared/lib/catalog-mode";
import {
  buildCheckoutSummary,
  getDeliveryAddressError,
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
export type IntegrationCheckoutFieldErrors = Partial<
  Record<IntegrationCheckoutField, string>
>;

export const DEFAULT_INTEGRATION_CHECKOUT_METHOD: CheckoutMethod = "DELIVERY";
export const INTEGRATION_PRIVACY_POLICY_URL =
  "https://kreati.ru/%D0%BF%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0%20%D0%BA%D0%BE%D0%BD%D1%84%D0%B8%D0%B4%D0%B5%D0%BD%D1%86%D0%B8%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D1%81%D1%82%D0%B8%20%D0%BA%D1%80%D0%B5%D0%B0%D1%82%D0%B8.pdf";
export const INTEGRATION_PERSONAL_DATA_POLICY_URL =
  "https://kreati.ru/%D0%BF%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0%20%D0%BE%D0%B1%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B8%20%D0%BF%D0%B5%D1%80%D1%81%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D1%85%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85%20%D0%BA%D1%80%D0%B5%D0%B0%D1%82%D0%B8.pdf";
export const INTEGRATION_POLICY_CONSENT_ERROR =
  "Подтвердите согласие с политикой конфиденциальности и обработкой персональных данных.";

export function hasIikoCartItems(items: CartItemView[]): boolean {
  return items.some((item) => {
    const productProvider = item.product?.integration?.provider;
    const variantProvider = item.product?.variants.find(
      (variant) => variant.id === item.variantId,
    )?.integration?.provider;

    return productProvider === "IIKO" || variantProvider === "IIKO";
  });
}

export function getSelectableIntegrationCheckoutMethods(
  methods: CheckoutMethod[],
): CheckoutMethod[] {
  return methods.length > 0 ? methods : [DEFAULT_INTEGRATION_CHECKOUT_METHOD];
}

export function getInitialIntegrationCheckoutMethod(params: {
  availableMethods: CheckoutMethod[];
  orderInput: PrepareShareOrderInput;
}): CheckoutMethod {
  return (
    params.orderInput.checkoutMethod ??
    params.availableMethods[0] ??
    DEFAULT_INTEGRATION_CHECKOUT_METHOD
  );
}

export function resolveEffectiveIntegrationCheckoutFields(params: {
  fields: IntegrationCheckoutField[];
  method: CheckoutMethod | null;
}): IntegrationCheckoutField[] {
  if (
    params.method !== "PREORDER" ||
    !params.fields.includes("checkoutMethod")
  ) {
    return params.fields;
  }

  const fields = [...params.fields];
  for (const field of ["hallTable", "personsCount"] as const) {
    if (!fields.includes(field)) {
      fields.push(field);
    }
  }
  return fields;
}

export function resolveIntegrationCheckoutFields(params: {
  catalogMode?: CatalogExperienceMode;
  hasIikoItems: boolean;
  orderInput: PrepareShareOrderInput;
  requirePreorderTable?: boolean;
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
  if (effectiveMethod === "DELIVERY" && getDeliveryAddressError(data.address)) {
    fields.push("address");
  }

  if (effectiveMethod === "PREORDER" && params.requirePreorderTable) {
    if (!hasPreorderTableRef(data)) {
      fields.push("hallTable");
    }
  }

  if (effectiveMethod === "PREORDER") {
    if (!hasPositiveInt(data.personsCount ?? data.guestsCount)) {
      fields.push("personsCount");
    }
  }

  return fields;
}

export function validateIntegrationPolicyConsent(
  accepted: boolean,
): string | null {
  return accepted ? null : INTEGRATION_POLICY_CONSENT_ERROR;
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
  const errors = getIntegrationCheckoutFieldErrors(params);
  return (
    errors.hallTable ??
    errors.personsCount ??
    errors.customerName ??
    errors.phone ??
    errors.checkoutMethod ??
    errors.address ??
    null
  );
}

export function getIntegrationCheckoutFieldErrors(params: {
  data: CheckoutData;
  fields: IntegrationCheckoutField[];
  method: CheckoutMethod | null;
}): IntegrationCheckoutFieldErrors {
  const errors: IntegrationCheckoutFieldErrors = {};

  if (
    params.fields.includes("hallTable") &&
    params.method === "PREORDER" &&
    !hasPreorderTableRef(params.data)
  ) {
    errors.hallTable = "Выберите стол iiko.";
  }

  if (
    params.fields.includes("hallTable") &&
    params.method !== "PREORDER" &&
    !hasHallTableIdentity(params.data)
  ) {
    errors.hallTable = "Откройте заказ по QR-коду конкретного стола.";
  }

  if (
    params.fields.includes("personsCount") &&
    !hasPositiveInt(params.data.personsCount ?? params.data.guestsCount)
  ) {
    errors.personsCount = "Укажите количество гостей.";
  }

  if (
    params.fields.includes("customerName") &&
    !hasText(params.data.customerName)
  ) {
    errors.customerName = "Укажите имя.";
  }

  if (params.fields.includes("phone") && !hasText(params.data.phone)) {
    errors.phone = "Укажите телефон.";
  }

  if (params.fields.includes("checkoutMethod") && !params.method) {
    errors.checkoutMethod = "Выберите способ получения.";
  }

  if (params.fields.includes("address") && params.method === "DELIVERY") {
    errors.address = getDeliveryAddressError(params.data.address) ?? undefined;
  }

  return errors;
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
      data.t,
  );
}

function hasPreorderTableRef(data: CheckoutData): boolean {
  return hasHallTableIdentity(data);
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
