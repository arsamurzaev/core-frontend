import { describe, expect, it } from "vitest";

import {
  buildProductPriceListBulkPricesPayload,
  buildProductPriceListProductSourceFromForm,
  buildProductPriceListRows,
} from "./catalog-price-list-api";

describe("buildProductPriceListBulkPricesPayload", () => {
  it("retargets sale unit prices to recreated sale units", () => {
    const previousProduct = {
      id: "product-1",
      variants: [
        {
          id: "variant-1",
          variantKey: "default",
          kind: "DEFAULT",
          saleUnits: [
            {
              id: "old-sale-unit-box",
              catalogSaleUnitId: "catalog-sale-unit-box",
              code: "box",
              name: "6 штук",
              baseQuantity: "6.0000",
            },
          ],
        },
      ],
    };
    const nextProduct = {
      id: "product-1",
      variants: [
        {
          id: "variant-1",
          variantKey: "default",
          kind: "DEFAULT",
          saleUnits: [
            {
              id: "new-sale-unit-box",
              catalogSaleUnitId: "catalog-sale-unit-box",
              code: "box",
              name: "6 штук",
              baseQuantity: "6.0000",
            },
          ],
        },
      ],
    };

    const payload = buildProductPriceListBulkPricesPayload(
      [
        {
          priceListId: "price-list-1",
          rowKey: "SALE_UNIT:old-sale-unit-box",
          target: "SALE_UNIT",
          targetId: "old-sale-unit-box",
          price: "1200",
        },
      ],
      "integer",
      { product: nextProduct, previousProduct },
    );

    expect(payload).toEqual([
      {
        priceListId: "price-list-1",
        prices: [
          {
            target: "SALE_UNIT",
            targetId: "new-sale-unit-box",
            price: 1200,
          },
        ],
      },
    ]);
  });

  it("does not send stale sale unit rows that no longer exist", () => {
    const payload = buildProductPriceListBulkPricesPayload(
      [
        {
          priceListId: "price-list-1",
          rowKey: "SALE_UNIT:removed-sale-unit",
          target: "SALE_UNIT",
          targetId: "removed-sale-unit",
          price: "1200",
        },
      ],
      "integer",
      {
        product: { id: "product-1", saleUnits: [] },
        previousProduct: {
          id: "product-1",
          saleUnits: [{ id: "removed-sale-unit", code: "box" }],
        },
      },
    );

    expect(payload).toEqual([]);
  });

  it("retargets unsaved form sale unit price to saved sale unit id", () => {
    const formProduct = buildProductPriceListProductSourceFromForm({
      canUseCatalogSaleUnits: true,
      formValues: {
        name: "Pizza",
        price: "",
        productTypeId: undefined,
        brandId: undefined,
        categoryIds: [],
        hasDiscount: false,
        attributes: {},
        saleUnits: [
          {
            catalogSaleUnitId: "catalog-sale-unit-six",
            catalogSaleUnitName: "6 штук",
            label: "6 штук",
            baseQuantity: "6",
            price: "0",
            isDefault: false,
          },
        ],
        variants: {
          selectedAttributeIds: [],
          selectedValueIdsByAttributeId: {},
          combinations: {},
        },
      },
    });
    const savedProduct = {
      id: "product-1",
      saleUnits: [
        {
          id: "saved-sale-unit-six",
          catalogSaleUnitId: "catalog-sale-unit-six",
          name: "6 штук",
          baseQuantity: "6.0000",
        },
      ],
    };

    const payload = buildProductPriceListBulkPricesPayload(
      [
        {
          priceListId: "price-list-1",
          rowKey: "SALE_UNIT:draft:catalog-sale-unit-six",
          target: "SALE_UNIT",
          targetId: "draft:catalog-sale-unit-six",
          price: "1500",
        },
      ],
      "integer",
      { product: savedProduct, previousProduct: formProduct },
    );

    expect(payload).toEqual([
      {
        priceListId: "price-list-1",
        prices: [
          {
            target: "SALE_UNIT",
            targetId: "saved-sale-unit-six",
            price: 1500,
          },
        ],
      },
    ]);
  });

  it("retargets unsaved base sale unit price to saved default variant sale unit id", () => {
    const formProduct = buildProductPriceListProductSourceFromForm({
      canUseCatalogSaleUnits: true,
      formValues: {
        name: "Pizza",
        price: "",
        productTypeId: undefined,
        brandId: undefined,
        categoryIds: [],
        hasDiscount: false,
        attributes: {},
        saleUnits: [
          {
            catalogSaleUnitId: "catalog-sale-unit-box",
            catalogSaleUnitName: "6 штук",
            label: "6 штук",
            baseQuantity: "6",
            price: "0",
            isDefault: false,
          },
        ],
        variants: {
          selectedAttributeIds: [],
          selectedValueIdsByAttributeId: {},
          combinations: {},
        },
      },
    });
    const savedProduct = {
      id: "product-1",
      variants: [
        {
          id: "default-variant-1",
          variantKey: "default",
          kind: "DEFAULT",
          saleUnits: [
            {
              id: "saved-sale-unit-box",
              catalogSaleUnitId: "catalog-sale-unit-box",
              name: "6 штук",
              baseQuantity: "6.0000",
            },
          ],
        },
      ],
    };

    const payload = buildProductPriceListBulkPricesPayload(
      [
        {
          priceListId: "price-list-1",
          rowKey: "SALE_UNIT:draft:catalog-sale-unit-box",
          target: "SALE_UNIT",
          targetId: "draft:catalog-sale-unit-box",
          price: "1800",
        },
      ],
      "integer",
      { product: savedProduct, previousProduct: formProduct },
    );

    expect(payload).toEqual([
      {
        priceListId: "price-list-1",
        prices: [
          {
            target: "SALE_UNIT",
            targetId: "saved-sale-unit-box",
            price: 1800,
          },
        ],
      },
    ]);
  });

  it("retargets a sale-unit draft to the same catalog unit on a recreated variant", () => {
    const previousProduct = {
      id: "product-1",
      variants: [
        {
          id: "old-variant-xs",
          variantKey: "size=xs",
          kind: "MATRIX",
          saleUnits: [
            {
              id: "old-sale-unit-piece",
              catalogSaleUnitId: "catalog-sale-unit-piece",
              name: "шт",
              baseQuantity: "1.0000",
            },
          ],
        },
      ],
    };
    const nextProduct = {
      id: "product-1",
      variants: [
        {
          id: "new-variant-xs",
          variantKey: "size=xs",
          kind: "MATRIX",
          saleUnits: [
            {
              id: "new-sale-unit-piece",
              catalogSaleUnitId: "catalog-sale-unit-piece",
              name: "шт",
              baseQuantity: "1.0000",
            },
          ],
        },
      ],
    };

    const payload = buildProductPriceListBulkPricesPayload(
      [
        {
          priceListId: "price-list-1",
          rowKey: "SALE_UNIT:old-sale-unit-piece",
          target: "SALE_UNIT",
          targetId: "old-sale-unit-piece",
          price: "350",
        },
      ],
      "integer",
      { product: nextProduct, previousProduct },
    );

    expect(payload).toEqual([
      {
        priceListId: "price-list-1",
        prices: [
          {
            target: "SALE_UNIT",
            targetId: "new-sale-unit-piece",
            price: 350,
          },
        ],
      },
    ]);
  });

  it("keeps sale unit stable keys scoped to their variant", () => {
    const rows = buildProductPriceListRows({
      id: "product-1",
      variants: [
        {
          id: "variant-xs",
          variantKey: "size=xs",
          kind: "MATRIX",
          saleUnits: [
            {
              id: "sale-unit-xs-piece",
              catalogSaleUnitId: "catalog-sale-unit-piece",
              name: "шт",
              baseQuantity: "1.0000",
            },
          ],
        },
      ],
    });

    expect(rows[0]?.stableKeys).not.toContain(
      "sale-unit:any:catalog:catalog-sale-unit-piece",
    );
  });

  it("keeps mixed variant and sale-unit price rows separate", () => {
    const product = {
      id: "product-1",
      variants: [
        {
          id: "variant-xs",
          variantKey: "size=xs",
          kind: "MATRIX",
          saleUnits: [
            {
              id: "sale-unit-xs-piece",
              catalogSaleUnitId: "catalog-sale-unit-piece",
              name: "шт",
              baseQuantity: "1.0000",
            },
          ],
        },
        {
          id: "variant-s",
          variantKey: "size=s",
          kind: "MATRIX",
          saleUnits: [],
        },
      ],
    };

    expect(buildProductPriceListRows(product)).toEqual([
      expect.objectContaining({
        key: "SALE_UNIT:sale-unit-xs-piece",
        target: "SALE_UNIT",
        targetId: "sale-unit-xs-piece",
      }),
      expect.objectContaining({
        key: "VARIANT:variant-s",
        target: "VARIANT",
        targetId: "variant-s",
      }),
    ]);

    expect(
      buildProductPriceListBulkPricesPayload(
        [
          {
            priceListId: "price-list-1",
            rowKey: "SALE_UNIT:sale-unit-xs-piece",
            target: "SALE_UNIT",
            targetId: "sale-unit-xs-piece",
            price: "350",
          },
          {
            priceListId: "price-list-1",
            rowKey: "VARIANT:variant-s",
            target: "VARIANT",
            targetId: "variant-s",
            price: "500",
          },
        ],
        "integer",
        { product },
      ),
    ).toEqual([
      {
        priceListId: "price-list-1",
        prices: [
          {
            target: "SALE_UNIT",
            targetId: "sale-unit-xs-piece",
            price: 350,
          },
          {
            target: "VARIANT",
            targetId: "variant-s",
            price: 500,
          },
        ],
      },
    ]);
  });

  it("retargets mixed draft sale-unit and variant rows after product save", () => {
    const previousProduct = {
      id: "product-1",
      variants: [
        {
          id: "draft-variant:size=xs",
          variantKey: "size=xs",
          kind: "MATRIX",
          saleUnits: [
            {
              id: "draft:catalog-sale-unit-piece:variant:size=xs",
              catalogSaleUnitId: "catalog-sale-unit-piece",
              name: "шт",
              baseQuantity: "1.0000",
            },
          ],
        },
        {
          id: "draft-variant:size=s",
          variantKey: "size=s",
          kind: "MATRIX",
          saleUnits: [],
        },
      ],
    };
    const savedProduct = {
      id: "product-1",
      variants: [
        {
          id: "variant-xs",
          variantKey: "size=xs",
          kind: "MATRIX",
          saleUnits: [
            {
              id: "sale-unit-xs-piece",
              catalogSaleUnitId: "catalog-sale-unit-piece",
              name: "шт",
              baseQuantity: "1.0000",
            },
          ],
        },
        {
          id: "variant-s",
          variantKey: "size=s",
          kind: "MATRIX",
          saleUnits: [],
        },
      ],
    };

    expect(
      buildProductPriceListBulkPricesPayload(
        [
          {
            priceListId: "price-list-1",
            rowKey: "SALE_UNIT:draft:catalog-sale-unit-piece:variant:size=xs",
            target: "SALE_UNIT",
            targetId: "draft:catalog-sale-unit-piece:variant:size=xs",
            price: "350",
          },
          {
            priceListId: "price-list-1",
            rowKey: "VARIANT:draft-variant:size=s",
            target: "VARIANT",
            targetId: "draft-variant:size=s",
            price: "12",
          },
        ],
        "integer",
        {
          product: savedProduct,
          previousProduct,
        },
      ),
    ).toEqual([
      {
        priceListId: "price-list-1",
        prices: [
          {
            target: "SALE_UNIT",
            targetId: "sale-unit-xs-piece",
            price: 350,
          },
          {
            target: "VARIANT",
            targetId: "variant-s",
            price: 12,
          },
        ],
      },
    ]);
  });
});
