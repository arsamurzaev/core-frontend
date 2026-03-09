const NON_DIGIT_RE = /\D/g;
const PHONE_DIGIT_LIMIT = 11;

export const PHONE_MASK_MAX_LENGTH = 18;

function normalizePhoneDigits(value: string): string {
  const digits = value.replace(NON_DIGIT_RE, "");
  if (!digits) {
    return "";
  }

  const normalizedDigits =
    digits[0] === "8" ? `7${digits.slice(1)}` : digits;

  return normalizedDigits.slice(0, PHONE_DIGIT_LIMIT);
}

export function getPhoneDigits(value: string): string {
  return normalizePhoneDigits(value.trim());
}

export function formatPhoneInput(value: string): string {
  const trimmed = value.trim();
  const digits = normalizePhoneDigits(trimmed);

  if (!digits) {
    return trimmed.startsWith("+") ? "+" : "";
  }

  const countryCode = digits[0];
  const subscriber = digits.slice(1);

  let formatted = `+${countryCode}`;

  if (!subscriber) {
    return formatted;
  }

  formatted += ` (${subscriber.slice(0, 3)}`;

  if (subscriber.length < 3) {
    return formatted;
  }

  formatted += ")";

  if (subscriber.length > 3) {
    formatted += ` ${subscriber.slice(3, 6)}`;
  }

  if (subscriber.length > 6) {
    formatted += `-${subscriber.slice(6, 8)}`;
  }

  if (subscriber.length > 8) {
    formatted += `-${subscriber.slice(8, 10)}`;
  }

  return formatted;
}

export function normalizePhoneValue(value: string): string | undefined {
  const digits = normalizePhoneDigits(value.trim());
  return digits ? `+${digits}` : undefined;
}
