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
- `core/widgets`: composed UI scenarios. Widgets may import modules and shared
  code.
- `core/views`: screen-level view composition.
- `core/catalog-runtime`: catalog type contracts, runtime resolution,
  extensions, and runtime slots. This is the production extension point.
- `sandbox`: compatibility aliases and experiments only. Production code must
  not import it.
- `shared/api/generated`: generated API layer. Do not edit by hand.
  Hand-written adapters belong in `shared/lib/*` or `core/modules/*/model`.

## Runtime

Catalog-specific behavior goes through `core/catalog-runtime`.

- Contracts live in `core/catalog-runtime/contracts.ts`.
- New type behavior goes into `core/catalog-runtime/extensions/<type>`.
- Runtime slot components are exported from `core/catalog-runtime/ui`.
- Public runtime exports are exposed through `core/catalog-runtime/index.ts`.

Runtime extensions are internal monolith extensions, not external plugins or
microfrontends. They can compose existing modules/widgets when implementing a
catalog-specific scenario, but production routes should only consume runtime
facades and slots.

## Import Rules

- `shared/**` must not import `core/**`.
- `core/modules/**` must not import `core/widgets/**` or `core/views/**`.
- `app/**`, `core/**`, and `shared/**` must not import `sandbox/**`.
- `core/catalog-runtime/extensions/**` must not import `sandbox/**`.
- `shared/api/generated/**` must not import `app/**`, `core/**`, or
  `sandbox/**`.
- App routes should prefer `core/catalog-runtime/ui` for runtime-aware
  storefront composition.

These rules are enforced by ESLint and Vitest boundary tests.

## Validation

Use these checks after architecture changes:

```bash
rg '@/sandbox' app core shared
rg '@/core' shared
rg '@/core/(widgets|views)' core/modules
rg '@/app|@/core|@/sandbox' shared/api/generated
bun run test:run
bun run lint
bun run build
```
