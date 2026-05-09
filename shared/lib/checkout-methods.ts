"use client";

import {
  CatalogContactDtoType,
  type CatalogContactDto,
  type CatalogCurrentDto,
} from "@/shared/api/generated/react-query";
import { normalizeCatalogContacts } from "@/shared/lib/catalog-contacts";

export type CheckoutMethod = "DELIVERY" | "PICKUP" | "PREORDER";

export type CheckoutContactValues = Partial<
  Record<CatalogContactDtoType, string>
>;

export type CheckoutData = {
  address?: string;
  mapUrl?: string;
  personsCount?: number;
  visitTime?: string;
};

export type CheckoutField = {
  key: string;
  label: string;
  required: boolean;
  type: "number" | "text" | "time";
};

export type CheckoutConfig = {
  availableMethods: CheckoutMethod[];
  enabledMethods: CheckoutMethod[];
  methodContacts: Partial<Record<CheckoutMethod, CheckoutContactValues>>;
  methodFields: Record<CheckoutMethod, CheckoutField[]>;
};

export type CheckoutLocation = {
  address: string | null;
  mapUrl: string | null;
};

export const CHECKOUT_METHOD_LABELS: Record<CheckoutMethod, string> = {
  DELIVERY: "Доставка",
  PICKUP: "Самовывоз",
  PREORDER: "Предзаказ",
};

export const CHECKOUT_METHOD_DESCRIPTIONS: Record<CheckoutMethod, string> = {
  DELIVERY: "Клиент указывает адрес доставки при оформлении.",
  PICKUP: "Клиент забирает заказ по адресу заведения.",
  PREORDER: "Клиент бронирует заказ к визиту.",
};

export const CHECKOUT_METHODS: CheckoutMethod[] = [
  "DELIVERY",
  "PICKUP",
  "PREORDER",
];

export const CHECKOUT_CONTACT_TYPES = [
  CatalogContactDtoType.PHONE,
  CatalogContactDtoType.WHATSAPP,
  CatalogContactDtoType.SMS,
  CatalogContactDtoType.TELEGRAM,
  CatalogContactDtoType.BIP,
  CatalogContactDtoType.MAX,
] as const;

export const METHOD_FIELDS: Record<CheckoutMethod, CheckoutField[]> = {
  DELIVERY: [
    {
      key: "address",
      label: "Адрес доставки",
      required: true,
      type: "text",
    },
  ],
  PICKUP: [],
  PREORDER: [
    {
      key: "personsCount",
      label: "Количество человек",
      required: true,
      type: "number",
    },
    {
      key: "visitTime",
      label: "Время визита",
      required: false,
      type: "time",
    },
  ],
};

export function resolveCheckoutAvailableMethods(): CheckoutMethod[] {
  return ["DELIVERY"];
}

export function getCatalogCheckoutConfig(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings" | "type">,
  options: {
    availableMethods?: CheckoutMethod[];
  } = {},
): CheckoutConfig {
  const rawCheckout = ((catalog.settings as unknown as {
    checkout?: Partial<CheckoutConfig>;
  } | null)?.checkout ?? {}) as Partial<CheckoutConfig>;
  const availableMethods = normalizeMethodList(
    options.availableMethods ?? resolveCheckoutAvailableMethods(),
    CHECKOUT_METHODS,
  );
  const enabledMethods = normalizeMethodList(
    rawCheckout.enabledMethods,
    availableMethods,
  );

  return {
    availableMethods,
    enabledMethods,
    methodContacts: normalizeMethodContacts(rawCheckout.methodContacts),
    methodFields: rawCheckout.methodFields ?? METHOD_FIELDS,
  };
}

export function getInitialCheckoutMethod(
  config: CheckoutConfig,
): CheckoutMethod {
  return config.enabledMethods[0] ?? config.availableMethods[0] ?? "DELIVERY";
}

export function getCatalogCheckoutLocation(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings">,
): CheckoutLocation {
  const address = normalizeString(
    (catalog.settings as unknown as { address?: string | null } | null)?.address,
  );
  const mapContact = normalizeCatalogContacts(catalog.contacts).find(
    (contact) => contact.type === CatalogContactDtoType.MAP,
  );

  return {
    address: address || null,
    mapUrl: normalizeString(mapContact?.value) || null,
  };
}

export function resolveCheckoutContacts(params: {
  catalogContacts: CatalogContactDto[];
  config: CheckoutConfig;
  method: CheckoutMethod;
}): CheckoutContactValues {
  const customContacts = params.config.methodContacts[params.method] ?? {};

  if (hasCheckoutContacts(customContacts)) {
    return customContacts;
  }

  return normalizeCatalogContacts(params.catalogContacts).reduce<CheckoutContactValues>(
    (acc, contact) => {
      if (
        (CHECKOUT_CONTACT_TYPES as readonly CatalogContactDtoType[]).includes(
          contact.type,
        )
      ) {
        acc[contact.type] = contact.value;
      }
      return acc;
    },
    {},
  );
}

export function normalizeCheckoutMethod(value: unknown): CheckoutMethod | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return CHECKOUT_METHODS.includes(normalized as CheckoutMethod)
    ? (normalized as CheckoutMethod)
    : null;
}

export function normalizeCheckoutData(params: {
  data: CheckoutData;
  location: CheckoutLocation;
  method: CheckoutMethod;
}): {
  data: CheckoutData;
  error: string | null;
} {
  if (params.method === "DELIVERY") {
    const address = normalizeString(params.data.address);
    return address
      ? { data: { address }, error: null }
      : { data: {}, error: "Укажите адрес доставки." };
  }

  if (params.method === "PICKUP") {
    return {
      data: {
        ...(params.location.address ? { address: params.location.address } : {}),
        ...(params.location.mapUrl ? { mapUrl: params.location.mapUrl } : {}),
      },
      error: null,
    };
  }

  if (params.method === "PREORDER") {
    const personsCount = Number(params.data.personsCount);
    if (!Number.isInteger(personsCount) || personsCount < 1) {
      return { data: {}, error: "Укажите количество человек." };
    }

    const visitTime = normalizeString(params.data.visitTime);
    return {
      data: {
        personsCount,
        ...(params.location.address ? { address: params.location.address } : {}),
        ...(params.location.mapUrl ? { mapUrl: params.location.mapUrl } : {}),
        ...(visitTime ? { visitTime } : {}),
      },
      error: null,
    };
  }

  return { data: {}, error: null };
}

export function buildCheckoutSummary(params: {
  data: CheckoutData;
  method: CheckoutMethod;
}): string[] {
  const lines = [`Способ оформления: ${CHECKOUT_METHOD_LABELS[params.method]}`];

  if (params.method === "DELIVERY" && params.data.address) {
    lines.push(`Адрес доставки: ${params.data.address}`);
  }

  if (
    (params.method === "PICKUP" || params.method === "PREORDER") &&
    params.data.address
  ) {
    lines.push(`Адрес заведения: ${params.data.address}`);
  }

  if (
    (params.method === "PICKUP" || params.method === "PREORDER") &&
    !params.data.address &&
    params.data.mapUrl
  ) {
    lines.push(`Карта: ${params.data.mapUrl}`);
  }

  if (params.method === "PREORDER") {
    if (params.data.personsCount) {
      lines.push(`Гостей: ${params.data.personsCount}`);
    }
    if (params.data.visitTime) {
      lines.push(`Время визита: ${params.data.visitTime}`);
    }
  }

  return lines;
}

function normalizeMethodList(
  value: unknown,
  availableMethods: CheckoutMethod[],
): CheckoutMethod[] {
  if (!Array.isArray(value)) {
    return availableMethods;
  }

  const methods = Array.from(
    new Set(value.map(normalizeCheckoutMethod).filter(Boolean)),
  ) as CheckoutMethod[];
  const filtered = methods.filter((method) => availableMethods.includes(method));

  return filtered.length > 0 ? filtered : availableMethods;
}

function normalizeMethodContacts(value: unknown): CheckoutConfig["methodContacts"] {
  if (!isRecord(value)) {
    return {};
  }

  return CHECKOUT_METHODS.reduce<CheckoutConfig["methodContacts"]>(
    (acc, method) => {
      const rawContacts = value[method];
      if (!isRecord(rawContacts)) {
        return acc;
      }

      const contacts = CHECKOUT_CONTACT_TYPES.reduce<CheckoutContactValues>(
        (contactAcc, contactType) => {
          const contactValue = normalizeString(rawContacts[contactType]);
          if (contactValue) {
            contactAcc[contactType] = contactValue;
          }
          return contactAcc;
        },
        {},
      );

      if (hasCheckoutContacts(contacts)) {
        acc[method] = contacts;
      }

      return acc;
    },
    {},
  );
}

function hasCheckoutContacts(contacts: CheckoutContactValues): boolean {
  return Object.values(contacts).some((value) => normalizeString(value).length > 0);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
