# Catalog Frontend Architecture

This frontend is a modular monolith. Modules live in one Next.js app, but each
layer has a clear responsibility and import boundary.

## Layers

- `app`: routing and application composition. It may assemble providers,
  runtime slots, views, and top-level widgets.
- `shared`: foundation code. It contains generated API clients, generic UI,
  providers, and low-level utilities. It must not import `core`.
- `core/modules`: domain modules. They own cart, product, browser, category,
  integration, and other business logic. Modules may import `shared` and other
  modules, but not `core/widgets` or `core/views`.
- `core/bridges`: narrow cross-domain glue. Bridges connect modules when a
  scenario should not belong to either module, for example product-to-cart
  purchase selection. Bridges may import module public entrypoints and shared
  code, but not widgets, views, runtime extensions, or app routes.
- `core/widgets`: composed UI scenarios. Widgets may import modules and shared
  code.
- `core/views`: screen-level view composition.
- `core/catalog-runtime`: catalog type contracts, runtime resolution,
  extensions, and runtime slots. This is the production extension point.
- `sandbox`: compatibility aliases and experiments only. Production code must
  not import it.
- `shared/api/generated`: generated API layer. Do not edit by hand.
  Hand-written adapters belong in `shared/lib/*` or `core/modules/*/model`.

## Public Module Entrypoints

New cross-layer imports should go through module public entrypoints:

- `@/core/modules/browser`
- `@/core/modules/cart`
- `@/core/modules/catalog-price-list`
- `@/core/modules/category`
- `@/core/modules/integration`
- `@/core/modules/product`
- `@/core/modules/product/editor`
- `@/core/modules/product-modifier`

Production imports from app, runtime, bridges, views, and widgets to modules
must use these entrypoints. The architecture test keeps this debt at zero.

## Bridge Entrypoints

Cross-domain bridge imports should go through bridge public entrypoints:

- `@/core/bridges/product-cart`

## Runtime

Catalog-specific behavior goes through `core/catalog-runtime`.

- Pure metadata contracts live in `core/catalog-runtime/metadata-contracts.ts`;
  slot and full runtime contracts live in `slot-contracts.ts` and
  `runtime-contracts.ts`. `contracts.ts` is a compatibility facade.
- Runtime manifest metadata is resolved in `core/catalog-runtime/manifest.ts`.
- New type behavior goes into `core/catalog-runtime/extensions/<type>`.
- Runtime slot components are exported from `core/catalog-runtime/ui`.
- Public runtime exports are exposed through `core/catalog-runtime/index.ts`.
- Server-safe runtime/theme exports are exposed through
  `core/catalog-runtime/server.ts` and must not pull slot components.

Runtime extensions are internal monolith extensions, not external plugins or
microfrontends. They can compose existing modules/widgets when implementing a
catalog-specific scenario, but production routes should only consume runtime
facades and slots.

## Import Rules

- `shared/**` must not import `core/**`.
- `shared/**` must not import `app/**`.
- `core/**` must not import `app/**`.
- `core/modules/**` must not import `core/widgets/**` or `core/views/**`.
- `core/bridges/**` must not import `core/widgets/**`, `core/views/**`, or
  `core/catalog-runtime/**`.
- `app/**`, `core/**`, and `shared/**` must not import `sandbox/**`.
- `core/catalog-runtime/extensions/**` must not import `sandbox/**`.
- `shared/api/generated/**` must not import `app/**`, `core/**`, or
  `sandbox/**`.
- `app/**`, `core/widgets/**`, `core/views/**`, and `core/catalog-runtime/**`
  should prefer module public entrypoints over deep module imports.
- App routes should prefer `core/catalog-runtime/ui` for runtime-aware
  storefront composition.
- Widgets and views should use `core/bridges/*` when a workflow joins multiple
  modules and does not naturally belong to one module.

These rules are enforced by ESLint and Vitest boundary tests.

## Validation

Use these checks after architecture changes:

```bash
rg '@/sandbox' app core shared
rg '@/core' shared
rg '@/app' core shared
rg '@/core/(widgets|views)' core/modules
rg '@/core/(widgets|views|catalog-runtime)' core/bridges
rg '@/app|@/core|@/sandbox' shared/api/generated
bun run test:run
bun run lint
bun run build
```

For a deploy-oriented check, use:

```bash
bun run prod:check
```

To inspect the next public API cleanup targets, use:

```bash
bun run architecture:report
```
