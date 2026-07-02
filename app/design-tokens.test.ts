import { readFileSync } from "node:fs";
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
});
