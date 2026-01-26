/**
 * Schema Composer
 * Композиция и слияние схем карточек
 */

import { cn } from "@/shared/lib/utils";
import { BASE_SCHEMA_VERSION } from "./base.schema";
import type {
    CardSchema,
    CardStyles,
    MergeOptions,
    ResponsiveOverrides,
    SlotConfig,
} from "./types";

// Опции по умолчанию
const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  strategy: "merge",
  slotStrategy: "position",
  stylesStrategy: "merge",
};

/**
 * Композиция массива схем в одну
 */
export function composeSchemas(
  schemas: (CardSchema | Partial<CardSchema>)[],
  options: Partial<MergeOptions> = {},
): CardSchema {
  if (schemas.length === 0) {
    throw new Error("[SchemaComposer] At least one schema is required");
  }

  const mergeOptions = { ...DEFAULT_MERGE_OPTIONS, ...options };

  // Начинаем с первой схемы как базы
  let result = normalizeSchema(schemas[0]);

  // Последовательно применяем остальные схемы
  for (let i = 1; i < schemas.length; i++) {
    const override = schemas[i];
    if (override) {
      result = mergeTwo(result, override, mergeOptions);
    }
  }

  // Финальная обработка слотов
  result.slots = processSlots(result.slots);

  return result;
}

/**
 * Нормализация частичной схемы до полной
 */
function normalizeSchema(schema: CardSchema | Partial<CardSchema>): CardSchema {
  return {
    id: schema.id || "unknown",
    version: schema.version || BASE_SCHEMA_VERSION,
    layout: schema.layout || "grid",
    slots: schema.slots || [],
    styles: schema.styles || {},
    animations: schema.animations,
    behavior: schema.behavior,
    responsive: schema.responsive,
    extends: schema.extends,
    meta: schema.meta,
  };
}

/**
 * Слияние двух схем
 */
function mergeTwo(
  base: CardSchema,
  override: Partial<CardSchema>,
  options: MergeOptions,
): CardSchema {
  return {
    id: override.id || base.id,
    version: override.version || base.version,
    extends: base.id,
    layout: override.layout ?? base.layout,

    // Слоты: умное слияние
    slots: mergeSlots(base.slots, override.slots || [], options.slotStrategy),

    // Стили: конкатенация или замена
    styles: mergeStyles(
      base.styles,
      override.styles || {},
      options.stylesStrategy,
    ),

    // Анимации: shallow merge
    animations: override.animations
      ? { ...base.animations, ...override.animations }
      : base.animations,

    // Поведение: shallow merge
    behavior: override.behavior
      ? { ...base.behavior, ...override.behavior }
      : base.behavior,

    // Responsive: deep merge
    responsive: mergeResponsive(base.responsive, override.responsive),

    // Meta: shallow merge
    meta: override.meta ? { ...base.meta, ...override.meta } : base.meta,
  };
}

/**
 * Слияние слотов
 */
function mergeSlots(
  baseSlots: SlotConfig[],
  overrideSlots: SlotConfig[],
  strategy: MergeOptions["slotStrategy"],
): SlotConfig[] {
  const slotMap = new Map<string, SlotConfig>();

  // Добавляем базовые слоты
  baseSlots.forEach((slot) => {
    slotMap.set(slot.id, { ...slot });
  });

  // Применяем override слоты
  overrideSlots.forEach((override) => {
    const existing = slotMap.get(override.id);

    if (existing) {
      // Обновляем существующий слот
      slotMap.set(override.id, mergeSlotConfig(existing, override));
    } else if (strategy === "append" || strategy === "position") {
      // Добавляем новый слот
      slotMap.set(override.id, { ...override });
    }
  });

  return Array.from(slotMap.values());
}

/**
 * Слияние конфигурации одного слота
 */
function mergeSlotConfig(
  base: SlotConfig,
  override: Partial<SlotConfig>,
): SlotConfig {
  return {
    ...base,
    ...override,
    // Props: deep merge
    props: {
      ...base.props,
      ...override.props,
    },
    // Conditions: merge
    conditions: override.conditions
      ? { ...base.conditions, ...override.conditions }
      : base.conditions,
  };
}

/**
 * Слияние стилей
 */
function mergeStyles(
  base: CardStyles,
  override: CardStyles,
  strategy: MergeOptions["stylesStrategy"],
): CardStyles {
  if (strategy === "replace") {
    return { ...base, ...override };
  }

  // strategy === 'merge' - конкатенация классов
  return {
    card: cn(base.card, override.card),
    container: cn(base.container, override.container),
    header: cn(base.header, override.header),
    body: cn(base.body, override.body),
    footer: cn(base.footer, override.footer),
    image: cn(base.image, override.image),
  };
}

/**
 * Слияние responsive переопределений
 */
function mergeResponsive(
  base?: ResponsiveOverrides,
  override?: ResponsiveOverrides,
): ResponsiveOverrides | undefined {
  if (!base && !override) return undefined;

  return {
    mobile: {
      ...base?.mobile,
      ...override?.mobile,
      styles: mergeStyles(
        base?.mobile?.styles || {},
        override?.mobile?.styles || {},
        "merge",
      ),
    },
    tablet: {
      ...base?.tablet,
      ...override?.tablet,
      styles: mergeStyles(
        base?.tablet?.styles || {},
        override?.tablet?.styles || {},
        "merge",
      ),
    },
    desktop: {
      ...base?.desktop,
      ...override?.desktop,
      styles: mergeStyles(
        base?.desktop?.styles || {},
        override?.desktop?.styles || {},
        "merge",
      ),
    },
  };
}

/**
 * Финальная обработка слотов
 * - Фильтрация невидимых
 * - Сортировка по position
 */
function processSlots(slots: SlotConfig[]): SlotConfig[] {
  return slots
    .filter((slot) => slot.visible !== false)
    .sort((a, b) => a.position - b.position);
}

/**
 * Утилита для создания частичной схемы
 */
export function createSchemaOverride(
  id: string,
  override: Omit<Partial<CardSchema>, "id">,
): Partial<CardSchema> {
  return {
    id,
    ...override,
  };
}

/**
 * Утилита для скрытия слотов
 */
export function hideSlots(slotIds: string[]): SlotConfig[] {
  return slotIds.map((id) => ({
    id,
    component: "",
    position: 0,
    visible: false,
  }));
}

/**
 * Утилита для переопределения props слота
 */
export function overrideSlotProps(
  slotId: string,
  props: Record<string, unknown>,
): SlotConfig {
  return {
    id: slotId,
    component: "",
    position: 0,
    visible: true,
    props,
  };
}
