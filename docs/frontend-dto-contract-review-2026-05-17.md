# Frontend DTO Contract Review

Date: 2026-05-17

## Checked Contracts

- Product card DTO: `ProductWithAttributesDto` contains `priceState`, `availabilityState`, `requiresVariantSelection`, `variantSummary`, `variantPickerOptions`, `defaultVariantId`, `stock`, `minPrice`, and `maxPrice`.
- Product details DTO: `ProductWithDetailsDto` contains the same commercial fields plus full `variants`.
- Variant DTO: `ProductVariantDto` contains `price`, `stock`, `status`, `isAvailable`, attributes, and `saleUnits`.
- Variant picker DTO: `ProductVariantPickerOptionDto` contains `saleUnitId`, `saleUnitPrice`, `maxQuantity`, `stock`, `price`, and availability fields.
- Cart item DTO: `CartItemDto` contains snapshot pricing fields, `variantId`, `saleUnitId`, `variant`, and `saleUnit`.
- Capabilities DTO: `CatalogCurrentFeaturesDto` contains raw/effective capabilities and feature booleans used by `shared/capabilities`.
- MoySklad integration DTOs contain `stockWebhook`, `stockWebhookEnabled`, and webhook registration/status fields.

## Result

The current generated client supports the frontend stabilization rules for nullable prices, nullable stock, variant-aware cart payloads, capability-gated UI, and MoySklad stock webhook controls.

Verified with:

```bash
bun run api:gen
bun run prod:check
```
