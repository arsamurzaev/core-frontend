import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { CATALOG_THEME_PRESETS } from "@/core/catalog-runtime/theme";
import { describe, expect, it } from "vitest";

const GLOBALS_CSS = readFileSync("app/globals.css", "utf8");

const THEME_TOKENS = [
  "--color-surface-base",
  "--color-surface-raised",
  "--color-surface-overlay",
  "--color-surface-muted",
  "--color-text-primary",
  "--color-text-secondary",
  "--color-line-default",
  "--color-line-subtle",
  "--color-action-primary",
  "--color-action-secondary",
  "--color-status-danger",
  "--color-status-warning",
  "--color-status-success",
  "--color-status-info",
  "--radius-panel",
  "--radius-control",
  "--radius-pill",
  "--shadow-surface",
  "--shadow-control",
  "--shadow-overlay",
] as const;

const ROOT_TOKENS = [
  "--surface-base",
  "--surface-raised",
  "--surface-overlay",
  "--surface-muted",
  "--text-primary",
  "--text-secondary",
  "--line-default",
  "--line-subtle",
  "--action-primary",
  "--action-secondary",
  "--status-danger",
  "--status-warning",
  "--status-success",
  "--status-info",
  "--semantic-radius-panel",
  "--semantic-radius-control",
  "--semantic-radius-pill",
  "--elevation-surface",
  "--elevation-control",
  "--elevation-overlay",
] as const;

const SCAN_ROOTS = ["app", "core", "shared"] as const;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SKIPPED_SOURCE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /^shared\/api\/generated(?:\/|$)/,
] as const;

const LEGACY_CLASS_PATTERNS = [
  ["text-muted-foreground", /(?<![A-Za-z0-9-])text-muted-foreground(?![A-Za-z0-9-])/g],
  ["text-muted", /(?<![A-Za-z0-9-])text-muted(?![A-Za-z0-9-])/g],
  ["text-destructive", /(?<![A-Za-z0-9-])text-destructive(?![A-Za-z0-9-])/g],
  ["bg-destructive", /(?<![A-Za-z0-9-])bg-destructive(?![A-Za-z0-9-])/g],
  ["border-destructive", /(?<![A-Za-z0-9-])border-destructive(?![A-Za-z0-9-])/g],
  ["bg-background", /(?<![A-Za-z0-9-])bg-background(?![A-Za-z0-9-])/g],
  ["text-foreground", /(?<![A-Za-z0-9-])text-foreground(?![A-Za-z0-9-])/g],
  ["rounded-full", /(?<![A-Za-z0-9-])rounded-full(?![A-Za-z0-9-])/g],
  ["rounded-md", /(?<![A-Za-z0-9-])rounded-md(?![A-Za-z0-9-])/g],
  ["rounded-lg", /(?<![A-Za-z0-9-])rounded-lg(?![A-Za-z0-9-])/g],
  ["rounded-xl", /(?<![A-Za-z0-9-])rounded-xl(?![A-Za-z0-9-])/g],
  ["rounded-2xl", /(?<![A-Za-z0-9-])rounded-2xl(?![A-Za-z0-9-])/g],
  ["rounded-3xl", /(?<![A-Za-z0-9-])rounded-3xl(?![A-Za-z0-9-])/g],
  ["shadow-custom", /(?<![A-Za-z0-9-])shadow-custom(?![A-Za-z0-9-])/g],
  ["shadow-sm", /(?<![A-Za-z0-9-])shadow-sm(?![A-Za-z0-9-])/g],
  ["shadow-xl", /(?<![A-Za-z0-9-])shadow-xl(?![A-Za-z0-9-])/g],
  ["bg-white", /(?<![A-Za-z0-9-])bg-white(?![A-Za-z0-9-])/g],
  ["hover:bg-white", /(?<![A-Za-z0-9-])hover:bg-white(?![A-Za-z0-9-])/g],
  ["bg-black", /(?<![A-Za-z0-9-])bg-black(?![A-Za-z0-9-])/g],
  ["text-white", /(?<![A-Za-z0-9-])text-white(?![A-Za-z0-9-])/g],
  ["text-[#...]", /(?<![A-Za-z0-9-])text-\[#[^\]]+\]/g],
  ["ring-ring", /(?<![A-Za-z0-9-])ring-ring(?![A-Za-z0-9-])/g],
  ["border-neutral", /(?<![A-Za-z0-9-])border-neutral-[0-9]+(?![A-Za-z0-9-])/g],
  ["bg-neutral", /(?<![A-Za-z0-9-])bg-neutral-[0-9]+(?![A-Za-z0-9-])/g],
  ["text-neutral", /(?<![A-Za-z0-9-])text-neutral-[0-9]+(?![A-Za-z0-9-])/g],
  ["bg-emerald", /(?<![A-Za-z0-9-])bg-emerald-[0-9]+(?![A-Za-z0-9-])/g],
  ["text-emerald", /(?<![A-Za-z0-9-])text-emerald-[0-9]+(?![A-Za-z0-9-])/g],
  ["bg-secondary", /(?<![A-Za-z0-9-])bg-secondary(?![A-Za-z0-9-])/g],
  ["bg-muted", /(?<![A-Za-z0-9-])bg-muted(?![A-Za-z0-9-])/g],
] as const;

function getCssBlock(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = GLOBALS_CSS.match(
    new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );

  return match?.[1] ?? "";
}

function expectTokens(block: string, tokens: readonly string[]) {
  const missing = tokens.filter((token) => !block.includes(`${token}:`));

  expect(missing).toEqual([]);
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function shouldSkipSourceFile(path: string): boolean {
  const normalizedPath = normalizePath(path);

  return SKIPPED_SOURCE_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function collectSourceFiles(path: string, files: string[] = []): string[] {
  for (const entry of readdirSync(path)) {
    const entryPath = join(path, entry);
    const normalizedPath = normalizePath(entryPath);

    if (shouldSkipSourceFile(normalizedPath)) {
      continue;
    }

    const stats = statSync(entryPath);
    if (stats.isDirectory()) {
      collectSourceFiles(entryPath, files);
      continue;
    }

    if (SOURCE_EXTENSIONS.has(extname(entryPath))) {
      files.push(entryPath);
    }
  }

  return files;
}

function getLineNumber(source: string, index: number): number {
  return source.slice(0, index).split(/\r?\n/).length;
}

describe("design tokens", () => {
  it("exposes semantic tokens to Tailwind", () => {
    expectTokens(getCssBlock("@theme inline"), THEME_TOKENS);
  });

  it("defines runtime semantic token values", () => {
    expectTokens(getCssBlock(":root"), ROOT_TOKENS);
  });

  it("keeps dark-mode status and elevation overrides explicit", () => {
    expectTokens(getCssBlock(".dark"), [
      "--status-warning",
      "--status-warning-foreground",
      "--status-success",
      "--status-success-foreground",
      "--status-info-surface",
      "--elevation-surface",
      "--elevation-control",
      "--elevation-overlay",
    ]);
  });

  it("keeps source files off legacy visual utility classes", () => {
    const violations = SCAN_ROOTS.flatMap((root) =>
      collectSourceFiles(root).flatMap((file) => {
        const source = readFileSync(file, "utf8");
        const normalizedPath = normalizePath(file);

        return LEGACY_CLASS_PATTERNS.flatMap(([name, pattern]) =>
          Array.from(source.matchAll(pattern), (match) => {
            const line = getLineNumber(source, match.index ?? 0);

            return `${normalizedPath}:${line} uses ${name}`;
          }),
        );
      }),
    );

    expect(violations).toEqual([]);
  });

  it("keeps catalog theme presets on semantic token overrides", () => {
    const semanticTokens = new Set(ROOT_TOKENS);
    const unknownTokens = Object.values(CATALOG_THEME_PRESETS).flatMap(
      (preset) =>
        Object.keys(preset.tokenOverrides).filter(
          (token) => !semanticTokens.has(token as (typeof ROOT_TOKENS)[number]),
        ),
    );

    expect(Object.keys(CATALOG_THEME_PRESETS)).toEqual([
      "default",
      "restaurant",
      "wholesale",
    ]);
    expect(unknownTokens).toEqual([]);
  });
});
