import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["app", "core", "sandbox", "shared"] as const;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".md"]);
const SKIPPED_PATH_PARTS = [
  join("shared", "api", "generated"),
  "node_modules",
  ".next",
];

const MOJIBAKE_MARKERS = [
  "\u0420\u045f",
  "\u0420\u040b",
  "\u0420\u045a",
  "\u0420\u045c",
  "\u0420\u0408",
  "\u0420\u0409",
  "\u0420\u2014",
  "\u0420\u040e",
  "\u0420\u00a0",
  "\u0421\u040a",
  "\u0421\u0453",
  "\u0421\u201a",
  "\u0421\u0402",
  "\u0421\u2039",
  "\u0421\u2021",
  "\u0421\u20ac",
  "\u0421\u2030",
] as const;

function hasSkippedPathPart(filePath: string): boolean {
  return SKIPPED_PATH_PARTS.some((part) => filePath.includes(part));
}

function getExtension(filePath: string): string {
  const index = filePath.lastIndexOf(".");
  return index === -1 ? "" : filePath.slice(index);
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);

    if (hasSkippedPathPart(fullPath)) {
      return [];
    }

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return SOURCE_EXTENSIONS.has(getExtension(fullPath)) ? [fullPath] : [];
  });
}

describe("source text encoding", () => {
  it("does not contain common UTF-8/Windows-1251 mojibake markers", () => {
    const offenders = SOURCE_ROOTS.flatMap((root) => collectSourceFiles(root))
      .flatMap((filePath) => {
        const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

        return lines.flatMap((line, index) =>
          MOJIBAKE_MARKERS.some((marker) => line.includes(marker))
            ? [`${filePath}:${index + 1}`]
            : [],
        );
      });

    expect(offenders).toEqual([]);
  });
});
