"use client";

import {
  CatalogContactDtoType,
  type CatalogCurrentDto,
  type UpdateCatalogDtoReq,
} from "@/shared/api/generated";
import { CatalogControllerUpdateCurrentBody } from "@/shared/api/generated/zod";
import { normalizePhoneValue } from "@/shared/lib/phone";
import { z } from "zod";

const optionalFileSchema = z.custom<File | undefined>(
  (value) => value === undefined || value instanceof File,
);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_PHONE_FIELD_NAMES = ["phone", "message", "whatsapp"] as const;
const CONTACT_URL_FIELD_NAMES = ["bip", "max", "map"] as const;

function normalizeText(value: string): string {
  return value.trim();
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

const contactFieldSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || hasValidPhoneDigits(value), {
        message: "Введите полный номер в формате +7 (xxx) xxx-xx-xx.",
      }),
    message: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || hasValidPhoneDigits(value), {
        message: "Введите полный номер в формате +7 (xxx) xxx-xx-xx.",
      }),
    email: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || emailRegex.test(value), {
        message: "Введите корректный email адрес.",
      }),
    whatsapp: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || hasValidPhoneDigits(value), {
        message: "Введите полный номер в формате +7 (xxx) xxx-xx-xx.",
      }),
    telegram: z.string().trim().max(255, {
      message: "Telegram не должен превышать 255 символов.",
    }),
    max: z.string().trim().max(255, {
      message: "Ссылка MAX не должна превышать 255 символов.",
    }),
    bip: z.string().trim().max(255, {
      message: "Ссылка Bip не должна превышать 255 символов.",
    }),
    map: z.string().trim().max(500, {
      message: "Ссылка на карту не должна превышать 500 символов.",
    }),
  })
  .superRefine((values, ctx) => {
    if (hasAtLeastOneContact(values)) {
      return;
    }

    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Укажите хотя бы один контакт.",
    });
  });

const catalogEditBaseSchema = CatalogControllerUpdateCurrentBody.pick({
  name: true,
  about: true,
  description: true,
  contacts: true,
});

export const catalogEditFormSchema = catalogEditBaseSchema
  .omit({ contacts: true })
  .extend({
    name: z
      .string()
      .trim()
      .min(2, { message: "Имя должно содержать минимум 2 символа." })
      .max(35, { message: "Имя не должно превышать 35 символов." }),
    about: z
      .string()
      .trim()
      .min(5, { message: "Описание должно содержать минимум 5 символов." })
      .max(100, { message: "Описание не должно превышать 100 символов." }),
    description: z
      .string()
      .trim()
      .min(10, {
        message: "Общая информация должна содержать минимум 10 символов.",
      })
      .max(500, {
        message: "Общая информация не должна превышать 500 символов.",
      }),
    logoFile: optionalFileSchema.optional(),
    bgFile: optionalFileSchema.optional(),
  })
  .merge(contactFieldSchema);

export type CatalogEditFormValues = z.infer<typeof catalogEditFormSchema>;

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
  name: keyof Pick<
    CatalogEditFormValues,
    "phone" | "message" | "email" | "whatsapp" | "telegram" | "max" | "bip" | "map"
  >;
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
  return {
    name: catalog.name ?? "",
    about: catalog.config?.about ?? "",
    description: typeof catalog.config?.description === "string"
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
    contacts,
    ...(logoMediaId ? { logoMediaId } : {}),
    ...(bgMediaId ? { bgMediaId } : {}),
  };
}
