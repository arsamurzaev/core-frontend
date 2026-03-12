"use client";

import {
  CATALOG_CONTACT_FIELDS,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import {
  CatalogOwnerBipIcon,
  CatalogOwnerGeoIcon,
  CatalogOwnerMailIcon,
  CatalogOwnerMaxIcon,
  CatalogOwnerPhoneIcon,
  CatalogOwnerTgIcon,
  CatalogOwnerWaIcon,
} from "@/shared/ui/icons/catalog-owner-icons";
import { MessageCircle } from "lucide-react";
import React from "react";

export type CatalogContactFieldName =
  (typeof CATALOG_CONTACT_FIELDS)[number]["name"];

export type ContactIconProps = {
  className?: string;
};

export type ContactInputProps = Omit<
  React.ComponentProps<"input">,
  "defaultValue" | "onChange" | "type" | "value"
>;

export type CatalogContactValues = Partial<
  Record<CatalogContactFieldName, string>
>;

export type CatalogContactFieldConfig =
  (typeof CATALOG_CONTACT_FIELDS)[number];

export const CONTACT_FIELD_NAMES = CATALOG_CONTACT_FIELDS.map(
  (field) => field.name,
) as [CatalogContactFieldName, ...CatalogContactFieldName[]];

export const CONTACT_DRAWER_DESCRIPTION =
  "Обязательно укажите хотя бы один контакт. Внешние ссылки будут показаны внизу каталога, чтобы с вами было проще связаться.";

export const CONTACT_ICON_BY_NAME: Record<
  CatalogContactFieldName,
  React.ComponentType<ContactIconProps>
> = {
  phone: CatalogOwnerPhoneIcon,
  message: ({ className }) => (
    <MessageCircle className={className} fill="currentColor" />
  ),
  email: CatalogOwnerMailIcon,
  whatsapp: CatalogOwnerWaIcon,
  telegram: CatalogOwnerTgIcon,
  bip: CatalogOwnerBipIcon,
  max: CatalogOwnerMaxIcon,
  map: CatalogOwnerGeoIcon,
};

export function normalizeContactValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanPastedCatalogContactUrl(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
  const rawUrl = urlMatch?.[0] ?? trimmed;

  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
}

export function getCatalogContactInputProps(
  field: CatalogContactFieldConfig,
): ContactInputProps | undefined {
  if (field.kind === "tel") {
    return {
      autoComplete: "tel",
      inputMode: "tel",
    };
  }

  if (field.kind === "email") {
    return {
      autoComplete: "email",
      inputMode: "email",
    };
  }

  if (field.kind === "url") {
    return {
      autoCapitalize: "none",
      autoCorrect: "off",
      inputMode: "url",
    };
  }

  if (field.name === "telegram") {
    return {
      autoCapitalize: "none",
      autoCorrect: "off",
    };
  }

  return undefined;
}

export type CatalogContactControllerFieldName = keyof Pick<
  CatalogEditFormValues,
  CatalogContactFieldName
>;
