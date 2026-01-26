/**
 * Schema Registry
 * Централизованное хранилище и управление схемами
 */

import {
    baseCardSchema,
    catalogCardSchema,
    compactVariantSchema,
    ecommerceCardSchema,
    featuredVariantSchema,
    listVariantSchema,
} from "./base.schema";
import { composeSchemas } from "./composer";
import type {
    BusinessPlugin,
    CardSchema,
    ValidationError,
    ValidationResult,
} from "./types";

// Пресеты - готовые комбинации схем
export const SCHEMA_PRESETS = {
  base: ["base"],
  ecommerce: ["base", "ecommerce"],
  catalog: ["base", "ecommerce", "catalog"],
  "catalog-list": ["base", "ecommerce", "catalog", "list-variant"],
  "catalog-compact": ["base", "ecommerce", "catalog", "compact-variant"],
  "catalog-featured": ["base", "ecommerce", "catalog", "featured-variant"],
} as const;

export type SchemaPreset = keyof typeof SCHEMA_PRESETS;

/**
 * Schema Registry Class
 */
class SchemaRegistryClass {
  private schemas = new Map<string, CardSchema | Partial<CardSchema>>();
  private plugins = new Map<string, BusinessPlugin>();
  private cache = new Map<string, CardSchema>();
  private initialized = false;

  constructor() {
    this.registerDefaults();
  }

  /**
   * Регистрация базовых схем
   */
  private registerDefaults(): void {
    if (this.initialized) return;

    // Базовые схемы
    this.register("base", baseCardSchema);
    this.register("ecommerce", ecommerceCardSchema);
    this.register("catalog", catalogCardSchema);

    // Варианты отображения
    this.register("list-variant", listVariantSchema);
    this.register("compact-variant", compactVariantSchema);
    this.register("featured-variant", featuredVariantSchema);

    this.initialized = true;
  }

  /**
   * Регистрация схемы
   */
  register(id: string, schema: CardSchema | Partial<CardSchema>): void {
    this.schemas.set(id, schema);
    this.invalidateCache();
  }

  /**
   * Регистрация плагина бизнеса
   */
  registerPlugin(plugin: BusinessPlugin): void {
    this.plugins.set(plugin.id, plugin);

    // Регистрируем схему плагина
    if (plugin.cardSchema) {
      this.register(`${plugin.id}-plugin`, {
        ...plugin.cardSchema,
        id: `${plugin.id}-plugin`,
      });
    }

    this.invalidateCache();
  }

  /**
   * Получение схемы по ID
   */
  get(id: string): CardSchema | Partial<CardSchema> | undefined {
    return this.schemas.get(id);
  }

  /**
   * Получение плагина по типу бизнеса
   */
  getPlugin(businessType: string): BusinessPlugin | undefined {
    return this.plugins.get(businessType);
  }

  /**
   * Проверка существования схемы
   */
  has(id: string): boolean {
    return this.schemas.has(id);
  }

  /**
   * Композиция схем по ID
   */
  compose(schemaIds: string[], overrides?: Partial<CardSchema>): CardSchema {
    const cacheKey = this.getCacheKey(schemaIds, overrides);

    // Проверяем кеш
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Собираем схемы
    const schemas = schemaIds
      .map((id) => this.get(id))
      .filter((s): s is CardSchema | Partial<CardSchema> => s !== undefined);

    if (schemas.length === 0) {
      throw new Error(
        `[SchemaRegistry] No valid schemas found for: ${schemaIds.join(", ")}`,
      );
    }

    // Добавляем overrides если есть
    if (overrides) {
      schemas.push(overrides);
    }

    // Композируем
    const composed = composeSchemas(schemas);

    // Кешируем
    this.cache.set(cacheKey, composed);

    return composed;
  }

  /**
   * Композиция из пресета
   */
  fromPreset(
    preset: SchemaPreset,
    overrides?: Partial<CardSchema>,
  ): CardSchema {
    const schemaIds = SCHEMA_PRESETS[preset];
    return this.compose([...schemaIds], overrides);
  }

  /**
   * Композиция для типа бизнеса
   */
  forBusinessType(
    businessType: string,
    variant: "default" | "list" | "compact" | "featured" = "default",
    overrides?: Partial<CardSchema>,
  ): CardSchema {
    const schemaIds: string[] = ["base", "ecommerce", "catalog"];

    // Добавляем схему плагина
    const pluginSchemaId = `${businessType}-plugin`;
    if (this.has(pluginSchemaId)) {
      schemaIds.push(pluginSchemaId);
    }

    // Добавляем вариант
    if (variant !== "default") {
      schemaIds.push(`${variant}-variant`);
    }

    return this.compose(schemaIds, overrides);
  }

  /**
   * Валидация схемы
   */
  validate(schema: CardSchema | Partial<CardSchema>): ValidationResult {
    const errors: ValidationError[] = [];

    // Проверка обязательных полей
    if (!schema.id) {
      errors.push({
        path: "id",
        message: "Schema ID is required",
        code: "REQUIRED_FIELD",
      });
    }

    // Проверка слотов
    if (schema.slots) {
      schema.slots.forEach((slot, index) => {
        if (!slot.id) {
          errors.push({
            path: `slots[${index}].id`,
            message: "Slot ID is required",
            code: "REQUIRED_FIELD",
          });
        }
        if (!slot.component && slot.visible !== false) {
          errors.push({
            path: `slots[${index}].component`,
            message: "Slot component is required for visible slots",
            code: "REQUIRED_FIELD",
          });
        }
        if (typeof slot.position !== "number") {
          errors.push({
            path: `slots[${index}].position`,
            message: "Slot position must be a number",
            code: "INVALID_TYPE",
          });
        }
      });

      // Проверка уникальности ID слотов
      const slotIds = schema.slots.map((s) => s.id);
      const duplicates = slotIds.filter((id, i) => slotIds.indexOf(id) !== i);
      if (duplicates.length > 0) {
        errors.push({
          path: "slots",
          message: `Duplicate slot IDs: ${duplicates.join(", ")}`,
          code: "DUPLICATE_ID",
        });
      }
    }

    // Проверка layout
    if (
      schema.layout &&
      !["grid", "list", "compact", "featured"].includes(schema.layout)
    ) {
      errors.push({
        path: "layout",
        message: `Invalid layout: ${schema.layout}`,
        code: "INVALID_VALUE",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Получение всех зарегистрированных схем
   */
  getAll(): Map<string, CardSchema | Partial<CardSchema>> {
    return new Map(this.schemas);
  }

  /**
   * Получение всех плагинов
   */
  getAllPlugins(): Map<string, BusinessPlugin> {
    return new Map(this.plugins);
  }

  /**
   * Очистка кеша
   */
  invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Полный сброс реестра
   */
  reset(): void {
    this.schemas.clear();
    this.plugins.clear();
    this.cache.clear();
    this.initialized = false;
    this.registerDefaults();
  }

  /**
   * Генерация ключа кеша
   */
  private getCacheKey(ids: string[], overrides?: Partial<CardSchema>): string {
    const idsKey = ids.join(":");
    const overridesKey = overrides ? JSON.stringify(overrides) : "";
    return `${idsKey}|${overridesKey}`;
  }

  /**
   * Экспорт схемы в JSON
   */
  exportSchema(schemaId: string): string {
    const schema = this.get(schemaId);
    if (!schema) {
      throw new Error(`[SchemaRegistry] Schema not found: ${schemaId}`);
    }
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Импорт схемы из JSON
   */
  importSchema(json: string): CardSchema {
    const schema = JSON.parse(json) as CardSchema;
    const validation = this.validate(schema);

    if (!validation.valid) {
      throw new Error(
        `[SchemaRegistry] Invalid schema: ${validation.errors.map((e) => e.message).join(", ")}`,
      );
    }

    this.register(schema.id, schema);
    return schema;
  }
}

// Singleton instance
export const schemaRegistry = new SchemaRegistryClass();

// Хук для React
export function useSchemaRegistry() {
  return schemaRegistry;
}
