/**
 * Базовая схема карточки
 * Минимальный набор слотов, от которого наследуются все остальные схемы
 */

import type { CardSchema } from "./types";

export const BASE_SCHEMA_VERSION = "1.0.0";

export const baseCardSchema: CardSchema = {
  id: "base",
  version: BASE_SCHEMA_VERSION,
  layout: "grid",

  slots: [
    {
      id: "image",
      component: "ImageSlot",
      position: 0,
      visible: true,
      required: true,
      props: {
        aspectRatio: "4/3",
        objectFit: "cover",
      },
    },
    {
      id: "title",
      component: "TitleSlot",
      position: 1,
      visible: true,
      required: true,
      props: {
        tag: "h3",
        lineClamp: 2,
      },
    },
    {
      id: "price",
      component: "PriceSlot",
      position: 2,
      visible: true,
      required: true,
      props: {
        currency: "₽",
        showOldPrice: false,
      },
    },
  ],

  styles: {
    card: "rounded-lg border bg-card text-card-foreground shadow-sm",
    container: "p-4 flex flex-col gap-2",
    header: "",
    body: "flex-1",
    footer: "mt-auto pt-2",
    image: "rounded-t-lg",
  },

  behavior: {
    clickable: true,
    hoverable: true,
    selectable: false,
    draggable: false,
    lazyLoad: true,
    prefetchOnHover: false,
  },

  animations: {
    hover: "transition-shadow duration-200",
  },
};

/**
 * Схема для e-commerce (расширяет базовую)
 */
export const ecommerceCardSchema: Partial<CardSchema> = {
  id: "ecommerce",
  extends: "base",

  slots: [
    {
      id: "rating",
      component: "RatingSlot",
      position: 2.5,
      visible: true,
      props: {
        showCount: true,
        size: "sm",
      },
      conditions: {
        showIf: (ctx) => {
          const reviewCount = ctx.product?.reviewCount;
          return typeof reviewCount === "number" && reviewCount > 0;
        },
      },
    },
    {
      id: "addToCart",
      component: "AddToCartButton",
      position: 10,
      visible: true,
      props: {
        variant: "default",
        size: "sm",
      },
    },
  ],

  styles: {
    card: "hover:shadow-md cursor-pointer",
  },

  behavior: {
    prefetchOnHover: true,
  },
};

/**
 * Схема для каталога (расширяет e-commerce)
 */
export const catalogCardSchema: Partial<CardSchema> = {
  id: "catalog",
  extends: "ecommerce",

  slots: [
    {
      id: "wishlist",
      component: "WishlistButton",
      position: 0.5,
      visible: true,
      props: {
        position: "top-right",
        variant: "ghost",
      },
    },
    {
      id: "quickView",
      component: "QuickViewButton",
      position: 9,
      visible: true,
      props: {
        variant: "outline",
        size: "sm",
      },
    },
  ],

  styles: {
    card: "group relative",
  },
};

/**
 * Варианты отображения
 */
export const listVariantSchema: Partial<CardSchema> = {
  id: "list-variant",
  layout: "list",

  styles: {
    card: "flex flex-row gap-4",
    container: "flex-1 py-2",
    image: "rounded-lg w-32 h-32 flex-shrink-0",
  },

  responsive: {
    mobile: {
      layout: "grid",
      styles: {
        card: "flex-col",
        image: "w-full h-auto",
      },
    },
  },
};

export const compactVariantSchema: Partial<CardSchema> = {
  id: "compact-variant",
  layout: "compact",

  slots: [
    { id: "quickView", visible: false, component: "", position: 0 },
    { id: "wishlist", visible: false, component: "", position: 0 },
  ],

  styles: {
    card: "rounded-md",
    container: "p-2 gap-1",
    image: "rounded-t-md",
  },
};

export const featuredVariantSchema: Partial<CardSchema> = {
  id: "featured-variant",
  layout: "featured",

  slots: [
    {
      id: "badge",
      component: "FeaturedBadge",
      position: 0.1,
      visible: true,
      props: {
        text: "Рекомендуем",
        variant: "primary",
      },
    },
  ],

  styles: {
    card: "border-2 border-primary shadow-lg",
    container: "p-6",
  },
};
