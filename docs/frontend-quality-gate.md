# Frontend Quality Gate

Дата: 2026-05-17

## Назначение

`prod:check` собирает обязательные проверки storefront перед выкладкой. Он не заменяет ручной smoke UI, но ловит самые дорогие ошибки: устаревший generated API, поломанные import boundaries, битую кодировку, падающие тесты и невалидную production-сборку.

## Команды

Полная проверка:

```bash
bun run prod:check
```

Быстрая проверка архитектурного слоя без production build:

```bash
bun run prod:check --fast --skip-build
```

Если backend OpenAPI не менялся и generated API уже актуален:

```bash
bun run prod:check --skip-api
```

## Что входит

- `bun run api:gen`
- `bun run lint`
- `bun run test:run`
- `bun run build`

В режиме `--fast` вместо полного test suite запускаются только архитектурные проверки:

- `architecture-boundaries`
- `text-encoding`

## Production Smoke

После автоматических проверок вручную пройти:

- товар без цены;
- товар с simple hidden default variant;
- товар с несколькими вариациями;
- добавление matrix-товара через drawer вариаций;
- `stock=null`, когда остаток не отслеживается;
- `stock=0`, когда товара нет в наличии;
- корзина с неизвестной ценой;
- отключенные product variants capability;
- включенные product variants capability.
