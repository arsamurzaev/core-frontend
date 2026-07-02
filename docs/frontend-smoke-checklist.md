# Frontend Smoke Checklist

Дата: 2026-07-02

## Когда Проходить

- после `bun run prod:check`;
- после изменений auth/session/csrf;
- после изменений `catalog-runtime`, cart, product drawer, admin drawer или global admin handoff;
- перед выкладкой, если менялись generated API или backend DTO.

## Client Storefront

- [ ] Открыть обычный catalog host: главная витрина загружается без auth.
- [ ] Проверить header/footer и runtime-specific slots для текущего типа каталога.
- [ ] Открыть product drawer из списка товаров.
- [ ] Открыть standalone `/product/[slug]`: metadata/JSON-LD не ломают страницу, drawer открывается поверх home.
- [ ] Проверить товар без цены и товар с неизвестным остатком.
- [ ] Добавить simple product в корзину.
- [ ] Добавить variant/matrix product с выбором вариации.
- [ ] Добавить modifier product, если у каталога включены модификаторы.
- [ ] Проверить cart drawer: изменение количества, удаление позиции, итоговая сумма.
- [ ] Оформить тестовый заказ в public flow, если backend/stage это позволяет.

## Catalog Admin

- [ ] Открыть `/auth/login` на catalog host без сессии.
- [ ] Войти владельцем каталога, проверить redirect на `/`.
- [ ] Проверить owner/admin controls в storefront header.
- [ ] Открыть edit catalog drawer.
- [ ] Изменить базовые настройки каталога и убедиться, что storefront обновился.
- [ ] Создать товар с фото.
- [ ] Отредактировать товар: цена, описание, категории, видимость.
- [ ] Проверить category reorder/delete controls.
- [ ] Проверить product modifiers, если capability включена.
- [ ] Запустить доступный integration sync action и убедиться, что progress/status отображается.
- [ ] Выйти из catalog admin и проверить возврат в клиентский режим.

## Global Admin

- [ ] Войти в global admin на dashboard/admin host.
- [ ] Перейти из global admin в обычную админку каталога.
- [ ] Убедиться, что `asid` и `acsrf` cookies доступны storefront.
- [ ] Проверить, что в storefront header вместо обычного logout доступен вход/возврат как global admin.
- [ ] Проверить dashboard/global-admin запросы: CSRF token не теряется после handoff.
- [ ] Проверить выход из global admin режима: cookies очищаются или перестают давать admin action.

## Platform Auth

- [ ] Открыть register platform host: показывается onboarding/register flow.
- [ ] Открыть login platform host: показывается platform login flow.
- [ ] Проверить `/auth/verify-email?token=...` с валидным и пустым token.
- [ ] Проверить `/auth/sign-in` с query params: redirect сохраняет параметры в `/auth/login`.

## Cache And API

- [ ] Вызвать storefront revalidate flow для каталога, если есть доступная admin action.
- [ ] Проверить, что generated API актуален: `bun run prod:check` проходит без generated diff.
- [ ] Проверить network errors в cart/product/admin drawers: UI показывает понятную ошибку.
