import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const CATALOG_RUNTIME_ROOT = "core/catalog-runtime";
const CORE_VIEWS_ROOT = "core/views";
const EXTENSION_ROOT = "core/catalog-runtime/extensions";
const STOREFRONT_APP_ROOT = "app/(storefront)";
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const PUBLIC_MODULE_ENTRYPOINTS = new Set([
  "@/core/modules/browser",
  "@/core/modules/cart",
  "@/core/modules/catalog-price-list",
  "@/core/modules/category",
  "@/core/modules/integration",
  "@/core/modules/product",
  "@/core/modules/product/editor",
  "@/core/modules/product-modifier",
]);
const MODULE_DEEP_IMPORT_PATTERN =
  /@\/core\/modules\/(?:browser|cart|catalog-price-list|category|integration|product|product-modifier)\/[^"']+/;
const WIDGET_DEEP_IMPORT_PATTERN =
  /@\/core\/widgets\/[^"']+\/(?:ui|model|lib)\/[^"']+/;
const IMPORT_SPECIFIER_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function collectSourceFiles(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }

  return readdirSync(path).flatMap((entry) => {
    const entryPath = join(path, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    return SOURCE_EXTENSIONS.has(extname(entryPath)) ? [entryPath] : [];
  });
}

function extractImportSpecifiers(source: string): string[] {
  return Array.from(source.matchAll(IMPORT_SPECIFIER_PATTERN))
    .map((match) => match[1] ?? match[2])
    .filter((specifier): specifier is string => Boolean(specifier));
}

function getInterfacePropertyNames(source: string, interfaceName: string) {
  const match = source.match(
    new RegExp(`export interface ${interfaceName} \\{([\\s\\S]*?)\\n\\}`),
  );
  const body = match?.[1] ?? "";

  return Array.from(body.matchAll(/^\s+([A-Za-z][A-Za-z0-9]*)\??:/gm)).map(
    (propertyMatch) => propertyMatch[1],
  );
}

describe("catalog runtime slot contracts", () => {
  it("keeps slot prop surfaces explicit", () => {
    const slotContractsSource = readFileSync(
      "core/catalog-runtime/slot-contracts.ts",
      "utf8",
    );

    expect(getInterfacePropertyNames(slotContractsSource, "BrowserSlotProps")).toEqual([
      "className",
      "initialCategories",
      "catalogTabLabel",
      "categoryAdminCreateDescription",
      "categoryAdminEditDescription",
      "categoryCardVariant",
      "supportsBrands",
      "supportsCategoryDetails",
    ]);
    expect(
      getInterfacePropertyNames(slotContractsSource, "CartCardActionSlotProps"),
    ).toEqual(["productId", "item"]);
    expect(
      getInterfacePropertyNames(slotContractsSource, "CatalogRuntimeSlots"),
    ).toEqual(["Browser", "CartCardAction"]);
  });

  it("keeps cart action slots on the cart view model public contract", () => {
    const slotContractsSource = readFileSync(
      "core/catalog-runtime/slot-contracts.ts",
      "utf8",
    );
    const slotsSource = readFileSync(
      "core/catalog-runtime/use-catalog-runtime-slots.ts",
      "utf8",
    );

    expect(slotContractsSource).toContain(
      'import type { CartItemView } from "@/core/modules/cart";',
    );
    expect(slotsSource).toContain(
      'import type { CartItemView } from "@/core/modules/cart";',
    );
    expect(slotContractsSource).not.toContain("CartItemDto");
    expect(slotsSource).not.toContain("CartItemDto");
    expect(slotContractsSource).not.toContain(
      "@/core/modules/cart/model/cart-item-view",
    );
    expect(slotsSource).not.toContain(
      "@/core/modules/cart/model/cart-item-view",
    );
  });

  it("keeps metadata contracts and server facade free from runtime implementation", () => {
    const metadataContractsSource = readFileSync(
      "core/catalog-runtime/metadata-contracts.ts",
      "utf8",
    );
    const serverSource = readFileSync("core/catalog-runtime/server.ts", "utf8");
    const storefrontCompositionSource = readFileSync(
      "core/catalog-runtime/storefront-composition.ts",
      "utf8",
    );
    const orderPoliciesSource = readFileSync(
      "core/catalog-runtime/order-policies.ts",
      "utf8",
    );

    expect(metadataContractsSource).not.toContain("React");
    expect(metadataContractsSource).not.toContain("next/dynamic");
    expect(metadataContractsSource).not.toContain("./registry");
    expect(metadataContractsSource).not.toContain("./resolve-catalog-runtime");
    expect(serverSource).not.toContain("./registry");
    expect(serverSource).not.toContain("./resolve-catalog-runtime");
    expect(serverSource).not.toContain("./use-catalog-runtime");
    expect(storefrontCompositionSource).not.toContain("React");
    expect(storefrontCompositionSource).not.toContain("next/dynamic");
    expect(storefrontCompositionSource).not.toContain("./registry");
    expect(storefrontCompositionSource).not.toContain(
      "./resolve-catalog-runtime",
    );
    expect(orderPoliciesSource).not.toContain("React");
    expect(orderPoliciesSource).not.toContain("next/dynamic");
    expect(orderPoliciesSource).not.toContain("./registry");
    expect(orderPoliciesSource).not.toContain("./resolve-catalog-runtime");
  });

  it("keeps runtime extensions on slot contracts and public module entrypoints", () => {
    const violations = collectSourceFiles(EXTENSION_ROOT).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const imports = extractImportSpecifiers(source);

      return imports.flatMap((specifier) => {
        if (
          specifier.startsWith("@/shared/api/generated") ||
          specifier.startsWith("@/shared/api/server")
        ) {
          return [`${file} imports direct API ${specifier}`];
        }

        if (
          MODULE_DEEP_IMPORT_PATTERN.test(specifier) &&
          !PUBLIC_MODULE_ENTRYPOINTS.has(specifier)
        ) {
          return [`${file} imports module internal ${specifier}`];
        }

        if (
          specifier === "@/core/catalog-runtime/registry" ||
          specifier === "@/core/catalog-runtime/resolve-catalog-runtime" ||
          specifier === "@/core/catalog-runtime/use-catalog-runtime" ||
          specifier === "@/core/catalog-runtime/use-catalog-runtime-slots"
        ) {
          return [`${file} imports runtime implementation ${specifier}`];
        }

        if (specifier.includes("sandbox")) {
          return [`${file} imports sandbox ${specifier}`];
        }

        return [];
      });
    });

    expect(violations).toEqual([]);
  });

  it("keeps runtime, views and storefront app on widget public entrypoints", () => {
    const violations = [
      CATALOG_RUNTIME_ROOT,
      CORE_VIEWS_ROOT,
      STOREFRONT_APP_ROOT,
    ].flatMap((root) =>
      collectSourceFiles(root).flatMap((file) => {
        const source = readFileSync(file, "utf8");
        const imports = extractImportSpecifiers(source);

        return imports.flatMap((specifier) =>
          WIDGET_DEEP_IMPORT_PATTERN.test(specifier)
            ? [`${file} imports widget internal ${specifier}`]
            : [],
        );
      }),
    );

    expect(violations).toEqual([]);
  });
});
