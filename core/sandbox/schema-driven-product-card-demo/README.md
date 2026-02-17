# Schema-Driven Product Card Demo

This folder is fully isolated from production widgets and contains a demo of:

- sandbox product-card that matches the original `core/modules/product/entities/product-card.tsx`;
- backend-driven demo data (`/product/popular` now returns `ProductWithDetailsDto[]` with `variants`);
- catalog-type aware additional attribute mapping for type keys.

Implemented type mapping:

- `cafe` -> restaurant card + `cafe_bean_origin` (non-variant);
- `cloth` -> clothing card + `outerwear_size` (variant attribute, resolved from `variants` when needed).

The current app code is not replaced by these files. The demo can be mounted separately on the home page.
