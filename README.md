# Catalog Frontend

Фронтенд каталога на `Next.js 16`, `React 19`, `TypeScript`, `TanStack Query` и `Orval`.

## Что внутри

- клиентский каталог с фильтрами и категориями
- drawer-экран товара
- корзина с публичным режимом и SSE-обновлениями
- интерфейсы создания и редактирования товаров
- общий UI-слой в `shared/`

## Основные директории

- `app/` — роутинг и root layout
- `core/` — доменные модули, widgets и view-слой
- `shared/` — API-клиент, провайдеры, hooks, UI и утилиты
- `public/` — статические ассеты
- `w-old/` — архив старой версии, не входит в активную поддержку

## Требования

- Node.js 20+
- npm или bun
- доступный backend API

## Переменные окружения

Скопируй `.env.example` в `.env.local` и при необходимости поменяй значения:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_FORWARDED_HOST=urban-style.myctlg.ru
ORVAL_OPENAPI_URL=http://localhost:4000/openapi.yaml
```

## Скрипты

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run api:gen
```

## Как устроен запуск

- `app/layout.tsx` загружает текущий каталог на сервере
- `shared/providers/app-provider.tsx` подключает React Query, session, catalog и cart провайдеры
- API-клиент и generated hooks лежат в `shared/api/`

## Замечания

- Линт активного проекта не включает `w-old/`
- `api:gen` использует `ORVAL_OPENAPI_URL` или `NEXT_PUBLIC_API_BASE_URL`
