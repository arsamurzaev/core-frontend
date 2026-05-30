import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PRODUCT_CARD_GRID_BASE_HEIGHT_PX } from "../model/product-card-layout";
import { ProductCard } from "./product-card";

describe("ProductCard", () => {
  it("keeps the grid card base height at 360px", () => {
    const markup = renderToStaticMarkup(
      <ProductCard.Layout>
        <span />
      </ProductCard.Layout>,
    );

    expect(markup).toContain(
      `style="min-height:max(100%, ${PRODUCT_CARD_GRID_BASE_HEIGHT_PX}px)"`,
    );
  });

  it("renders iiko integration marker on linked products", () => {
    const markup = renderToStaticMarkup(<ProductCard.Content isIikoLinked />);

    expect(markup).toContain('aria-label="Товар из iiko"');
  });
});
