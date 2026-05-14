"use client";

import {
  type CatalogCurrentDto,
  UpdateCatalogDtoReqAllowedModesItem,
  UpdateCatalogDtoReqDefaultMode,
} from "@/shared/api/generated/react-query";
import { getCatalogTypeCode } from "@/shared/lib/catalog-type";

export type CatalogExperienceMode =
  (typeof UpdateCatalogDtoReqDefaultMode)[keyof typeof UpdateCatalogDtoReqDefaultMode];

export interface CatalogExperienceOption {
  value: CatalogExperienceMode;
  title: string;
  description: string;
}

type CatalogExperienceSource = Pick<CatalogCurrentDto, "type"> | null | undefined;

export const DEFAULT_CATALOG_EXPERIENCE_MODE =
  UpdateCatalogDtoReqDefaultMode.DELIVERY;
const HALL_CATALOG_EXPERIENCE_MODE = UpdateCatalogDtoReqDefaultMode.HALL;
const CATALOG_EXPERIENCE_HALL_TYPE_CODES = new Set(["restaurant", "cafe"]);

export const CATALOG_EXPERIENCE_OPTIONS: CatalogExperienceOption[] = [
  {
    value: UpdateCatalogDtoReqDefaultMode.DELIVERY,
    title: "Доставка",
    description:
      "Клиент собирает корзину и может отправить или поделиться заказом.",
  },
  {
    value: UpdateCatalogDtoReqDefaultMode.BROWSE,
    title: "Только просмотр",
    description: "Каталог работает без корзины и без кнопок заказа.",
  },
  {
    value: UpdateCatalogDtoReqDefaultMode.HALL,
    title: "Заказ в зале",
    description:
      "Клиент собирает заказ в корзину, чтобы показать его в ресторане. Без ссылки и отправки.",
  },
];

const CATALOG_EXPERIENCE_OPTION_MAP = new Map(
  CATALOG_EXPERIENCE_OPTIONS.map((option) => [option.value, option]),
);

export function isCatalogExperienceMode(
  value: unknown,
): value is CatalogExperienceMode {
  return CATALOG_EXPERIENCE_OPTION_MAP.has(value as CatalogExperienceMode);
}

export function canUseHallCatalogExperience(
  catalog: CatalogExperienceSource,
): boolean {
  return CATALOG_EXPERIENCE_HALL_TYPE_CODES.has(getCatalogTypeCode(catalog));
}

export function getCatalogExperienceOptions(
  catalog?: CatalogExperienceSource,
): CatalogExperienceOption[] {
  if (canUseHallCatalogExperience(catalog)) {
    return CATALOG_EXPERIENCE_OPTIONS;
  }

  return CATALOG_EXPERIENCE_OPTIONS.filter(
    (option) => option.value !== HALL_CATALOG_EXPERIENCE_MODE,
  );
}

export function getCatalogExperienceAvailableModes(
  catalog?: CatalogExperienceSource,
): CatalogExperienceMode[] {
  return getCatalogExperienceOptions(catalog).map((option) => option.value);
}

export function normalizeCatalogExperienceModes(
  values?: readonly string[] | null,
  options: {
    availableModes?: readonly CatalogExperienceMode[];
  } = {},
): CatalogExperienceMode[] {
  const availableModes = options.availableModes?.length
    ? options.availableModes
    : CATALOG_EXPERIENCE_OPTIONS.map((option) => option.value);
  const normalized = Array.from(
    new Set(
      (values ?? [])
        .filter(isCatalogExperienceMode)
        .filter((mode) => availableModes.includes(mode)),
    ),
  );

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    availableModes.includes(DEFAULT_CATALOG_EXPERIENCE_MODE)
      ? DEFAULT_CATALOG_EXPERIENCE_MODE
      : (availableModes[0] ?? DEFAULT_CATALOG_EXPERIENCE_MODE),
  ];
}

export function resolveCatalogExperienceDefaultMode(
  value: unknown,
  allowedModes: CatalogExperienceMode[],
): CatalogExperienceMode {
  if (
    isCatalogExperienceMode(value) &&
    allowedModes.includes(value)
  ) {
    return value;
  }

  return allowedModes[0] ?? DEFAULT_CATALOG_EXPERIENCE_MODE;
}

export function getCatalogExperienceOption(
  mode: CatalogExperienceMode,
): CatalogExperienceOption {
  return (
    CATALOG_EXPERIENCE_OPTION_MAP.get(mode) ??
    CATALOG_EXPERIENCE_OPTION_MAP.get(DEFAULT_CATALOG_EXPERIENCE_MODE)!
  );
}

export function buildCatalogExperienceSummary(
  params: {
    allowedModes: CatalogExperienceMode[];
    defaultMode: CatalogExperienceMode;
  },
): {
  badge: string;
  description: string;
} {
  const allowedTitles = params.allowedModes.map(
    (mode) => getCatalogExperienceOption(mode).title,
  );
  const defaultTitle = getCatalogExperienceOption(params.defaultMode).title;

  if (allowedTitles.length === 1) {
    return {
      badge: allowedTitles[0] ?? getCatalogExperienceOption(DEFAULT_CATALOG_EXPERIENCE_MODE).title,
      description: `По умолчанию открывается: ${defaultTitle}.`,
    };
  }

  if (allowedTitles.length === 2) {
    return {
      badge: `${allowedTitles[0]} и ${allowedTitles[1]}`,
      description: `По умолчанию открывается: ${defaultTitle}.`,
    };
  }

  return {
    badge: "Несколько сценариев",
    description: `По умолчанию открывается: ${defaultTitle}.`,
  };
}

export function getCatalogExperienceDefaultValues(catalog: CatalogCurrentDto): {
  allowedModes: CatalogExperienceMode[];
  defaultMode: CatalogExperienceMode;
} {
  const availableModes = getCatalogExperienceAvailableModes(catalog);
  const allowedModes = normalizeCatalogExperienceModes(
    catalog.settings?.allowedModes,
    { availableModes },
  );
  const defaultMode = resolveCatalogExperienceDefaultMode(
    catalog.settings?.defaultMode,
    allowedModes,
  );

  return {
    allowedModes,
    defaultMode,
  };
}

export const CATALOG_EXPERIENCE_ALLOWED_MODE_VALUES =
  CATALOG_EXPERIENCE_OPTIONS.map(
    (option) => option.value,
  ) as (typeof UpdateCatalogDtoReqAllowedModesItem)[keyof typeof UpdateCatalogDtoReqAllowedModesItem][];
