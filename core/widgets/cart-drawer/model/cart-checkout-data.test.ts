import { describe, expect, it } from "vitest";
import { formatTimeTextInput, updateCheckoutData } from "./cart-checkout-data";

describe("cart checkout data", () => {
  it("updates plain string fields", () => {
    expect(updateCheckoutData({}, "address", "Main street")).toEqual({
      address: "Main street",
    });
  });

  it("normalizes invalid persons count to undefined instead of NaN", () => {
    expect(updateCheckoutData({ personsCount: 2 }, "personsCount", "")).toEqual({
      personsCount: undefined,
    });
    expect(
      updateCheckoutData({ personsCount: 2 }, "personsCount", "not-a-number"),
    ).toEqual({
      personsCount: undefined,
    });
  });

  it("formats time text input from digits only", () => {
    expect(formatTimeTextInput("1")).toBe("1");
    expect(formatTimeTextInput("123")).toBe("12:3");
    expect(formatTimeTextInput("12:3456")).toBe("12:34");
  });
});
