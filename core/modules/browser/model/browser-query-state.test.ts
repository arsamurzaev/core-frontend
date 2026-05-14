import { describe, expect, it } from "vitest";
import type { CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import {
  buildBrowserQueryHref,
  getBrowserFilterQueryKey,
  getBrowserPanelState,
  getNextBrowserFilterQueryState,
  getNextBrowserTabQueryState,
  normalizeBrowserTabValue,
} from "./browser-query-state";

function queryState(
  overrides: Partial<CatalogFilterQueryState> = {},
): CatalogFilterQueryState {
  return {
    tab: "catalog",
    filter: undefined,
    categories: [],
    brands: [],
    isPopular: undefined,
    isDiscount: undefined,
    searchTerm: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    ...overrides,
  };
}

describe("normalizeBrowserTabValue", () => {
  it("keeps only known tab values", () => {
    expect(normalizeBrowserTabValue("categories")).toBe("categories");
    expect(normalizeBrowserTabValue("catalog")).toBe("catalog");
    expect(normalizeBrowserTabValue("unknown")).toBe("catalog");
  });
});

describe("getBrowserPanelState", () => {
  it("maps tab to panel index and swipe translate", () => {
    expect(getBrowserPanelState(queryState())).toEqual({
      activePanelIndex: 0,
      swipeTranslatePercent: 0,
    });
    expect(getBrowserPanelState(queryState({ tab: "categories" }))).toEqual({
      activePanelIndex: 1,
      swipeTranslatePercent: 50,
    });
  });
});

describe("getNextBrowserTabQueryState", () => {
  it("changes only requested tab", () => {
    expect(
      getNextBrowserTabQueryState(
        queryState({
          categories: ["coffee"],
          filter: true,
        }),
        "categories",
      ),
    ).toEqual(
      queryState({
        categories: ["coffee"],
        filter: true,
        tab: "categories",
      }),
    );
  });
});

describe("getNextBrowserFilterQueryState", () => {
  it("toggles filter mode when no patch is provided", () => {
    expect(
      getNextBrowserFilterQueryState({
        isFilterActive: false,
        queryState: queryState(),
      }),
    ).toMatchObject({
      filter: true,
      tab: "catalog",
    });

    expect(
      getNextBrowserFilterQueryState({
        isFilterActive: true,
        queryState: queryState({
          categories: ["coffee"],
          filter: true,
          tab: "categories",
        }),
      }),
    ).toEqual(queryState());
  });

  it("applies patches and clears filter flag when no filter values remain", () => {
    expect(
      getNextBrowserFilterQueryState({
        isFilterActive: true,
        patch: {
          brands: [],
        },
        queryState: queryState({
          brands: ["brand-1"],
          filter: true,
        }),
      }),
    ).toEqual(queryState());
  });

  it("applies patches and enables filter flag when values remain", () => {
    expect(
      getNextBrowserFilterQueryState({
        isFilterActive: false,
        patch: {
          searchTerm: " latte ",
        },
        queryState: queryState({ tab: "categories" }),
      }),
    ).toEqual(
      queryState({
        filter: true,
        searchTerm: " latte ",
      }),
    );
  });
});

describe("buildBrowserQueryHref", () => {
  it("preserves unrelated params while applying browser state", () => {
    expect(
      buildBrowserQueryHref({
        pathname: "/",
        queryState: queryState({
          categories: ["coffee", "tea"],
          filter: true,
        }),
        searchParams: new URLSearchParams("catalog=demo&categories=old"),
      }),
    ).toBe("/?catalog=demo&filter=true&categories=coffee%2Ctea");
  });

  it("removes query string when no params remain", () => {
    expect(
      buildBrowserQueryHref({
        pathname: "/menu",
        queryState: queryState(),
        searchParams: new URLSearchParams(),
      }),
    ).toBe("/menu");
  });
});

describe("getBrowserFilterQueryKey", () => {
  it("contains only filter-related state", () => {
    expect(
      getBrowserFilterQueryKey(
        queryState({
          brands: ["brand-1"],
          isDiscount: true,
        }),
      ),
    ).toBe("brands=brand-1&isDiscount=true");
  });
});
