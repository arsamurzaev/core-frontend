# Catalog Runtime Contracts

Дата: 2026-05-17

## Цель

`core/catalog-runtime` — единственная точка, где storefront выбирает поведение под тип каталога: default, restaurant/cafe, wholesale/whosale и будущие сценарии. Расширения не должны менять базовую модель товара, корзины или checkout напрямую.

## Инварианты

- Runtime выбирается через `resolveCatalogRuntime(catalog)`.
- Server-only storefront theme scope выбирается через `core/catalog-runtime/server`, чтобы не подтягивать runtime slots в server layout.
- Расширение описывает только manifest metadata, presentation, checkout, theme preset, product card plugin, cart capabilities и slots.
- Расширение не импортирует `sandbox/**`.
- Product card runtime использует общий `ProductCardWithPlugins`, а базовая карточка сама считает price/availability через sellable/variant model.
- Slots получают готовые DTO/view models из core-слоя и не должны сами ходить в API за product/cart state без явной необходимости.
- Runtime extension slots must not import generated/server API directly; they receive data via slot props or compose public module/widget contracts.
- `variantPickerOptions` достаточно для легкой карточки: runtime не обязан требовать `ProductWithDetailsDto`, чтобы показать варианты.

## Public Surface

- `CatalogExtension`
- `CatalogRuntime`
- `CatalogRuntimeManifest`
- `CatalogThemePreset`
- `BrowserSlotProps`
- `CartCardActionSlotProps`
- `resolveCatalogRuntime`
- `useCatalogRuntime`
- `useCatalogRuntimeSlots`
- `useCatalogRuntimeCheckoutConfig`
- `ProductCardRuntime`

## Contract Files

- `metadata-contracts.ts`: pure presentation, checkout, theme and manifest contracts. This file must not import React, slots, registry or runtime resolver.
- `slot-contracts.ts`: React slot props and slot component map.
- `runtime-contracts.ts`: full `CatalogExtension` and `CatalogRuntime` composition contract.
- `order-policies.ts`: pure runtime order policy helpers for preorder, manager orders and custom cart card actions.
- `storefront-composition.ts`: server/client-safe presentation mode helpers for storefront composition decisions.
- `contracts.ts`: compatibility facade for public type exports.
- `server.ts`: server-safe facade for theme/metadata helpers; it must not pull runtime registry or client hooks.

## Extension Rules

- `manifest` задает id, человекочитаемое название и analytics event ids; capabilities, slots и policies внутри runtime manifest выводятся из уже resolved поведения.
- `presentation` отвечает только за названия вкладок, тексты, поддержку брендов и вид категорий.
- `checkout` задает доступные и дефолтные методы оформления, но не валидирует заказ.
- `theme` задает preset для storefront scope и будущих semantic token overrides.
- `productCard` задает дополнительные строки/бейджи, но не пересчитывает цену и доступность.
- `slots.Browser` может заменить каталоговый browser для специфичного UX.
- `slots.CartCardAction` может заменить действие строки корзины, но должно работать с `CartItemView`, а не с сырым `CartItemDto`.

## Runtime Manifest

`runtime.manifest` — это typed summary для будущих мостов, аналитики и админских экранов. Он не является вторым источником поведения: `capabilities`, `slots` и `policies` собираются из `presentation`, `checkout`, `cart`, `productCard` и `slots`, чтобы не разъехаться с фактическим UI.

Текущие manifest ids:

- `default`
- `restaurant`
- `wholesale`

`BUSINESS_CARD` сейчас является `settings.presentationMode`, а не runtime extension. Такой каталог использует default runtime contract, но storefront composition скрывает каталоговую часть и корзину.
Storefront decisions for this mode live in `core/catalog-runtime/storefront-composition.ts`, so route/view/form code does not check `isBusinessCardCatalog` directly.

## Quality Gate

- `core/catalog-runtime/sandbox-boundary.test.ts`
- `core/catalog-runtime/catalog-runtime-compatibility.test.ts`
- `core/catalog-runtime/catalog-runtime-slot-contracts.test.ts`
- `core/catalog-runtime/resolve-catalog-runtime.test.ts`
- `core/catalog-runtime/catalog-runtime-utils.test.ts`
- `core/modules/product/plugins/build-model.test.ts`
- `bun run prod:check --skip-api`
