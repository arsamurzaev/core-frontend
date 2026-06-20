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
  customerName?: string;
  guestsCount?: number;
  hallSectionId?: string;
  hallSectionName?: string;
  hallTableCode?: string;
  hallTableId?: string;
  hallTableName?: string;
  hallTableNumber?: string;
  iikoRestaurantSectionId?: string;
  iikoRestaurantSectionName?: string;
  iikoTableId?: string;
  integrationExternalItemCode?: string;
  mapUrl?: string;
  orderMode?: string;
  phone?: string;
  personsCount?: number;
  t?: string;
  table?: string;
  tableCode?: string;
  tableId?: string;
  tableName?: string;
  tableNumber?: string;
  scheduledAt?: string;
  visitDate?: string;
  visitTime?: string;
};

export type CheckoutField = {
  key: string;
  label: string;
  required: boolean;
  type: "date" | "number" | "text" | "time";
};

export type CheckoutPreorderSettings = {
  minLeadTimeMinutes: number;
  maxAdvanceDays: number;
};

export type CheckoutConfig = {
  availableMethods: CheckoutMethod[];
  enabledMethods: CheckoutMethod[];
  methodContacts: Partial<Record<CheckoutMethod, CheckoutContactValues>>;
  methodFields: Record<CheckoutMethod, CheckoutField[]>;
  preorder: CheckoutPreorderSettings;
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

export const DELIVERY_ADDRESS_REQUIRED_ERROR = "Укажите адрес доставки.";
export const DELIVERY_ADDRESS_HOUSE_REQUIRED_ERROR =
  "Укажите номер дома в адресе.";

const DEFAULT_AVAILABLE_METHODS: CheckoutMethod[] = ["DELIVERY", "PICKUP"];
export const DEFAULT_PREORDER_SETTINGS: CheckoutPreorderSettings = {
  minLeadTimeMinutes: 30,
  maxAdvanceDays: 14,
};

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
      key: "visitDate",
      label: "Дата визита",
      required: true,
      type: "date",
    },
    {
      key: "visitTime",
      label: "Время визита",
      required: true,
      type: "time",
    },
  ],
};

export function resolveCheckoutAvailableMethods(
  _typeCode?: string | null,
): CheckoutMethod[] {
  void _typeCode;

  return DEFAULT_AVAILABLE_METHODS;
}

export function resolveCheckoutDefaultEnabledMethods(
  _typeCode?: string | null,
  _availableMethods = resolveCheckoutAvailableMethods(),
): CheckoutMethod[] {
  void _typeCode;
  void _availableMethods;

  return [];
}

export function getCatalogCheckoutConfig(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings" | "type">,
  options: {
    availableMethods?: CheckoutMethod[];
    defaultEnabledMethods?: CheckoutMethod[];
  } = {},
): CheckoutConfig {
  const rawCheckout = ((
    catalog.settings as unknown as {
      checkout?: Partial<CheckoutConfig>;
    } | null
  )?.checkout ?? {}) as Partial<CheckoutConfig>;
  const availableMethods = normalizeAvailableMethodList(
    options.availableMethods ?? resolveCheckoutAvailableMethods(),
  );
  const enabledMethods = normalizeEnabledMethodList(
    rawCheckout.enabledMethods,
    availableMethods,
    options.defaultEnabledMethods ??
      resolveCheckoutDefaultEnabledMethods(undefined, availableMethods),
  );

  return {
    availableMethods,
    enabledMethods,
    methodContacts: normalizeMethodContacts(rawCheckout.methodContacts),
    methodFields: rawCheckout.methodFields ?? METHOD_FIELDS,
    preorder: normalizePreorderSettings(rawCheckout.preorder),
  };
}

export function getInitialCheckoutMethod(
  config: CheckoutConfig,
): CheckoutMethod | null {
  return config.enabledMethods[0] ?? null;
}

export function getCatalogCheckoutLocation(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings">,
): CheckoutLocation {
  const address = normalizeString(
    (catalog.settings as unknown as { address?: string | null } | null)
      ?.address,
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
  const catalogContacts = normalizeCatalogContacts(
    params.catalogContacts,
  ).reduce<CheckoutContactValues>((acc, contact) => {
    if (
      (CHECKOUT_CONTACT_TYPES as readonly CatalogContactDtoType[]).includes(
        contact.type,
      )
    ) {
      acc[contact.type] = contact.value;
    }
    return acc;
  }, {});
  const customContacts = params.config.methodContacts[params.method] ?? {};

  return hasCheckoutContacts(customContacts)
    ? { ...catalogContacts, ...customContacts }
    : catalogContacts;
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
  config?: Pick<CheckoutConfig, "preorder">;
  data: CheckoutData;
  location: CheckoutLocation;
  method: CheckoutMethod;
}): {
  data: CheckoutData;
  error: string | null;
} {
  const customerData = normalizeCustomerCheckoutData(params.data);

  if (params.method === "DELIVERY") {
    const address = normalizeString(params.data.address);
    const addressError = getDeliveryAddressError(address);

    return addressError
      ? { data: {}, error: addressError }
      : { data: { ...customerData, address }, error: null };
  }

  if (params.method === "PICKUP") {
    return {
      data: {
        ...customerData,
        ...(params.location.address
          ? { address: params.location.address }
          : {}),
        ...(params.location.mapUrl ? { mapUrl: params.location.mapUrl } : {}),
      },
      error: null,
    };
  }

  if (params.method === "PREORDER") {
    const preorder = params.config?.preorder ?? DEFAULT_PREORDER_SETTINGS;
    const personsCount = Number(params.data.personsCount);
    if (!Number.isInteger(personsCount) || personsCount < 1) {
      return { data: {}, error: "Укажите количество человек." };
    }

    const visitDate = normalizeDateInput(params.data.visitDate);
    if (!visitDate) {
      return { data: {}, error: "Выберите дату визита." };
    }

    const visitTime = normalizeTimeInput(params.data.visitTime);
    if (!visitTime) {
      return { data: {}, error: "Выберите время визита." };
    }

    const scheduledAt = `${visitDate}T${visitTime}:00.000`;
    const scheduledDate = parseLocalDateTime(visitDate, visitTime);
    if (
      !scheduledDate ||
      scheduledDate.getTime() <
        Date.now() + preorder.minLeadTimeMinutes * 60 * 1000
    ) {
      return {
        data: {},
        error: `Выберите время визита не раньше чем через ${preorder.minLeadTimeMinutes} мин.`,
      };
    }

    if (
      scheduledDate.getTime() >
      Date.now() + preorder.maxAdvanceDays * 24 * 60 * 60 * 1000
    ) {
      return {
        data: {},
        error: `Выберите дату визита не позднее чем через ${preorder.maxAdvanceDays} дн.`,
      };
    }

    return {
      data: {
        ...customerData,
        personsCount,
        ...(params.location.address
          ? { address: params.location.address }
          : {}),
        ...(params.location.mapUrl ? { mapUrl: params.location.mapUrl } : {}),
        scheduledAt,
        visitDate,
        visitTime,
      },
      error: null,
    };
  }

  return { data: {}, error: null };
}

export function getDeliveryAddressError(
  value: unknown,
  options: { requireHouse?: boolean } = {},
): string | null {
  const address = normalizeString(value);

  if (!address) {
    return DELIVERY_ADDRESS_REQUIRED_ERROR;
  }

  if (options.requireHouse && !hasDeliveryAddressHouse(address)) {
    return DELIVERY_ADDRESS_HOUSE_REQUIRED_ERROR;
  }

  return null;
}

export function hasDeliveryAddressHouse(value: unknown): boolean {
  const address = normalizeString(value).replace(/\s+/g, " ");

  if (!address) {
    return false;
  }

  const addressBeforeFlatDetails = address.replace(
    /\s*[,;]\s*(?:кв\.?|квартира|подъезд|п\.?|этаж|эт\.?|домофон|код)(?=$|\s|[,;]).*$/i,
    "",
  );

  return (
    hasExplicitHouseMarker(address) ||
    hasHouseAtSegmentStart(address) ||
    HOUSE_AT_END_RE.test(addressBeforeFlatDetails)
  );
}

export function buildCheckoutSummary(params: {
  data: CheckoutData;
  method: CheckoutMethod;
}): string[] {
  const lines = [`Способ оформления: ${CHECKOUT_METHOD_LABELS[params.method]}`];

  if (params.data.customerName) {
    lines.push(`Имя: ${params.data.customerName}`);
  }

  if (params.data.phone) {
    lines.push(`Телефон: ${params.data.phone}`);
  }

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
    if (params.data.visitDate) {
      lines.push(`Дата визита: ${formatDisplayDate(params.data.visitDate)}`);
    }
    if (params.data.visitTime) {
      lines.push(`Время визита: ${params.data.visitTime}`);
    }
  }

  return lines;
}

function normalizeAvailableMethodList(value: unknown): CheckoutMethod[] {
  const methods = normalizeMethodList(value, CHECKOUT_METHODS);
  return methods.length > 0 ? methods : DEFAULT_AVAILABLE_METHODS;
}

function normalizeEnabledMethodList(
  value: unknown,
  availableMethods: CheckoutMethod[],
  fallbackMethods: CheckoutMethod[],
): CheckoutMethod[] {
  if (!Array.isArray(value)) {
    return fallbackMethods;
  }

  return normalizeMethodList(value, availableMethods);
}

function normalizeMethodList(
  value: unknown,
  availableMethods: CheckoutMethod[],
): CheckoutMethod[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const methods = Array.from(
    new Set(value.map(normalizeCheckoutMethod).filter(Boolean)),
  ) as CheckoutMethod[];
  const filtered = methods.filter((method) =>
    availableMethods.includes(method),
  );

  return filtered;
}

function normalizeMethodContacts(
  value: unknown,
): CheckoutConfig["methodContacts"] {
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

function normalizePreorderSettings(value: unknown): CheckoutPreorderSettings {
  if (!isRecord(value)) {
    return DEFAULT_PREORDER_SETTINGS;
  }

  return {
    minLeadTimeMinutes:
      normalizeIntInRange(value.minLeadTimeMinutes, 0, 24 * 60) ??
      DEFAULT_PREORDER_SETTINGS.minLeadTimeMinutes,
    maxAdvanceDays:
      normalizeIntInRange(value.maxAdvanceDays, 1, 365) ??
      DEFAULT_PREORDER_SETTINGS.maxAdvanceDays,
  };
}

function normalizeIntInRange(
  value: unknown,
  min: number,
  max: number,
): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
    return null;
  }

  return numeric;
}

function hasCheckoutContacts(contacts: CheckoutContactValues): boolean {
  return Object.values(contacts).some(
    (value) => normalizeString(value).length > 0,
  );
}

const HOUSE_VALUE_PATTERN =
  "\\d[\\dA-Za-zА-Яа-яЁё]*(?:[/-]\\d[\\dA-Za-zА-Яа-яЁё]*)*(?:\\s*(?:к|корп\\.?|корпус|стр\\.?|строение|с|лит\\.?|литера)\\s*[\\dA-Za-zА-Яа-яЁё/-]+)?";
const EXPLICIT_HOUSE_RE = new RegExp(
  `(?:^|[\\s,;])(?:д\\.?|дом|house|h\\.?)\\s*(?:№|#)?\\s*${HOUSE_VALUE_PATTERN}(?=$|[\\s,;])`,
  "i",
);
const HOUSE_AT_SEGMENT_START_RE = new RegExp(
  `^(?:№|#)?\\s*${HOUSE_VALUE_PATTERN}(?=$|\\s)`,
  "i",
);
const HOUSE_AT_END_RE = new RegExp(
  `(?:^|\\s)(?:д\\.?\\s*)?${HOUSE_VALUE_PATTERN}$`,
  "i",
);

function hasExplicitHouseMarker(address: string): boolean {
  return EXPLICIT_HOUSE_RE.test(address);
}

function hasHouseAtSegmentStart(address: string): boolean {
  return address
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => HOUSE_AT_SEGMENT_START_RE.test(part));
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDateInput(value: unknown): string | null {
  const raw = normalizeString(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function normalizeTimeInput(value: unknown): string | null {
  const raw = normalizeString(value);
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return `${pad2(hours)}:${pad2(minutes)}`;
}

function parseLocalDateTime(visitDate: string, visitTime: string): Date | null {
  const date = normalizeDateInput(visitDate);
  const time = normalizeTimeInput(visitTime);
  if (!date || !time) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeCustomerCheckoutData(
  data: CheckoutData,
): Pick<CheckoutData, "customerName" | "phone"> {
  const customerName = normalizeString(data.customerName);
  const phone = normalizeString(data.phone);

  return {
    ...(customerName ? { customerName } : {}),
    ...(phone ? { phone } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
