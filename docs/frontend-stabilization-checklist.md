# Frontend Stabilization Checklist

Дата: 2026-05-17

## Summary

Цель: привести storefront-фронтенд к тому же уровню устойчивости, который мы строим на backend: один источник правил для товара, вариаций, цены, остатков, корзины и capabilities, без дублирования бизнес-логики по виджетам.

Фокус первой итерации: `../frontend`. Dashboard разбираем отдельным чеклистом, потому что там другой сценарий: админка, авторизация, формы управления и diagnostics.

## Core Invariants

- [x] `Product` на фронте отображается как карточка, а продаваемая единица всегда выводится через sellable/variant model.
- [x] `Product.price` не используется как главный источник цены, если у товара есть реальные вариации.
- [x] `price=null` означает неизвестную цену: на карточке товара цену не показываем, в корзине выводим `?`.
- [x] `stock=null` означает остаток не отслеживается: можно добавлять без лимита.
- [x] `stock=0` означает нет в наличии.
- [x] `stock>0` означает ограниченный остаток.
- [x] Matrix-товар без выбранной вариации не отправляется в корзину напрямую.
- [x] Simple-товар может добавляться без явного `variantId`, backend выберет hidden default variant.
- [x] Capability скрывает UI и submit-поведение, но не заставляет фронт удалять сохраненные данные.
- [x] Generated API не редактируется руками.

## 1. Safety Layer

- [x] Синхронизировать `docs/architecture.md` с текущими backend-инвариантами.
- [x] Оставить `core/architecture-boundaries.test.ts` обязательным quality gate.
- [x] Оставить `core/text-encoding.test.ts` обязательным quality gate.
- [x] Оставить `app/design-tokens.test.ts` обязательным fast quality gate.
- [x] Добавить report по deep imports из widgets в domain modules.
- [x] Зафиксировать публичные entrypoints:
  - `core/modules/product`;
  - `core/modules/product/editor`;
  - `core/modules/cart`;
  - `core/modules/category`;
  - `shared/capabilities`.
- [x] Запретить новым widgets импортировать внутренние файлы соседних модулей в обход public entrypoint.
- [x] Добавить frontend quality gate скрипт по аналогии с backend `prod:check`.

## 2. API Contract And Generated Client

- [x] Использовать актуальный backend OpenAPI как единственный источник generated API.
- [x] Прогонять `npm run api:gen` после backend-изменений DTO.
- [x] Проверять diff generated API перед коммитом.
- [x] Не редактировать `shared/api/generated/**` вручную.
- [x] Проверить DTO для:
  - product card;
  - product variants;
  - cart item;
  - capabilities;
  - integration settings.
- [x] Добавить короткую инструкцию в docs: как обновлять API после backend-сборки.

## 3. Product Card And Sellable View

- [x] Ввести единый frontend sellable adapter для карточки товара.
- [x] Карточка берет цену из sellable/variant model, а не напрямую из legacy `Product.price`.
- [x] Если у товара есть реальные вариации, показывать:
  - выбранную вариацию;
  - первую доступную вариацию;
  - или диапазон цены, если вариантов несколько и цены разные.
- [x] Если цены нет, не выводить price block на карточке товара.
- [x] Скидку считать только когда известны обе цены.
- [x] Цены отображать целыми числами, кроме сценариев торговых баз, где дробность нужна осознанно.
- [x] Product drawer использует тот же sellable/variant price adapter, что и карточка товара.
- [x] Статус доступности выводить по variant-aware правилам.
- [x] Добавить тесты на:
  - `price=null`;
  - `price=0`;
  - positive price;
  - несколько вариаций;
  - legacy `Product.price` при наличии вариаций.

## 4. Variant Selection And Cart Add

- [x] Вынести общую availability model для variant option/product variant.
- [x] Вынести общий resolver выбора variant id для карточки и product drawer.
- [x] Сделать один selection state для:
  - product drawer;
  - кнопки `+` на карточке;
  - variant drawer;
  - payload добавления в корзину.
- [x] При нажатии `+` на matrix-товар открывать `AppDrawer` с вариациями.
- [x] В drawer должна быть явная возможность закрытия.
- [x] Если вариаций нет или они скрыты capability, показывать корректное состояние без ошибки.
- [x] Не отправлять `POST /cart/current/items` без `variantId`, если backend требует выбор вариации.
- [x] Disabled/out-of-stock вариации показывать, но не давать выбрать.
- [x] `stock=null` не должен блокировать добавление и увеличение количества.
- [x] `stock=0` должен блокировать добавление.
- [x] Добавить тесты на:
  - simple product add;
  - matrix product opens drawer;
  - selected variant payload;
  - close drawer;
  - unlimited stock;
  - out of stock.

## 5. Cart Drawer And Cart Item View

- [x] Cart item должен использовать snapshot/sellable view, а не пересчитывать цену из product fields.
- [x] Если цена неизвестна, показывать `?`.
- [x] Количество ограничивать только если `stock` является числом.
- [x] Для `stock=null` не показывать ложное ограничение `0`.
- [x] Variant label должен быть стабилен и одинаков в карточке, drawer и корзине.
- [x] Удаление/изменение количества не должно зависеть от beta fields.
- [x] SSE/invalidations должны обновлять только cart-related query state.
- [x] Добавить тесты на формат cart item, unknown price и quantity controls.

## 6. Product Editor Unification

- [x] Объединить create/edit product формы вокруг общего editor model.
- [x] Вынести payload builders для:
  - create product;
  - update product;
  - variant update;
  - sale unit price update;
  - category/type/brand fields.
- [x] Empty stock input должен отправлять `null`.
- [x] `0` в stock input должен отправлять именно `0`.
- [x] Цена вариации должна быть доступна и без единиц продаж.
- [x] Поле цены должно принимать целые числа по умолчанию.
- [x] Product type можно менять и очищать, если backend это разрешает.
- [x] Capability-off режим скрывает beta поля и не отправляет beta payload.
- [x] Валидация create/edit товара учитывает `canUseProductVariants` и не блокирует сохранение из-за скрытой матрицы вариаций.
- [x] При отключенных вариациях скрытые variant price/combination поля не участвуют в проверке формы.
- [x] При повторном включении capability сохраненные данные должны корректно подхватываться.
- [x] Edit payload не очищает product type и type-scoped attributes при выключенной capability.
- [x] Добавить тесты на create/edit payload и преобразование form state.

## 7. Capabilities Layer

- [x] Использовать capability adapter вместо разбросанных raw checks.
- [x] Добавить явные helpers:
  - `canShowVariants`;
  - `canShowSaleUnits`;
  - `canShowMoySklad`;
  - `canUseInternalInventory`;
  - `canShowBetaField`.
- [x] При disabled capability не показывать beta UI.
- [x] При disabled capability не формировать beta submit payload.
- [x] При disabled capability не подставлять beta defaults в форму.
- [x] Данные, пришедшие с backend, не должны ломать UI даже если capability выключена.
- [x] Добавить тесты на capability matrix.

## 8. Catalog Runtime And Extensions

- [x] Документировать runtime contracts для catalog extensions.
- [x] Проверить default, wholesale и restaurant flows.
- [x] Runtime extension не должен импортировать sandbox.
- [x] Product card runtime должен работать с variant-aware price/action.
- [x] Extension slots должны получать готовые view models, а не сырые generated DTO.
- [x] Добавить tests/smoke для основных runtime presets.

## 9. Frontend Quality Gate

- [x] Добавить `prod:check` или `frontend:check`.
- [x] В quality gate включить:
  - `npm run api:gen`;
  - `npm run lint`;
  - `npm run test:run`;
  - `npm run build`.
- [x] Отдельно проверить архитектурные тесты.
- [x] Отдельно проверить text encoding test.
- [x] Добавить инструкцию запуска перед production deploy.

## 10. Execution Order

1. API/generated sync.
2. Frontend architecture entrypoints.
3. Variant selection and cart add.
4. Product card sellable view.
5. Cart drawer hardening.
6. Product editor unification.
7. Capabilities adapter.
8. Catalog runtime checks.
9. Full frontend quality gate.

## Test Plan

- [x] `npm run api:gen`
- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
- [x] Targeted tests for product card pricing.
- [x] Targeted tests for variant drawer and cart add.
- [x] Targeted tests for product editor payload builders.
- [x] Targeted tests for capabilities.
- [ ] Manual smoke:
  - product without price;
  - product with simple hidden default variant;
  - product with matrix variants;
  - product with `stock=null`;
  - product with `stock=0`;
  - cart item with unknown price;
  - capability variants off;
  - capability variants on.

## Tomorrow Notes (2026-05-19)

- [x] Investigate infinite rerender in `VirtualizedCategoryProducts` / `CategorySectionHeading` after category spacing virtualization changes.
  - Reproduction: catalog page with category sections; render overlay shows thousands of renders.
  - Suspects: `rowVirtualizer.measureElement`, the `rowVirtualizer.measure()` effect tied to `rows`, and dynamic row/header measurement after adding category top gaps.
  - First pass: stabilize row data and measurement dependencies, then check whether section spacing can use fixed estimates without re-measuring every render.
  - Fixed: `rowVirtualizer.measure()` now depends on a stable row measurement key instead of the `rows` array reference.

## Assumptions

- В этом чеклисте работаем только со storefront `../frontend`.
- Dashboard будет отдельным этапом.
- Backend уже дает корректные DTO и не присылает beta data при выключенных beta capabilities.
- Большой редизайн не делаем: сначала стабилизируем правила, payloads и boundary.
- Existing UI style сохраняем, меняем только проблемные места.
