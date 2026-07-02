# Frontend API Sync

Дата: 2026-05-17

## Источник OpenAPI

Frontend generated API строится из OpenAPI backend. Приоритет источников:

1. `ORVAL_OPENAPI_URL`, если переменная задана.
2. `runtime/openapi.json`, если файл есть локально.
3. `../backend/runtime/openapi.json`, если файл есть рядом с frontend.
4. `${NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || "http://localhost:4000"}/openapi.yaml`.

Локальный файл предпочтителен для production-подготовки: он делает генерацию повторяемой и не требует запущенного backend во время frontend-сборки.

## Обновление После Backend Изменений

Из backend:

```bash
npm run openapi:export -- --output=../frontend/runtime/openapi.json
```

Из frontend:

```bash
bun run api:gen
```

`api:gen` сначала запускает OpenAPI preflight, чтобы Orval не перезатер generated-клиент при недоступном backend/source.

После генерации проверить diff:

```bash
git diff -- shared/api/generated runtime/openapi.json
```

## Правила

- `shared/api/generated/**` не редактируем руками.
- Если DTO изменился на backend, сначала обновляем `runtime/openapi.json`, затем запускаем `bun run api:gen`.
- Hand-written adapters, formatters и view models живут в `shared/lib/*` или `core/modules/*/model`.
- Компоненты не должны напрямую зависеть от деталей generated DTO, если для сценария уже есть module view model.

## Проверка Перед Выкладкой

```bash
bun run prod:check
```

В полном режиме gate делает preflight, генерирует API и падает, если после генерации появился неожиданный diff в `shared/api/generated`.

Если OpenAPI точно не менялся:

```bash
bun run prod:check --skip-api
```
