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
- [ ] Продолжать снижать baseline глубоких module imports отдельными маленькими PR/коммитами.
- [ ] Добавить отчет по топовым источникам deep import debt.

### 2. Module Public API

- [ ] Проверить exports в `core/modules/*/index.ts`.
- [ ] Для каждого модуля описать public surface: model, ui, actions, contracts.
- [ ] Запретить новым widgets/views импортировать module internals напрямую.
- [ ] Вынести общие helper-типы из deep paths в module entrypoints.
- [ ] Сделать bridge modules для связок, которые не должны жить внутри одного домена.

### 3. Catalog Runtime

- [ ] Описать runtime manifest: id, capabilities, slots, policies, analytics events.
- [ ] Разделить extension contracts и runtime implementation.
- [ ] Проверить restaurant/wholesale/business-card extensions на одинаковый контракт.
- [ ] Перенести типовые различия из scattered conditions в runtime extension.
- [ ] Добавить тесты совместимости slots для новых типов каталогов.

### 4. Design System And Tokens

- [ ] Инвентаризировать текущие CSS variables, Tailwind tokens и shared UI.
- [ ] Ввести semantic tokens: surface, text, border, action, status, spacing, radius, shadow.
- [ ] Разделить base primitives и domain components.
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
