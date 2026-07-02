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
- `shared/ui/app-drawer-header.tsx`, `button.tsx`, `character-limited-textarea.tsx`, `slot-error-boundary.tsx`, `icons/cart-icon.tsx`: убраны старые hardcoded/legacy UI colors в пользу semantic tokens;
- `shared/ui/phone-input.tsx`: не хранит локальных styles и наследует semantic оформление от `Input`;
- `shared/ui/image-cropper-drawer*.tsx` и `chart.tsx`: используют surface/line/text/action/status semantic tokens для panels, tooltips, navigation, states;
- `shared/ui/dynamic-form.tsx`: option descriptions, optional/required markers, slider value и date placeholder используют text/status semantic tokens;
- `shared/ui/admin-panel.tsx`: общий primitive для повторяющихся admin panel/card/empty states и admin trigger buttons;
- `core/widgets/cart-drawer/ui/cart-drawer-status-message.tsx`: использует `status-warning`.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-sessions-drawer.tsx`: первый drawer, где карточки/скелетоны/empty states переведены на `AdminPanel`.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-advanced-settings-drawer.tsx` и sessions trigger используют `AdminPanelButton`.
- `core/widgets/footer` и `core/widgets/share-drawer`: UI text/status/surface colors, close icons, pill radii и wordmark currentColor переведены на semantic tokens; brand/support asset colors оставлены как assets.
- `core/widgets/cart-drawer` checkout primitives: delivery/preorder forms, location display, checkout tabs, locked summary и grouped cart count используют semantic tokens.
- `core/widgets/cart-drawer/ui/integration-checkout-section.tsx`: integration checkout panels, iiko table states, field errors и policy links используют semantic tokens.
- `core/widgets/cart-drawer` shell/hall-table UI: drawer surface, footer panel, comment textarea, manager start bar и hall-table orders list используют semantic tokens.
- `core/widgets/cart-drawer` header/skeleton/status/footer-summary details: radii, muted text and elevation use semantic tokens.
- `core/widgets/global-admin-drawer`: catalog info panel, presentation mode segmented control, feature flags, danger zone and deletion result use semantic tokens.
- `core/widgets/category-admin`: admin action buttons, edit/delete controls, reorder drawer handles and empty states use semantic tokens.
- `core/widgets/edit-product-drawer` и `core/widgets/create-product-drawer`: loading/error states, settings action buttons, hidden product overlays and card action buttons use semantic tokens.
- `core/widgets/edit-catalog-drawer`: base drawer upload/error states, catalog edit form required marker and sessions drawer residual classes use semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-sale-units-drawer.tsx`: list items, drag handles, trigger, skeletons and empty/error states use `AdminPanel`/semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-product-types-drawer.tsx`: product type trigger, panels, chips, nested value cards and empty states use `AdminPanel`/semantic tokens.
- `core/widgets/edit-catalog-drawer` integrations/metrika/password triggers use `AdminPanelButton`; metrika input inherits shared input tokens.
- `core/widgets/edit-catalog-drawer` checkout/contact drawers use semantic panels, contact icons, helper text and field borders.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-domains-drawer.tsx`: domain trigger, DNS records, domain cards, skeletons and empty/error states use `AdminPanel`/semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-inventory-drawer.tsx`: inventory trigger, operation form, stock/reservation/movement rows and warehouse states use semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-modifiers-drawer.tsx`: modifiers trigger, option/group panels, nested rows, empty states and archive actions use `AdminPanel`/semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-price-lists-drawer.tsx`: selector trigger, loading state, radio rows and empty state use semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-experience-drawer.tsx`: mode/site/table link panels, QR states, status badges and trigger use `AdminPanel`/semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-moysklad-drawer-catalog.tsx`: catalog-side MoySklad trigger, status/info panels, webhook shell and error state use `AdminPanel`/semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-moysklad-drawer-admin.tsx`: admin-side MoySklad trigger, status panels, order export, mapping previews and run history use semantic tokens.
- `core/widgets/edit-catalog-drawer/ui/edit-catalog-iiko-drawer.tsx`: iiko trigger, diagnostics, webhook events, timeline, terminal-group details, preview stats and order export states use semantic tokens.
- `app/(storefront)/order/[id]/order-export-timeline-page.tsx`: order export timeline shell, rows, empty state and errors use semantic tokens.
- `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`: app-level error shells, icons and helper text use semantic tokens.

Проверка токенов:
- `app/design-tokens.test.ts` гарантирует, что ключевые semantic tokens присутствуют в `@theme inline`, `:root` и `.dark`.

## Правила Дальнейшей Миграции

- Новые reusable components в `shared/ui` должны использовать semantic tokens, а не прямые `primary/card/destructive`, если смысл компонента не привязан к конкретному primitive token.
- Domain widgets могут использовать `primary` только для brand/action-акцента; для поверхностей, текста, бордеров и статусов использовать `surface-*`, `text-*`, `line-*`, `status-*`.
- Hardcoded hex допустим для внешних логотипов и официальных брендовых иконок.
- Repeated panel styles в admin drawers лучше выносить в shared/domain components, а не копировать `rounded-2xl border border-black/10 bg-muted/10`.
- Для редизайна менять сначала values в `:root/.dark`, затем постепенно заменять старые классы на semantic aliases.

## Следующие Шаги

1. Принять решение по `shared/ui/smooth-drawer.tsx`: сейчас не используется, выглядит как внешнее demo; лучше удалить/перенести в sandbox или переписать при появлении реального сценария.
2. Расширить использование `AdminPanel` и `AdminPanelButton` в `edit-catalog-*` и `product-modifier-*` экранах.
3. Продолжить перенос крупных widgets: `edit-catalog-*` integration/checkout/contact drawers, `product-modifier-*`, `header/filter-bar/category-products`.
4. Подготовить theme preset structure для будущих типов каталога, не меняя runtime behavior.
