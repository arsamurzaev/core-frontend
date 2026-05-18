# Catalog Runtime Contracts

Дата: 2026-05-17

## Цель

`core/catalog-runtime` — единственная точка, где storefront выбирает поведение под тип каталога: default, restaurant/cafe, wholesale/whosale и будущие сценарии. Расширения не должны менять базовую модель товара, корзины или checkout напрямую.

## Инварианты

- Runtime выбирается через `resolveCatalogRuntime(catalog)`.
- Расширение описывает только presentation, checkout, product card plugin, cart capabilities и slots.
- Расширение не импортирует `sandbox/**`.
- Product card runtime использует общий `ProductCardWithPlugins`, а базовая карточка сама считает price/availability через sellable/variant model.
- Slots получают готовые DTO/view models из core-слоя и не должны сами ходить в API за product/cart state без явной необходимости.
- `variantPickerOptions` достаточно для легкой карточки: runtime не обязан требовать `ProductWithDetailsDto`, чтобы показать варианты.

## Public Surface

- `CatalogExtension`
- `CatalogRuntime`
- `BrowserSlotProps`
- `CartCardActionSlotProps`
- `resolveCatalogRuntime`
- `useCatalogRuntime`
- `useCatalogRuntimeSlots`
- `useCatalogRuntimeCheckoutConfig`
- `ProductCardRuntime`

## Extension Rules

- `presentation` отвечает только за названия вкладок, тексты, поддержку брендов и вид категорий.
- `checkout` задает доступные и дефолтные методы оформления, но не валидирует заказ.
- `productCard` задает дополнительные строки/бейджи, но не пересчитывает цену и доступность.
- `slots.Browser` может заменить каталоговый browser для специфичного UX.
- `slots.CartCardAction` может заменить действие строки корзины, но должно работать с `CartItemView`, а не с сырым `CartItemDto`.

## Quality Gate

- `core/catalog-runtime/sandbox-boundary.test.ts`
- `core/catalog-runtime/resolve-catalog-runtime.test.ts`
- `core/catalog-runtime/catalog-runtime-utils.test.ts`
- `core/modules/product/plugins/build-model.test.ts`
- `bun run prod:check --skip-api`
