import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const PRODUCTION_ROOTS = ["app", "core", "shared"] as const;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SANDBOX_IMPORT_ALIAS = ["@", "/sandbox/"].join("");

function getExtension(filePath: string): string {
  const match = filePath.match(/(\.[^.]+)$/);
  return match?.[1] ?? "";
}

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return collectSourceFiles(path);
    }

    if (
      !SOURCE_EXTENSIONS.has(getExtension(path)) ||
      path.endsWith(".test.ts") ||
      path.endsWith(".test.tsx")
    ) {
      return [];
    }

    return [path];
  });
}

describe("sandbox boundary", () => {
  it("keeps production source imports away from sandbox", () => {
    const violations = PRODUCTION_ROOTS.flatMap((root) =>
      collectSourceFiles(root).flatMap((filePath) => {
        const source = readFileSync(filePath, "utf8");

        return source.includes(SANDBOX_IMPORT_ALIAS)
          ? [relative(process.cwd(), filePath)]
          : [];
      }),
    );

    expect(violations).toEqual([]);
  });
});
