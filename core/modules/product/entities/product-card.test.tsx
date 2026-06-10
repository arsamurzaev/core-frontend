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
      `style="min-height:${PRODUCT_CARD_GRID_BASE_HEIGHT_PX}px"`,
    );
  });

  it("renders iiko integration marker on linked products", () => {
    const markup = renderToStaticMarkup(<ProductCard.Content isIikoLinked />);

    expect(markup).toContain('aria-label="Товар из iiko"');
  });

  it("does not reserve header text space in regular grid cards", () => {
    const markup = renderToStaticMarkup(
      <ProductCard.Header
        description=""
        name="Long product name"
        reserveActionSpace
        subtitle="Subtitle"
      />,
    );

    expect(markup).not.toContain("pr-12");
  });

  it("reserves header text space for floating actions in detailed cards", () => {
    const markup = renderToStaticMarkup(
      <ProductCard.Header
        description=""
        isDetailed
        name="Long product name"
        reserveActionSpace
        subtitle="Subtitle"
      />,
    );

    expect(markup).toContain("pr-12");
  });
});
