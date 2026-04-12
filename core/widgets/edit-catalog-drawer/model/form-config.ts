"use client";

import {
  CatalogContactDtoType,
  type CatalogCurrentDto,
  type UpdateCatalogDtoReq,
} from "@/shared/api/generated/react-query";
import {
  getCatalogExperienceDefaultValues,
  normalizeCatalogExperienceModes,
  resolveCatalogExperienceDefaultMode,
  type CatalogExperienceMode,
} from "@/core/widgets/edit-catalog-drawer/model/catalog-experience";
import { normalizePhoneValue } from "@/shared/lib/phone";
import {
  type FieldErrors,
  type Resolver,
} from "react-hook-form";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_PHONE_FIELD_NAMES = ["phone", "message", "whatsapp"] as const;
const CONTACT_URL_FIELD_NAMES = ["bip", "max", "map"] as const;
const PHONE_ERROR_MESSAGE =
  "Введите полный номер в формате +7 (xxx) xxx-xx-xx.";
const EMAIL_ERROR_MESSAGE = "Введите корректный email адрес.";
const CONTACT_REQUIRED_MESSAGE = "Укажите хотя бы один контакт.";

export type CatalogEditFormValues = {
  name: string;
  about: string;
  description: string;
  phone: string;
  message: string;
  email: string;
  whatsapp: string;
  telegram: string;
  max: string;
  bip: string;
  map: string;
  defaultMode: CatalogExperienceMode;
  allowedModes: CatalogExperienceMode[];
  logoFile?: File;
  bgFile?: File;
};

type CatalogEditTextFieldName = "name" | "about" | "description";
type CatalogEditContactFieldName = keyof Pick<
  CatalogEditFormValues,
  "phone" | "message" | "email" | "whatsapp" | "telegram" | "max" | "bip" | "map"
>;

function createFieldError(message: string) {
  return {
    type: "validate",
    message,
  } as const;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalFile(value: unknown): File | undefined {
  return value instanceof File ? value : undefined;
}

function hasAtLeastOneContact(values: Record<string, string>): boolean {
  return Object.values(values).some((value) => normalizeText(value).length > 0);
}

function hasValidPhoneDigits(value: string): boolean {
  return value.replace(/\D/g, "").length === 11;
}

function cleanExternalUrl(value: string): string {
  const trimmed = normalizeText(value);
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

function validateCatalogEditTextField(params: {
  errors: FieldErrors<CatalogEditFormValues>;
  label: string;
  max: number;
  min: number;
  name: CatalogEditTextFieldName;
  value: string;
}) {
  const { errors, label, max, min, name, value } = params;

  if (value.length < min) {
    errors[name] = createFieldError(
      `${label} должно содержать минимум ${min} символов.`,
    );
    return;
  }

  if (value.length > max) {
    errors[name] = createFieldError(
      `${label} не должно превышать ${max} символов.`,
    );
  }
}

function validateCatalogEditContacts(
  errors: FieldErrors<CatalogEditFormValues>,
  values: CatalogEditFormValues,
) {
  const phoneFields: CatalogEditContactFieldName[] = [
    "phone",
    "message",
    "whatsapp",
  ];

  for (const fieldName of phoneFields) {
    const value = values[fieldName];
    if (value.length > 0 && !hasValidPhoneDigits(value)) {
      errors[fieldName] = createFieldError(PHONE_ERROR_MESSAGE);
    }
  }

  if (values.email.length > 0 && !emailRegex.test(values.email)) {
    errors.email = createFieldError(EMAIL_ERROR_MESSAGE);
  }

  if (values.telegram.length > 255) {
    errors.telegram = createFieldError(
      "Telegram не должен превышать 255 символов.",
    );
  }

  if (values.max.length > 255) {
    errors.max = createFieldError(
      "Ссылка MAX не должна превышать 255 символов.",
    );
  }

  if (values.bip.length > 255) {
    errors.bip = createFieldError(
      "Ссылка Bip не должна превышать 255 символов.",
    );
  }

  if (values.map.length > 500) {
    errors.map = createFieldError(
      "Ссылка на карту не должна превышать 500 символов.",
    );
  }

  if (
    !hasAtLeastOneContact({
      phone: values.phone,
      message: values.message,
      email: values.email,
      whatsapp: values.whatsapp,
      telegram: values.telegram,
      max: values.max,
      bip: values.bip,
      map: values.map,
    })
  ) {
    errors.phone = createFieldError(CONTACT_REQUIRED_MESSAGE);
  }
}

function validateCatalogEditExperienceSettings(
  errors: FieldErrors<CatalogEditFormValues>,
  values: CatalogEditFormValues,
) {
  if (values.allowedModes.length === 0) {
    errors.allowedModes = createFieldError(
      "Выберите хотя бы один сценарий заказа.",
    );
    return;
  }

  if (!values.allowedModes.includes(values.defaultMode)) {
    errors.defaultMode = createFieldError(
      "Сценарий по умолчанию должен входить в доступные.",
    );
  }
}

function buildCatalogEditFormErrors(
  values: CatalogEditFormValues,
): FieldErrors<CatalogEditFormValues> {
  const errors: FieldErrors<CatalogEditFormValues> = {};

  validateCatalogEditTextField({
    errors,
    name: "name",
    value: values.name,
    label: "Имя",
    min: 2,
    max: 35,
  });
  validateCatalogEditTextField({
    errors,
    name: "about",
    value: values.about,
    label: "Описание",
    min: 5,
    max: 100,
  });
  validateCatalogEditTextField({
    errors,
    name: "description",
    value: values.description,
    label: "Общая информация",
    min: 10,
    max: 500,
  });

  validateCatalogEditContacts(errors, values);
  validateCatalogEditExperienceSettings(errors, values);

  return errors;
}

export function normalizeCatalogEditFormValues(
  values: CatalogEditFormValues,
): CatalogEditFormValues {
  const allowedModes = normalizeCatalogExperienceModes(values.allowedModes);
  const defaultMode = resolveCatalogExperienceDefaultMode(
    values.defaultMode,
    allowedModes,
  );

  return {
    name: normalizeText(values.name),
    about: normalizeText(values.about),
    description: normalizeText(values.description),
    phone: normalizeText(values.phone),
    message: normalizeText(values.message),
    email: normalizeText(values.email),
    whatsapp: normalizeText(values.whatsapp),
    telegram: normalizeText(values.telegram),
    max: normalizeText(values.max),
    bip: normalizeText(values.bip),
    map: normalizeText(values.map),
    defaultMode,
    allowedModes,
    logoFile: normalizeOptionalFile(values.logoFile),
    bgFile: normalizeOptionalFile(values.bgFile),
  };
}

export const catalogEditFormResolver: Resolver<CatalogEditFormValues> = async (
  rawValues,
) => {
  const values = normalizeCatalogEditFormValues(rawValues as CatalogEditFormValues);
  const errors = buildCatalogEditFormErrors(values);

  return {
    values: Object.keys(errors).length > 0 ? {} : values,
    errors,
  };
};

export const CATALOG_EDIT_FORM_LABEL_CLASS =
  "!flex-none !min-w-[100px] !max-w-[100px] sm:!min-w-[180px] sm:!max-w-[180px]";

export const CATALOG_EDIT_FORM_FIELD_CLASS =
  "items-start [&>[data-slot=field-label]]:!flex-none [&>[data-slot=field-label]]:!min-w-[100px] [&>[data-slot=field-label]]:!max-w-[100px] sm:[&>[data-slot=field-label]]:!min-w-[180px] sm:[&>[data-slot=field-label]]:!max-w-[180px] [&>[data-slot=field-content]]:min-w-0 [&>[data-slot=field-content]]:flex-1";

export const CATALOG_EDIT_FORM_LAYOUT = {
  variant: "grid" as const,
  columns: 1,
  className: "gap-5",
};

export const CATALOG_EDIT_FIELDSET_PROPS = {
  className: "space-y-0",
};

export const CATALOG_EDIT_FIELD_GROUP_PROPS = {
  className: "gap-5",
};

type ContactFieldConfig = {
  name: CatalogEditContactFieldName;
  type: CatalogContactDtoType;
  label: string;
  placeholder: string;
  kind: "text" | "tel" | "email" | "url";
};

export const CATALOG_CONTACT_FIELDS: ContactFieldConfig[] = [
  {
    name: "phone",
    type: CatalogContactDtoType.PHONE,
    label: "Телефон",
    placeholder: "+7 (___) ___-__-__",
    kind: "tel",
  },
  {
    name: "message",
    type: CatalogContactDtoType.SMS,
    label: "Сообщения",
    placeholder: "+7 (___) ___-__-__",
    kind: "tel",
  },
  {
    name: "email",
    type: CatalogContactDtoType.EMAIL,
    label: "Email",
    placeholder: "example@mail.ru",
    kind: "email",
  },
  {
    name: "whatsapp",
    type: CatalogContactDtoType.WHATSAPP,
    label: "WhatsApp",
    placeholder: "+7 (___) ___-__-__",
    kind: "tel",
  },
  {
    name: "telegram",
    type: CatalogContactDtoType.TELEGRAM,
    label: "Telegram",
    placeholder: "@nickname",
    kind: "text",
  },
  {
    name: "bip",
    type: CatalogContactDtoType.BIP,
    label: "Bip",
    placeholder: "https://...",
    kind: "url",
  },
  {
    name: "max",
    type: CatalogContactDtoType.MAX,
    label: "MAX",
    placeholder: "https://...",
    kind: "url",
  },
  {
    name: "map",
    type: CatalogContactDtoType.MAP,
    label: "Карта",
    placeholder: "https://yandex.ru/maps/...",
    kind: "url",
  },
] as const;

function getCatalogContactValue(
  catalog: CatalogCurrentDto,
  type: CatalogContactDtoType,
): string {
  return catalog.contacts.find((contact) => contact.type === type)?.value ?? "";
}

function normalizePhoneContact(value: string): string | undefined {
  return normalizePhoneValue(value);
}

function normalizePlainContact(value: string): string | undefined {
  const trimmed = normalizeText(value);
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeUrlContact(value: string): string | undefined {
  const cleaned = cleanExternalUrl(value);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function buildCatalogEditFormDefaultValues(
  catalog: CatalogCurrentDto,
): CatalogEditFormValues {
  const experience = getCatalogExperienceDefaultValues(catalog);

  return {
    name: catalog.name ?? "",
    about: catalog.config?.about ?? "",
    description:
      typeof catalog.config?.description === "string"
        ? catalog.config.description
        : "",
    phone: getCatalogContactValue(catalog, CatalogContactDtoType.PHONE),
    message: getCatalogContactValue(catalog, CatalogContactDtoType.SMS),
    email: getCatalogContactValue(catalog, CatalogContactDtoType.EMAIL),
    whatsapp: getCatalogContactValue(catalog, CatalogContactDtoType.WHATSAPP),
    telegram: getCatalogContactValue(catalog, CatalogContactDtoType.TELEGRAM),
    max: getCatalogContactValue(catalog, CatalogContactDtoType.MAX),
    bip: getCatalogContactValue(catalog, CatalogContactDtoType.BIP),
    map: getCatalogContactValue(catalog, CatalogContactDtoType.MAP),
    defaultMode: experience.defaultMode,
    allowedModes: experience.allowedModes,
    logoFile: undefined,
    bgFile: undefined,
  };
}

export function buildCatalogEditUpdatePayload(
  values: CatalogEditFormValues,
  {
    logoMediaId,
    bgMediaId,
  }: {
    logoMediaId?: string;
    bgMediaId?: string;
  } = {},
): UpdateCatalogDtoReq {
  const contacts = CATALOG_CONTACT_FIELDS.flatMap((contact, index) => {
    const rawValue = values[contact.name];

    const normalizedValue = CONTACT_PHONE_FIELD_NAMES.includes(
      contact.name as (typeof CONTACT_PHONE_FIELD_NAMES)[number],
    )
      ? normalizePhoneContact(rawValue)
      : CONTACT_URL_FIELD_NAMES.includes(
            contact.name as (typeof CONTACT_URL_FIELD_NAMES)[number],
          )
        ? normalizeUrlContact(rawValue)
        : normalizePlainContact(rawValue);

    if (!normalizedValue) {
      return [];
    }

    return [
      {
        type: contact.type,
        position: index,
        value: normalizedValue,
      },
    ];
  });

  return {
    name: normalizeText(values.name),
    about: normalizeText(values.about),
    description: normalizeText(values.description),
    defaultMode: values.defaultMode,
    allowedModes: values.allowedModes,
    contacts,
    ...(logoMediaId ? { logoMediaId } : {}),
    ...(bgMediaId ? { bgMediaId } : {}),
  };
}
