import type { CheckoutData } from "@/shared/lib/checkout-methods";

export function updateCheckoutData(
  data: CheckoutData,
  key: keyof CheckoutData,
  value: string,
): CheckoutData {
  if (key === "personsCount") {
    const numeric = value.trim() ? Number(value) : undefined;
    return {
      ...data,
      personsCount:
        typeof numeric === "number" && Number.isFinite(numeric)
          ? numeric
          : undefined,
    };
  }

  return { ...data, [key]: value };
}

export function formatTimeTextInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
