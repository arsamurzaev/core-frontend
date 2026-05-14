# Sandbox

This directory is an experimental compatibility layer, not a production API.

Production storefront code must use `core/catalog-runtime`. Files in `sandbox`
should either re-export runtime pieces for legacy compatibility or contain
throwaway experiments that are not imported by `app`, `core`, or `shared`.

Current `sandbox/core`, `sandbox/ui`, and `sandbox/plugins` files are legacy
aliases. Real logic belongs in `core/catalog-runtime`; if a sandbox file needs
more than a re-export, move that logic into runtime first and keep sandbox as a
thin alias.

When an experiment becomes real, move it into:

- `core/catalog-runtime/extensions/<type>` for catalog-type behavior
- `core/catalog-runtime/contracts.ts` for runtime contracts
- `core/catalog-runtime/ui/*` for production slot components
- `core/modules/*` for domain logic
- `core/widgets/*` for composed UI scenarios
- `shared/*` for foundation code

Default catalog behavior is resolved by `resolveCatalogRuntime(...)`; there is
no separate default plugin in sandbox.

Runtime checklist:

- add the extension to `core/catalog-runtime/registry.ts`
- expose only stable contracts through `core/catalog-runtime/index.ts`
- keep storefront imports on `@/core/catalog-runtime` or
  `@/core/catalog-runtime/ui`
- add tests near `core/catalog-runtime`

Boundary checks:

- `rg '@/sandbox' app core shared`
- `bun run test:run`
- `bun run lint`
- `bun run build`
