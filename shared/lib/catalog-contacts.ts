import {
  CatalogContactDtoType,
  type CatalogContactDto,
  type CatalogContactDtoType as CatalogContactType,
} from "@/shared/api/generated";
import { normalizePhoneValue } from "@/shared/lib/phone";

export type CatalogContactsByType = Partial<
  Record<CatalogContactType, CatalogContactDto[]>
>;

function normalizeText(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function isAbsoluteUrl(value: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|sms:)/i.test(value);
}

function normalizePhone(value: string): string | undefined {
  const trimmed = normalizeText(value);
  return trimmed ? normalizePhoneValue(trimmed) : undefined;
}

function ensureUrl(value: string): string {
  return isAbsoluteUrl(value) ? value : `https://${value}`;
}

function withSearchParam(url: string, key: string, value: string): string {
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set(key, value);
    return nextUrl.toString();
  } catch {
    return url;
  }
}

export function normalizeCatalogContacts(
  contacts?: CatalogContactDto[] | null,
): CatalogContactDto[] {
  return [...(contacts ?? [])]
    .map((contact) => {
      const value = normalizeText(contact.value);
      return value ? { ...contact, value } : null;
    })
    .filter((contact): contact is CatalogContactDto => Boolean(contact))
    .sort((left, right) => left.position - right.position);
}

export function groupCatalogContacts(
  contacts?: CatalogContactDto[] | null,
): CatalogContactsByType {
  const groups: CatalogContactsByType = {};

  for (const contact of normalizeCatalogContacts(contacts)) {
    const items = groups[contact.type] ?? [];
    items.push(contact);
    groups[contact.type] = items;
  }

  return groups;
}

export function getPrimaryCatalogContact(
  contactsByType: CatalogContactsByType,
  type: CatalogContactType,
): CatalogContactDto | undefined {
  return contactsByType[type]?.[0];
}

export function getPrimaryCatalogContactValue(
  contactsByType: CatalogContactsByType,
  type: CatalogContactType,
): string | undefined {
  return getPrimaryCatalogContact(contactsByType, type)?.value;
}

export function buildWhatsappContactHref(
  value?: string,
  text?: string,
): string | undefined {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  const normalizedText = normalizeText(text);

  if (isAbsoluteUrl(normalizedValue)) {
    return normalizedText
      ? withSearchParam(normalizedValue, "text", normalizedText)
      : normalizedValue;
  }

  const phone = normalizePhone(normalizedValue);
  if (!phone) {
    return undefined;
  }

  const baseUrl = `https://wa.me/${phone.replace(/^\+/, "")}`;
  return normalizedText
    ? `${baseUrl}?text=${encodeURIComponent(normalizedText)}`
    : baseUrl;
}

export function buildTelegramContactHref(
  value?: string,
  text?: string,
): string | undefined {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  const normalizedText = normalizeText(text);

  if (isAbsoluteUrl(normalizedValue) || normalizedValue.startsWith("t.me/")) {
    const href = ensureUrl(normalizedValue);
    return normalizedText ? withSearchParam(href, "text", normalizedText) : href;
  }

  const username = normalizedValue.replace(/^@/, "");
  if (!username) {
    return undefined;
  }

  const baseUrl = `https://t.me/${username}`;
  return normalizedText
    ? `${baseUrl}?text=${encodeURIComponent(normalizedText)}`
    : baseUrl;
}

export function buildSmsContactHref(
  value?: string,
  text?: string,
): string | undefined {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  const normalizedText = normalizeText(text);

  if (normalizedValue.toLowerCase() === "sms:") {
    return normalizedText
      ? `sms:?body=${encodeURIComponent(normalizedText)}`
      : "sms:";
  }

  if (isAbsoluteUrl(normalizedValue)) {
    return normalizedText
      ? withSearchParam(normalizedValue, "body", normalizedText)
      : normalizedValue;
  }

  const phone = normalizePhone(normalizedValue);
  if (!phone) {
    return undefined;
  }

  return normalizedText
    ? `sms:${phone}?body=${encodeURIComponent(normalizedText)}`
    : `sms:${phone}`;
}

export function buildGenericContactHref(value?: string): string | undefined {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  return ensureUrl(normalizedValue);
}

export function buildCatalogContactHref({
  type,
  value,
  text,
}: {
  type: CatalogContactType;
  value?: string;
  text?: string;
}): string | undefined {
  switch (type) {
    case CatalogContactDtoType.WHATSAPP:
      return buildWhatsappContactHref(value, text);
    case CatalogContactDtoType.TELEGRAM:
      return buildTelegramContactHref(value, text);
    case CatalogContactDtoType.SMS:
      return buildSmsContactHref(value, text);
    case CatalogContactDtoType.PHONE:
      return value ? `tel:${normalizePhone(value) ?? value}` : undefined;
    case CatalogContactDtoType.EMAIL:
      return value ? `mailto:${value}` : undefined;
    case CatalogContactDtoType.MAX:
    case CatalogContactDtoType.BIP:
    case CatalogContactDtoType.MAP:
      return buildGenericContactHref(value);
    default:
      return undefined;
  }
}
