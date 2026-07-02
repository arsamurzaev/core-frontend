# Frontend Module Public API

Дата: 2026-07-02

## Цель

Этот документ фиксирует публичную поверхность `core/modules/*` и первый bridge-слой. Он нужен, чтобы большой редизайн менял визуальные компоненты, slots и tokens, а не ломал доменную логику через глубокие импорты.

## Правила

- `app`, `core/catalog-runtime`, `core/bridges`, `core/views` и `core/widgets` импортируют модули только через public entrypoints.
- Public entrypoint модуля: `@/core/modules/<module>`.
- Исключение для вложенного публичного подмодуля: `@/core/modules/product/editor`.
- Все остальное внутри `core/modules/<module>/**` считается internal implementation.
- Если сценарий связывает два домена и не должен принадлежать одному из них, он идет в `core/bridges/<domain-a>-<domain-b>`.
- Bridge может импортировать public API модулей и `shared`, но не должен импортировать `app`, `core/widgets`, `core/views` или `core/catalog-runtime`.
- Новый export в public API добавляется только если им пользуются снаружи модуля или он является явным contract/helper-типом.

## Public Surfaces

### `@/core/modules/browser`

Назначение: состояние и поведение storefront browser.

Public model:
- query state для browser/filter/search;
- category scroll helpers;
- active category intersection hooks;
- click activation delay hook.

Public UI: нет.

Internal: детали DOM-наблюдения и эвристики скролла, если они не нужны внешнему экрану.

### `@/core/modules/cart`

Назначение: корзина, cart context, cart line selection, cart item view models и cart-facing UI controls.

Public model:
- `useCart`, cart context contracts;
- `CartItemView`, cart pricing/totals view helpers;
- cart line selection and keys через `CartLineSelection`, `NormalizedCartLineSelection`, `buildCartLineSelectionKey`;
- cart modifier line types через `CartLineModifierSelection`;
- cart product selection helpers;
- cart public link/share/query keys;
- cart product control state and max quantity helpers.

Public UI:
- cart card and card action;
- product card/drawer footer actions;
- product variant drawer;
- `useCartProductControls`.

Internal:
- realtime/cache/storage/mutations/provider internals;
- raw optimistic update machinery;
- low-level cart line key normalization unless exported via cart line selection.

Bridge candidates:
- product-specific cart quantity/selection orchestration belongs in `@/core/bridges/product-cart`.

### `@/core/modules/catalog-price-list`

Назначение: price list admin/editor capabilities.

Public model:
- price list API adapter for product editor flows.

Public UI:
- product price list create prices field;
- product price list prices field;
- product price list settings drawer.

Internal:
- form-level details that are only needed inside the price-list editor implementation.

### `@/core/modules/category`

Назначение: category display models and category cards.

Public model:
- category card view model;
- category display helpers.

Public UI:
- category card;
- category card skeleton.

Internal:
- category admin/editor behavior lives outside this module unless it becomes a reusable category contract.

### `@/core/modules/integration`

Назначение: integration-facing user feedback and sync helpers.

Public model:
- iiko sync progress toast launcher;
- MoySklad sync progress toast launcher.

Public UI: нет.

Internal:
- integration-specific API orchestration that belongs to backend/generated clients or admin widgets.

### `@/core/modules/product`

Назначение: product domain read/display contracts, product actions and product card runtime plugin contracts.

Public model:
- product card layout/view/variant helpers;
- product drawer preview and instant events;
- product variant label, availability, ordering, selection model;
- product price-list visibility helpers;
- sale units;
- MoySklad product model;
- product card view mode hook.

Public UI/entities:
- product card, card skeleton, card with plugins;
- product link;
- product DOM budget content;
- product action UI and action model exports.

Public contracts:
- product plugin contracts.

Internal:
- product editor internals live under the explicit submodule `@/core/modules/product/editor`;
- one-off widget state should stay in `core/widgets/*`.

### `@/core/modules/product/editor`

Назначение: typed admin/editor submodule for create/edit product flows.

Public model/lib:
- product form values/defaults/config;
- product variants and sale-unit editor models;
- category editor state helpers used by product/category admin flows;
- upload helpers and upload state;
- brand slug helpers;
- select field helpers.

Public UI:
- product editor drawer content;
- product images section/grid item;
- create product brand/category/discount fields;
- category selection/editor/image drawers;
- product variants and sale units fields;
- upload progress toast.

Internal:
- implementation details that are only used by one field/component and do not need cross-widget reuse.

### `@/core/modules/product-modifier`

Назначение: product modifier configuration, selection and picker UI.

Public model:
- modifier API adapter;
- modifier types;
- selection helpers;
- cart modifier payload builder.

Public UI:
- modifier bindings field;
- modifier picker.

Internal:
- field layout details that are only used inside the modifier admin/editor surfaces.

## Bridges

### `@/core/bridges/product-cart`

Назначение: связать product purchase selection с cart line selection без переноса этой логики в `product` или `cart`.

Public API:
- `buildProductCartSelection`;
- `findProductCartLineBySelection`;
- `getProductCartLineMaxQuantity`;
- `ProductCartSelection`.

Правило развития: сюда можно переносить только логику связи product/cart. UI, toast, drawer state и product-specific rendering остаются в widgets/views.

## Следующие Кандидаты На Уборку

- Перевести оставшиеся module-to-module deep imports на public entrypoints там, где это не раздувает public API.
- Разделить `cart` UI controls и product-specific cart behavior, если `cart` начнет слишком много знать о `product`.
- Описать contracts для `catalog-runtime` slots поверх уже существующего `docs/catalog-runtime-contracts.md`.
