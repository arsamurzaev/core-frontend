import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductCard } from "./product-card";

describe("ProductCard", () => {
  it("renders iiko integration marker on linked products", () => {
    const markup = renderToStaticMarkup(<ProductCard.Content isIikoLinked />);

    expect(markup).toContain('aria-label="Товар из iiko"');
  });
});
