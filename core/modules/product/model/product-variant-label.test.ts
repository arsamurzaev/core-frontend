import { describe, expect, it } from "vitest";
import { formatProductVariantLabel } from "./product-variant-label";

describe("formatProductVariantLabel", () => {
  it("uses explicit label first", () => {
    expect(
      formatProductVariantLabel({
        label: "36 / Blue",
        variantKey: "size=36",
        attributes: [],
      }),
    ).toBe("36 / Blue");
  });

  it("builds a stable label from enum values", () => {
    expect(
      formatProductVariantLabel({
        attributes: [
          {
            attribute: { displayName: "Size", key: "size" },
            attributeId: "size",
            enumValue: { displayName: "36", value: "36" },
            enumValueId: "size-36",
          },
          {
            attribute: { displayName: "Color", key: "color" },
            attributeId: "color",
            enumValue: { displayName: "", value: "Blue" },
            enumValueId: "color-blue",
          },
        ],
      }),
    ).toBe("36 / Blue");
  });

  it("can include attribute names for diagnostic labels", () => {
    expect(
      formatProductVariantLabel(
        {
          attributes: [
            {
              attribute: { displayName: "Size" },
              enumValue: { displayName: "36" },
            },
          ],
        },
        { includeAttributeNames: true },
      ),
    ).toBe("Size: 36");
  });
});
