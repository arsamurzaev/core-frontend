import React from "react";
/**
 * Типы для schema-driven архитектуры мультикаталога
 */

// Конфигурация слота
export interface SlotConfig {
  id: string;
  component: string;
  position: number;
  visible: boolean;
  required?: boolean;
  props?: Record<string, unknown>;
  conditions?: {
    showIf?: (context: SchemaContext) => boolean;
    hideIf?: (context: SchemaContext) => boolean;
  };
}

// Стили карточки
export interface CardStyles {
  card?: string;
  container?: string;
  header?: string;
  body?: string;
  footer?: string;
  image?: string;
}

// Анимации
export interface CardAnimations {
  hover?: string;
  enter?: string;
  exit?: string;
  loading?: string;
}

// Responsive переопределения
export interface ResponsiveOverrides {
  mobile?: Partial<CardSchema>;
  tablet?: Partial<CardSchema>;
  desktop?: Partial<CardSchema>;
}

// Поведение карточки
export interface CardBehavior {
  clickable?: boolean;
  hoverable?: boolean;
  selectable?: boolean;
  draggable?: boolean;
  lazyLoad?: boolean;
  prefetchOnHover?: boolean;
}

// Основная схема карточки
export interface CardSchema {
  id: string;
  extends?: string;
  version: string;
  layout: "grid" | "list" | "compact" | "featured";
  slots: SlotConfig[];
  styles: CardStyles;
  animations?: CardAnimations;
  behavior?: CardBehavior;
  responsive?: ResponsiveOverrides;
  meta?: Record<string, unknown>;
}

// Контекст для условий
export interface SchemaContext {
  product?: Record<string, unknown>;
  business?: Record<string, unknown>;
  businessType?: string;
  user?: Record<string, unknown>;
  features?: Record<string, boolean>;
  viewport?: "mobile" | "tablet" | "desktop";
}

// Опции слияния схем
export interface MergeOptions {
  strategy: "merge" | "replace" | "append";
  slotStrategy: "position" | "override" | "append";
  stylesStrategy: "merge" | "replace";
}

// Тип плагина бизнеса
export interface BusinessPlugin {
  id: string;
  name: string;
  description?: string;
  cardSchema: Partial<CardSchema>;
  slots?: Record<string, React.ComponentType<SlotProps>>;
  theme?: PluginTheme;
  features?: string[];
  onInit?: (context: PluginContext) => void;
  onDestroy?: (context: PluginContext) => void;
}

// Тема плагина
export interface PluginTheme {
  colors?: Record<string, string>;
  tokens?: Record<string, string>;
}

// Контекст плагина
export interface PluginContext {
  businessId: string;
  businessType: string;
}

// Props для слотов
export interface SlotProps {
  data: Record<string, unknown>;
  context: SchemaContext;
  className?: string;
}

// Результат валидации
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}
