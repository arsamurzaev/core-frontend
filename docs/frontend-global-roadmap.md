# Frontend Global Roadmap

Дата: 2026-07-02

## Цель

Подготовить storefront/admin-часть фронта к большому редизайну и росту проекта без перевода всего приложения в JSON. Основной путь: типизированные модули, публичные entrypoints, `catalog-runtime` как система расширений, дизайн-система с токенами и строгие проверки границ.

## Что Я Хочу Сделать С Фронтом

1. Закрепить архитектурные границы: `app` собирает приложение, `core` хранит бизнес-модули/виджеты/runtime, `shared` остается фундаментом без знания о `core`.
2. Превратить `catalog-runtime` в полноценный слой расширений: контракты, slots, capabilities, typed registry, runtime presets, тесты совместимости.
3. Разделить модули по публичным API: `product`, `cart`, `category`, `browser`, `integration`, `product-modifier`, `catalog-price-list`.
4. Убрать прямые глубокие импорты между большими частями фронта там, где их можно заменить на public entrypoints.
5. Описать UI как дизайн-систему: semantic tokens, базовые primitives, компоненты сценариев, правила темизации и плотности интерфейса.
6. Подготовить редизайн без массового переписывания логики: заменить внешний вид через tokens/components/slots, а доменную логику оставить в модулях.
7. Сделать расширения по типам каталога: restaurant, wholesale, business-card и будущие типы через runtime contracts, а не через условные импорты по всему UI.
8. Выделить мосты между независимыми модулями: например `product -> productCartBridge -> cart`, когда прямой независимости не хватает.
9. Добавить event/action bus для аналитики и трассировки пользовательских действий без размазывания аналитики по компонентам.
10. Усилить API-sync: generated API не редактируется руками, quality gate ловит устаревшие клиенты и обратные зависимости.
11. Снизить риск редизайна: маленькие итерации, baseline tests, smoke сценарии, инвентаризация визуальных точек.
12. Подготовить документацию для будущих разработчиков: куда класть новый модуль, где хранить UI, где контракт, где runtime extension.

## Глобальные Блоки

### 1. Architecture Guardrails

- [x] Документировать текущие слои в `docs/architecture.md`.
- [x] Иметь Vitest boundary checks для `shared`, `core/modules`, `sandbox`, generated API.
- [x] Убрать обратную зависимость `core -> app`.
- [x] Запретить `core/**` и `shared/**` импортировать `app/**`.
- [x] Расширить public-entrypoint контроль на `catalog-price-list` и `product-modifier`.
- [x] Снизить первый baseline глубоких module imports: `131 -> 113`.
- [x] Закрыть production deep import debt из `app`, `catalog-runtime`, `core/views` и `core/widgets`: `113 -> 0`.
- [x] Поддерживать нулевой baseline глубоких module imports через architecture guard.
- [ ] Добавить отчет по топовым источникам deep import debt.

### 2. Module Public API

- [x] Проверить exports в `core/modules/*/index.ts`.
- [x] Для каждого модуля описать public surface: model, ui, actions, contracts.
- [x] Запретить новым widgets/views/bridges импортировать module internals напрямую.
- [ ] Продолжать выносить общие helper-типы из deep paths в module entrypoints.
- [x] Начать bridge modules для связок, которые не должны жить внутри одного домена.

### 3. Catalog Runtime

- [ ] Описать runtime manifest: id, capabilities, slots, policies, analytics events.
- [ ] Разделить extension contracts и runtime implementation.
- [ ] Проверить restaurant/wholesale/business-card extensions на одинаковый контракт.
- [ ] Перенести типовые различия из scattered conditions в runtime extension.
- [ ] Добавить тесты совместимости slots для новых типов каталогов.

### 4. Design System And Tokens

- [x] Инвентаризировать текущие CSS variables, Tailwind tokens и shared UI.
- [x] Ввести первый слой semantic tokens: surface, text, line, action, status, radius, shadow.
- [ ] Продолжать разделять base primitives и domain components.
- [ ] Подготовить theme presets под будущий редизайн.
- [ ] Убрать одноразовые визуальные решения из крупных widgets там, где они должны быть tokens/components.

### 5. Storefront Composition

- [ ] Держать route files в `app` тонкими.
- [ ] Переносить screen composition в `core/views`.
- [ ] Runtime-aware storefront собирать через `core/catalog-runtime/ui`.
- [ ] Проверить product page, home page, drawers, header/footer на единый composition pattern.

### 6. Quality Gate

- [ ] Добавить OpenAPI preflight перед `api:gen`, как в dashboard.
- [ ] Проверять, что generated API не меняется неожиданно после генерации.
- [ ] Держать `prod:check --fast --skip-build` быстрым для архитектурных итераций.
- [ ] Расширить smoke checklist под клиент/admin/global-admin режимы.

### 7. Migration Order

1. Усилить архитектурные тесты и убрать обратные зависимости.
2. Закрепить module public entrypoints.
3. Снизить deep import debt в runtime/views/widgets.
4. Описать contracts для runtime extensions.
5. Начать дизайн-токены и shared UI inventory.
6. Переносить визуальные изменения через tokens/components/slots.
7. После стабилизации включать более строгие запреты без baseline.

## Текущий Первый Блок

- [x] Создать этот roadmap.
- [x] Перенести `HomeContent` и fallback из `app/(storefront)` в `core/views/home`.
- [x] Обновить app routes на импорт из `core/views/home/home-content`.
- [x] Добавить boundary rule против `core/shared -> app`.
- [x] Расширить public module entrypoint guard.

## Текущий Второй Блок

- [x] Добавить `category-display` в public API `@/core/modules/category`.
- [x] Перевести `core/catalog-runtime` production imports на module public entrypoints.
- [x] Перевести `core/views/home` imports на `@/core/modules/browser` и `@/core/modules/category`.
- [x] Перевести очевидные `edit-catalog/global-admin` imports на `product`, `integration`, `product-modifier` entrypoints.
- [x] Снизить `PUBLIC_MODULE_IMPORT_DEBT_BASELINE` до `113`.
- [x] Перевести `create-product-drawer`, `edit-product-drawer`, `product-editor`, `product-drawer`, `cart-drawer` и `filter-bar` на module public entrypoints.
- [x] Снизить `PUBLIC_MODULE_IMPORT_DEBT_BASELINE` до `0`.

## Следующий Фронтовый Блок

- [x] Описать public surface каждого `core/modules/*/index.ts`: что является контрактом, что остается internal.
- [x] Начать выделение bridge modules для связок `product/cart` и будущих runtime-specific сценариев.
- [x] Инвентаризировать shared UI и текущие CSS/Tailwind tokens перед design tokens.

## Текущий Третий Блок

- [x] Создать `docs/frontend-module-public-api.md`.
- [x] Добавить слой `core/bridges` в архитектурное описание.
- [x] Добавить boundary rules для `core/bridges`.
- [x] Добавить первый bridge `@/core/bridges/product-cart`.
- [x] Перенести product/cart line matching из `product-drawer` в bridge.
- [x] Вывести `CartLineModifierSelection` через public API `@/core/modules/cart`.

## Текущий Четвертый Блок

- [x] Создать `docs/frontend-design-tokens.md`.
- [x] Добавить semantic tokens в `app/globals.css`.
- [x] Добавить тест `app/design-tokens.test.ts`.
- [x] Перевести `Button`, `Card` и cart status message на semantic tokens.
- [x] Перевести `Badge`, `Tabs`, `Input`, `Select`, `Switch`, `Skeleton` на semantic tokens.
- [x] Добавить первый `AdminPanel` primitive и применить его в sessions drawer.
- [x] Перевести `Dialog`, `Popover`, `Drawer`, `Textarea`, `Progress`, `Slider` на semantic tokens.
- [x] Добавить `AdminPanelButton` и применить его в advanced/settings sessions triggers.
- [x] Перевести `Field`, `RadioGroup`, `Checkbox`, `Toggle`, `ToggleGroup`, `Calendar` на semantic tokens.
- [x] Перевести `FieldError`, `Separator`, `InputGroup`, `InputOTP` на semantic tokens.
- [x] Дочистить `Button`, `AppDrawerHeader`, `CharacterLimitedTextarea`, `SlotErrorBoundary`, `CartIcon` от legacy UI colors.
- [x] Перевести `ImageCropperDrawer` helpers и `Chart` на semantic tokens.
- [x] Перевести `DynamicForm` visual helpers на semantic tokens.
- [x] Перевести `footer` и `share-drawer` UI colors/surfaces/radii на semantic tokens, оставив asset colors отдельно.
- [x] Перевести `cart-drawer` checkout primitives на semantic tokens.
- [x] Перевести `cart-drawer` integration checkout section на semantic tokens.
- [x] Перевести `cart-drawer` shell/hall-table/footer panels на semantic tokens.
- [x] Дочистить `cart-drawer` header/skeleton/status/footer details от legacy UI tokens.
- [x] Перевести `global-admin-drawer` panels, feature flags и danger states на semantic tokens.
- [x] Перевести `category-admin` action buttons, reorder drawer и delete controls на semantic tokens.
- [x] Перевести `edit-product-drawer` и `create-product-drawer` states, settings actions и product card actions на semantic tokens.
- [x] Перевести base `edit-catalog-drawer`, catalog form required marker и sessions drawer остатки на semantic tokens.
- [x] Перевести `edit-catalog-sale-units-drawer` list/trigger/empty states на `AdminPanel` и semantic tokens.
- [x] Перевести `edit-catalog-product-types-drawer` trigger/panels/chips/nested cards на `AdminPanel` и semantic tokens.
- [x] Перевести `edit-catalog` integrations/metrika/password triggers на `AdminPanelButton` и semantic tokens.
- [x] Перевести `edit-catalog-checkout` и contact row/drawer visual layer на `AdminPanel` и semantic tokens.
- [x] Перевести `edit-catalog-domains-drawer` DNS/domain cards, trigger и states на `AdminPanel` и semantic tokens.
- [x] Перевести `edit-catalog-inventory-drawer` trigger, operation form и inventory rows/states на semantic tokens.
- [x] Перевести `edit-catalog-modifiers-drawer` option/group panels, rows, trigger и archive actions на `AdminPanel` и semantic tokens.
- [x] Перевести `edit-catalog-price-lists-drawer` selector, loading, radio rows и empty state на semantic tokens.
- [x] Перевести `edit-catalog-experience-drawer` mode/site/table QR panels, badges и trigger на `AdminPanel` и semantic tokens.
- [x] Перевести catalog-side `edit-catalog-moysklad-drawer` trigger/panels/error state на `AdminPanel` и semantic tokens.
- [x] Перевести admin-side `edit-catalog-moysklad-drawer` trigger/status/export/mapping/history states на semantic tokens.
- [x] Перевести `edit-catalog-iiko-drawer` diagnostics/webhooks/timeline/preview/export states на semantic tokens.
- [x] Перевести order export timeline storefront page на semantic tokens.
- [x] Перевести app-level error/not-found shells на semantic tokens.
- [x] Перевести `product-modifier-picker` list/chip states на semantic tokens.
- [x] Перевести `product-modifier-bindings-field` panels/empty/nested option states на semantic tokens.
- [x] Перевести `product-price-list-settings-drawer` rows/trigger/empty states на semantic tokens.
- [x] Перевести iiko/MoySklad sync progress toast text layer на semantic tokens.
- [x] Перевести `product-price-list` price fields/input grid на semantic tokens.
- [x] Перевести product editor progress/type-change/image/error states на semantic tokens.
- [x] Перевести product image grid/category image states на semantic tokens.
- [x] Перевести product variant status/attribute/combination states на semantic tokens.
- [x] Перевести product sale-units field на semantic tokens.
- [x] Перевести product floating action buttons на semantic tokens.
- [x] Перевести storefront product card shell/skeleton/plugin metadata на semantic tokens.
- [x] Перевести `product-drawer` shell/page/overview/pickers/footer/highlights на semantic tokens.
