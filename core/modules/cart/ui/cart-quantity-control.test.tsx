import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  CART_QUANTITY_CONTROL_LABELS,
  CartQuantityControl,
} from "./cart-quantity-control";

describe("CartQuantityControl", () => {
  it("disables increment and decrement independently", () => {
    const html = renderToStaticMarkup(
      <CartQuantityControl
        decrementContent="-"
        decrementDisabled
        incrementContent="+"
        incrementDisabled
        onDecrement={vi.fn()}
        onIncrement={vi.fn()}
        value={2}
      />,
    );

    expect(html).toContain(CART_QUANTITY_CONTROL_LABELS.decrease);
    expect(html).toContain(CART_QUANTITY_CONTROL_LABELS.increase);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("renders enabled quantity controls with the current value", () => {
    const html = renderToStaticMarkup(
      <CartQuantityControl
        decrementContent="-"
        incrementContent="+"
        onDecrement={vi.fn()}
        onIncrement={vi.fn()}
        value={2}
      />,
    );

    expect(html).toContain(">2</p>");
    expect(html).not.toContain("disabled");
  });
});
