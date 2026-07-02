# Frontend Design Tokens

Дата: 2026-07-02

## Цель

Подготовить фронт к большому редизайну без переписывания бизнес-логики. Визуальный слой должен меняться через semantic tokens, shared primitives и runtime slots, а не через ручную замену цветов и классов в десятках widgets.

## Текущее Состояние

Точка входа токенов: `app/globals.css`.

Проект использует Tailwind v4 через `@theme inline`, shadcn-style CSS variables и `components.json` с `cssVariables: true`.

Уже есть базовые токены:
- color: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `tertiary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-*`, `sidebar-*`;
- radius: `radius`, `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`;
- shadow: `shadow-custom`;
- runtime CSS variable: `--catalog-filter-bar-height`;
- viewport helper: `--app-dvh`.

`shared/ui` содержит 50 файлов primitives/components. Основные группы:
- form controls: input, textarea, select, checkbox, radio, switch, slider, calendar, field, tabs, toggle;
- overlay/drawer/dialog: app drawer, drawer, dialog, popover, confirmation drawers;
- primitives: button, card, badge, separator, carousel, aspect ratio, chart;
- feedback: skeleton, progress, sonner, slot error boundary;
- icons and layout helpers.

## Инвентаризация Рисков

Автоматический срез по `app`, `core`, `shared`:
- 42 hex-значения в коде;
- 32 SVG `fill/stroke="#..."`, в основном брендовые иконки/логотипы;
- 57 arbitrary utility classes вида `text-[...]`, `shadow-[...]`, `bg-[#...]`; часть из них не цветовые, а размерные;
- 8 `rgb/rgba/hsl` в CSS/TSX.

Основные зоны визуального долга:
- `core/widgets/share-drawer` и `core/widgets/footer`: брендовые SVG и жесткие серые цвета;
- `core/widgets/edit-catalog-drawer`: много повторяющихся `border-black/10`, `bg-muted/10`, `rounded-2xl`;
- `core/modules/product-modifier`: повторяющиеся панели/пустые состояния;
- `core/widgets/cart-drawer`: status/warning surfaces и checkout panels;
- `shared/ui/button`, `shared/ui/card`, `shared/ui/badge`, `shared/ui/tabs`: primitives уже есть, но часть вариантов завязана на старые color names или hardcoded values.

## Добавленный Semantic Layer

В `app/globals.css` добавлен слой aliases поверх текущих shadcn tokens.

Surface:
- `surface-base`
- `surface-raised`
- `surface-raised-foreground`
- `surface-overlay`
- `surface-overlay-foreground`
- `surface-muted`
- `surface-subtle`
- `surface-inverse`

Text:
- `text-primary`
- `text-secondary`
- `text-muted`
- `text-inverse`

Line:
- `line-default`
- `line-subtle`
- `line-strong`

Action:
- `action-primary`
- `action-primary-foreground`
- `action-secondary`
- `action-secondary-foreground`
- `action-link`

Status:
- `status-danger`
- `status-warning`
- `status-success`
- `status-info`
- status foreground and surface variants.

Shape/elevation:
- `radius-panel`
- `radius-control`
- `radius-pill`
- `shadow-surface`
- `shadow-control`
- `shadow-overlay`

## Первый Кодовый Перенос

Уже переведено:
- `shared/ui/button.tsx`: `default`, `destructive`, `secondary`, `link` используют action/status tokens;
- `shared/ui/card.tsx`: использует `surface-raised`, `surface-raised-foreground`, `shadow-surface`, `radius-panel`;
- `shared/ui/badge.tsx`: использует `status-info`, `status-danger`, `surface-raised`;
- `shared/ui/tabs.tsx`: использует `surface-muted`, `surface-base`, `text-primary`, `shadow-surface`;
- `shared/ui/input.tsx` и `shared/ui/select.tsx`: используют `text-*`, `line-*`, `action-primary`, `shadow-control`, `radius-control`;
- `shared/ui/switch.tsx`: использует `status-success/status-danger` и `radius-pill`;
- `shared/ui/skeleton.tsx`: использует `surface-subtle`;
- `shared/ui/dialog.tsx`, `popover.tsx`, `drawer.tsx`: используют overlay/surface/elevation tokens;
- `shared/ui/textarea.tsx`, `progress.tsx`, `slider.tsx`: используют surface/action/text semantic tokens;
- `shared/ui/field-primitives.tsx`, `radio-group.tsx`, `checkbox.tsx`, `toggle.tsx`, `toggle-group.tsx`, `calendar.tsx`: используют action/status/surface/line/text semantic tokens;
- `shared/ui/field-error.tsx`, `separator.tsx`, `input-group.tsx`, `input-otp.tsx`: используют status/line/surface/action/text semantic tokens;
- `shared/ui/admin-panel.tsx`: общий primitive для повторяющихся admin panel/card/empty states и admin trigger buttons;
- `core/widgets/cart-drawer/ui/cart-drawer-status-message.tsx`: использует `status-warning`.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-sessions-drawer.tsx`: первый drawer, где карточки/скелетоны/empty states переведены на `AdminPanel`.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-advanced-settings-drawer.tsx` и sessions trigger используют `AdminPanelButton`.

Проверка токенов:
- `app/design-tokens.test.ts` гарантирует, что ключевые semantic tokens присутствуют в `@theme inline`, `:root` и `.dark`.

## Правила Дальнейшей Миграции

- Новые reusable components в `shared/ui` должны использовать semantic tokens, а не прямые `primary/card/destructive`, если смысл компонента не привязан к конкретному primitive token.
- Domain widgets могут использовать `primary` только для brand/action-акцента; для поверхностей, текста, бордеров и статусов использовать `surface-*`, `text-*`, `line-*`, `status-*`.
- Hardcoded hex допустим для внешних логотипов и официальных брендовых иконок.
- Repeated panel styles в admin drawers лучше выносить в shared/domain components, а не копировать `rounded-2xl border border-black/10 bg-muted/10`.
- Для редизайна менять сначала values в `:root/.dark`, затем постепенно заменять старые классы на semantic aliases.

## Следующие Шаги

1. Продолжить перенос оставшихся `shared/ui`: `phone-input`, cropper helpers, chart tooltip/legend, slot error boundary.
2. Расширить использование `AdminPanel` и `AdminPanelButton` в `edit-catalog-*` и `product-modifier-*` экранах.
3. Разобрать `share-drawer/footer` и отделить брендовые SVG colors от UI text/surface colors.
4. Подготовить theme preset structure для будущих типов каталога, не меняя runtime behavior.
