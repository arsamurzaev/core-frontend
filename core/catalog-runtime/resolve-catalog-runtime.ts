import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import {
  CHECKOUT_METHODS,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type { CatalogLike } from "@/shared/lib/utils";
import type {
  ProductCardPluginConfig,
  ResolvedProductCardPlugin,
} from "@/core/modules/product/plugins/contracts";
import type {
  CatalogExtension,
  CatalogPresentationConfig,
  CatalogRuntime,
} from "./contracts";
import { CATALOG_EXTENSIONS } from "./registry";

const DEFAULT_CART_COMMENT_PLACEHOLDER =
  "Укажите пожелания к заказу: характеристики, замену, упаковку, доставку или другие важные детали.";

const CART_COMMENT_PLACEHOLDERS_BY_CATALOG_TYPE: Record<string, string> = {
  beauty:
    "Укажите оттенок, тип кожи или волос и пожелания. Например: тон 02, кожа чувствительная, шампунь без сильной отдушки.",
  clothes:
    "Укажите размеры, цвет и пожелания по посадке. Например: футболка S, джинсы 28, черный цвет, нужна свободная посадка.",
  food:
    "Укажите пожелания по продуктам, замене или доставке. Например: спелые авокадо, без кинзы, если нет моцареллы - заменить на буррату.",
  gifts:
    "Укажите повод, кому подарок и пожелания к упаковке. Например: подарок маме на день рождения, нежная упаковка, открытка с текстом.",
  home:
    "Укажите желаемые характеристики для дома. Например: серый плед, хлопок, размер 200x220, без яркого принта.",
  restaurant:
    "Укажите пожелания к блюдам, приборам и времени. Например: без лука, соус отдельно, приборы на 2 персоны, доставка к 19:00.",
  tech:
    "Укажите модель, совместимость, цвет или комплектацию. Например: чехол для iPhone 15, черный, нужна быстрая зарядка USB-C.",
  wholesale:
    "Укажите объем, фасовку, реквизиты или условия поставки. Например: 10 коробок, по 12 шт., нужна счет-фактура и доставка до склада.",
};

const DEFAULT_PRESENTATION: CatalogPresentationConfig = {
  catalogTabLabel: "Каталог",
  categoryAdminCreateDescription:
    "Создайте новую категорию, чтобы она сразу появилась в каталоге и в карточках выбора.",
  categoryAdminEditDescription:
    "Измените название, описание или изображение категории. Обновление сразу попадет в каталог.",
  categoryCardVariant: "default",
  copySuccessMessage: "Ссылка скопирована в буфер обмена",
  shareButtonLabel: "Поделиться каталогом",
  supportsBrands: true,
  supportsCategoryDetails: true,
};

const DEFAULT_PRODUCT_CARD_PLUGIN_CONFIG: ProductCardPluginConfig = {
  attributes: [],
  badges: [],
  showVariants: true,
};

const PRODUCT_CARD_PLUGIN_CONFIGS: Record<string, ProductCardPluginConfig> = {
  cafe: {
    attributes: [
      {
        key: "cafe_bean_origin",
        fallbackLabel: "Размер зерна",
        fallbackValue: "Не указан",
      },
    ],
    badges: ["Cafe"],
    showVariants: true,
  },
  cloth: {
    attributes: [
      {
        key: "outerwear_size",
        fallbackLabel: "Размер",
        fallbackValue: "Не указан",
      },
    ],
    badges: ["Cloth"],
    showVariants: true,
  },
};

function normalizeMethods(
  methods: CheckoutMethod[] | undefined,
  fallback: CheckoutMethod[],
): CheckoutMethod[] {
  const source = methods?.length ? methods : fallback;
  return source.filter((method, index, list) => {
    return CHECKOUT_METHODS.includes(method) && list.indexOf(method) === index;
  });
}

function resolveExtension(typeCode: string): CatalogExtension | null {
  return (
    CATALOG_EXTENSIONS.find((extension) => {
      return Array.isArray(extension.typeCode)
        ? extension.typeCode.includes(typeCode)
        : extension.typeCode === typeCode;
    }) ?? null
  );
}

function resolveProductCardPlugin(
  typeCode: string,
  extension: CatalogExtension | null,
): ResolvedProductCardPlugin {
  const config =
    extension?.productCard ??
    PRODUCT_CARD_PLUGIN_CONFIGS[typeCode] ??
    DEFAULT_PRODUCT_CARD_PLUGIN_CONFIG;

  return {
    key: typeCode || "default",
    attributes: config.attributes,
    badges: config.badges ?? [],
    showVariants: config.showVariants ?? true,
  };
}

function getCatalogExtensionPrimaryTypeCode(
  extension: CatalogExtension | null,
): string {
  if (!extension) {
    return "";
  }

  return Array.isArray(extension.typeCode)
    ? (extension.typeCode[0] ?? "")
    : extension.typeCode;
}

function resolveCartCommentPlaceholder(
  typeCode: string,
  extension: CatalogExtension | null,
): string {
  const primaryTypeCode = getCatalogExtensionPrimaryTypeCode(extension);

  return (
    extension?.checkout?.commentPlaceholder ??
    CART_COMMENT_PLACEHOLDERS_BY_CATALOG_TYPE[typeCode] ??
    CART_COMMENT_PLACEHOLDERS_BY_CATALOG_TYPE[primaryTypeCode] ??
    DEFAULT_CART_COMMENT_PLACEHOLDER
  );
}

export function resolveCatalogRuntime(
  catalog?: CatalogLike | Pick<CatalogCurrentDto, "type"> | null,
): CatalogRuntime {
  const typeCode = getCatalogTypeCode(catalog);
  const extension = resolveExtension(typeCode);
  const availableMethods = normalizeMethods(
    extension?.checkout?.availableMethods,
    ["DELIVERY", "PICKUP"],
  );
  const defaultEnabledMethods = normalizeMethods(
    extension?.checkout?.defaultEnabledMethods,
    [],
  ).filter((method) => availableMethods.includes(method));

  return {
    extension,
    typeCode,
    presentation: {
      ...DEFAULT_PRESENTATION,
      ...extension?.presentation,
    },
    checkout: {
      availableMethods,
      defaultEnabledMethods,
      commentPlaceholder: resolveCartCommentPlaceholder(typeCode, extension),
    },
    productCard: resolveProductCardPlugin(typeCode, extension),
    cart: {
      supportsManagerOrder: Boolean(extension?.cart?.supportsManagerOrder),
    },
    slots: {
      ...extension?.slots,
    },
  };
}
