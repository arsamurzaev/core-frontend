import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { describe, expect, it } from "vitest";

const WORKSPACE_ROOT = process.cwd();
const SOURCE_ROOTS = ["app", "core", "shared"] as const;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const IMPORT_SPECIFIER_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

interface ImportEdge {
  filePath: string;
  resolvedPath: string | null;
  specifier: string;
}

interface BoundaryRule {
  message: string;
  sourcePath: string;
  targetPath: string;
}

interface DeepImportReportItem {
  filePath: string;
  sourceOwner: string;
  specifier: string;
  targetBaseOwner: string;
  targetOwner: string;
}

interface DeepImportReportGroup {
  count: number;
  examples: DeepImportReportItem[];
  sourceOwner: string;
  targets: Map<string, number>;
}

const BOUNDARY_RULES: BoundaryRule[] = [
  {
    message: "shared must not import core",
    sourcePath: "shared",
    targetPath: "core",
  },
  {
    message: "shared must not import app",
    sourcePath: "shared",
    targetPath: "app",
  },
  {
    message: "core must not import app",
    sourcePath: "core",
    targetPath: "app",
  },
  {
    message: "core/modules must not import core/widgets",
    sourcePath: "core/modules",
    targetPath: "core/widgets",
  },
  {
    message: "core/modules must not import core/views",
    sourcePath: "core/modules",
    targetPath: "core/views",
  },
  {
    message: "core/bridges must not import core/widgets",
    sourcePath: "core/bridges",
    targetPath: "core/widgets",
  },
  {
    message: "core/bridges must not import core/views",
    sourcePath: "core/bridges",
    targetPath: "core/views",
  },
  {
    message: "core/bridges must not import core/catalog-runtime",
    sourcePath: "core/bridges",
    targetPath: "core/catalog-runtime",
  },
  {
    message: "production source must not import sandbox",
    sourcePath: ".",
    targetPath: "sandbox",
  },
  {
    message: "catalog runtime extensions must not import sandbox",
    sourcePath: "core/catalog-runtime/extensions",
    targetPath: "sandbox",
  },
  {
    message: "generated api must not import app",
    sourcePath: "shared/api/generated",
    targetPath: "app",
  },
  {
    message: "generated api must not import core",
    sourcePath: "shared/api/generated",
    targetPath: "core",
  },
  {
    message: "generated api must not import sandbox",
    sourcePath: "shared/api/generated",
    targetPath: "sandbox",
  },
];

const PUBLIC_MODULE_IMPORT_DEBT_BASELINE = 0;
const CROSS_OWNER_DEEP_IMPORT_DEBT_BASELINE = 0;
const PUBLIC_MODULE_IMPORT_SOURCES = [
  "app",
  "core/catalog-runtime",
  "core/bridges",
  "core/views",
  "core/widgets",
] as const;
const PUBLIC_MODULE_ENTRYPOINT_SPECIFIERS = new Set([
  "@/core/modules/browser",
  "@/core/modules/cart",
  "@/core/modules/catalog-price-list",
  "@/core/modules/category",
  "@/core/modules/integration",
  "@/core/modules/product",
  "@/core/modules/product/editor",
  "@/core/modules/product-modifier",
]);
const PUBLIC_VIEW_ENTRYPOINT_SPECIFIERS = new Set([
  "@/core/views/home",
  "@/core/views/home/browser",
  "@/core/views/login",
  "@/core/views/platform",
]);
const PUBLIC_MODULE_DEEP_IMPORT_PATTERN =
  /^@\/core\/modules\/(?:browser|cart|catalog-price-list|category|integration|product|product-modifier)\/.+/;
const DEEP_IMPORT_REPORT_LIMIT = 10;
const DEEP_IMPORT_REPORT_EXAMPLE_LIMIT = 3;
const WIDGET_INTERNAL_SEGMENTS = new Set(["ui", "model", "lib"]);

function getExtension(filePath: string): string {
  const match = filePath.match(/(\.[^.]+)$/);
  return match?.[1] ?? "";
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function isTestFile(filePath: string): boolean {
  return (
    filePath.endsWith(".test.ts") ||
    filePath.endsWith(".test.tsx") ||
    filePath.endsWith(".spec.ts") ||
    filePath.endsWith(".spec.tsx")
  );
}

function isInsidePath(childPath: string, parentPath: string): boolean {
  const path = relative(parentPath, childPath);

  return path === "" || (path !== "" && !path.startsWith("..") && !isAbsolute(path));
}

function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return collectSourceFiles(path);
    }

    if (!SOURCE_EXTENSIONS.has(getExtension(path)) || isTestFile(path)) {
      return [];
    }

    return [path];
  });
}

function extractImportSpecifiers(source: string): string[] {
  return Array.from(source.matchAll(IMPORT_SPECIFIER_PATTERN))
    .map((match) => match[1] ?? match[2])
    .filter((specifier): specifier is string => Boolean(specifier));
}

function resolveImportSpecifier(
  filePath: string,
  specifier: string,
): string | null {
  if (specifier.startsWith("@/")) {
    return resolve(WORKSPACE_ROOT, specifier.slice(2));
  }

  if (specifier.startsWith(".")) {
    return resolve(dirname(filePath), specifier);
  }

  return null;
}

function collectImportEdges(): ImportEdge[] {
  return SOURCE_ROOTS.flatMap((root) =>
    collectSourceFiles(join(WORKSPACE_ROOT, root)).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");

      return extractImportSpecifiers(source).map((specifier) => ({
        filePath,
        resolvedPath: resolveImportSpecifier(filePath, specifier),
        specifier,
      }));
    }),
  );
}

function getRuleViolations(rule: BoundaryRule, edges: ImportEdge[]): string[] {
  const sourceRoot = resolve(WORKSPACE_ROOT, rule.sourcePath);
  const targetRoot = resolve(WORKSPACE_ROOT, rule.targetPath);

  return edges.flatMap((edge) => {
    if (!edge.resolvedPath) {
      return [];
    }

    if (
      !isInsidePath(edge.filePath, sourceRoot) ||
      !isInsidePath(edge.resolvedPath, targetRoot)
    ) {
      return [];
    }

    return [
      `${relative(WORKSPACE_ROOT, edge.filePath)} -> ${edge.specifier}`,
    ];
  });
}

function isPublicModuleImportSource(filePath: string): boolean {
  return PUBLIC_MODULE_IMPORT_SOURCES.some((sourcePath) =>
    isInsidePath(filePath, resolve(WORKSPACE_ROOT, sourcePath)),
  );
}

function getPublicModuleEntrypointDebt(edges: ImportEdge[]): string[] {
  return edges.flatMap((edge) => {
    if (
      !isPublicModuleImportSource(edge.filePath) ||
      !PUBLIC_MODULE_DEEP_IMPORT_PATTERN.test(edge.specifier) ||
      PUBLIC_MODULE_ENTRYPOINT_SPECIFIERS.has(edge.specifier)
    ) {
      return [];
    }

    return [`${relative(WORKSPACE_ROOT, edge.filePath)} -> ${edge.specifier}`];
  });
}

function getCoreModuleOwner(parts: string[]): string | null {
  if (parts[0] !== "core" || parts[1] !== "modules" || !parts[2]) {
    return null;
  }

  if (parts[2] === "product" && parts[3] === "editor") {
    return "core/modules/product/editor";
  }

  return `core/modules/${parts[2]}`;
}

function getOwnerFromPath(path: string): string {
  const normalizedPath = normalizePath(relative(WORKSPACE_ROOT, path));
  const parts = normalizedPath.split("/");
  const moduleOwner = getCoreModuleOwner(parts);

  if (moduleOwner) {
    return moduleOwner;
  }

  if (parts[0] === "core" && parts[1] === "widgets" && parts[2]) {
    return `core/widgets/${parts[2]}`;
  }

  if (parts[0] === "core" && parts[1] === "catalog-runtime") {
    return parts[2] === "extensions" && parts[3]
      ? `core/catalog-runtime/extensions/${parts[3]}`
      : "core/catalog-runtime";
  }

  if (parts[0] === "core" && parts[1] === "views" && parts[2]) {
    return `core/views/${parts[2]}`;
  }

  if (parts[0] === "app" && parts[1]) {
    return `app/${parts[1]}`;
  }

  if (parts[0] === "shared" && parts[1]) {
    return `shared/${parts[1]}`;
  }

  return parts[0] ?? normalizedPath;
}

function getReportableTarget(specifier: string): {
  baseOwner: string;
  owner: string;
} | null {
  if (!specifier.startsWith("@/")) {
    return null;
  }

  if (
    PUBLIC_MODULE_DEEP_IMPORT_PATTERN.test(specifier) &&
    !PUBLIC_MODULE_ENTRYPOINT_SPECIFIERS.has(specifier)
  ) {
    const owner = getCoreModuleOwner(specifier.slice(2).split("/"));

    return owner
      ? {
          baseOwner: owner,
          owner: `${owner}/internal`,
        }
      : null;
  }

  const parts = specifier.slice(2).split("/");

  if (
    parts[0] === "core" &&
    parts[1] === "widgets" &&
    parts[2] &&
    WIDGET_INTERNAL_SEGMENTS.has(parts[3] ?? "")
  ) {
    return {
      baseOwner: `core/widgets/${parts[2]}`,
      owner: `core/widgets/${parts[2]}/${parts[3]}`,
    };
  }

  if (
    parts[0] === "core" &&
    parts[1] === "views" &&
    parts.length > 3 &&
    !PUBLIC_VIEW_ENTRYPOINT_SPECIFIERS.has(specifier)
  ) {
    const owner = `core/views/${parts[2] ?? "unknown"}`;

    return {
      baseOwner: owner,
      owner: `${owner}/internal`,
    };
  }

  return null;
}

function getDeepImportReportItems(edges: ImportEdge[]): DeepImportReportItem[] {
  return edges.flatMap((edge) => {
    const sourceOwner = getOwnerFromPath(edge.filePath);
    const target = getReportableTarget(edge.specifier);

    if (!target || target.baseOwner === sourceOwner) {
      return [];
    }

    return [
      {
        filePath: normalizePath(relative(WORKSPACE_ROOT, edge.filePath)),
        sourceOwner,
        specifier: edge.specifier,
        targetBaseOwner: target.baseOwner,
        targetOwner: target.owner,
      },
    ];
  });
}

function getCrossOwnerDeepImportDebt(edges: ImportEdge[]): string[] {
  return getDeepImportReportItems(edges).map(
    (item) => `${item.filePath} -> ${item.specifier}`,
  );
}

function formatDeepImportReport(edges: ImportEdge[]): string {
  const groups = Array.from(
    getDeepImportReportItems(edges)
      .reduce((result, item) => {
        const existing = result.get(item.sourceOwner) ?? {
          count: 0,
          examples: [],
          sourceOwner: item.sourceOwner,
          targets: new Map<string, number>(),
        };

        existing.count += 1;
        existing.targets.set(
          item.targetOwner,
          (existing.targets.get(item.targetOwner) ?? 0) + 1,
        );

        if (existing.examples.length < DEEP_IMPORT_REPORT_EXAMPLE_LIMIT) {
          existing.examples.push(item);
        }

        result.set(item.sourceOwner, existing);

        return result;
      }, new Map<string, DeepImportReportGroup>())
      .values(),
  ).sort((left, right) => right.count - left.count);

  if (groups.length === 0) {
    return "Top deep import debt sources:\nNo reportable deep alias imports.";
  }

  return [
    "Top deep import debt sources:",
    ...groups.slice(0, DEEP_IMPORT_REPORT_LIMIT).flatMap((group) => {
      const targetSummary = Array.from(group.targets.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, DEEP_IMPORT_REPORT_EXAMPLE_LIMIT)
        .map(([targetOwner, count]) => `${targetOwner}: ${count}`)
        .join(", ");

      return [
        `- ${group.sourceOwner}: ${group.count} (${targetSummary})`,
        ...group.examples.map(
          (item) => `  example: ${item.filePath} -> ${item.specifier}`,
        ),
      ];
    }),
  ].join("\n");
}

describe("architecture boundaries", () => {
  const edges = collectImportEdges();

  it.each(BOUNDARY_RULES)("$message", (rule) => {
    expect(getRuleViolations(rule, edges)).toEqual([]);
  });

  it("does not increase public module entrypoint debt", () => {
    const debt = getPublicModuleEntrypointDebt(edges);

    if (process.env.ARCHITECTURE_REPORT === "1" && debt.length > 0) {
      console.info(
        [
          "Public module entrypoint debt:",
          ...debt.map((violation) => `- ${violation}`),
        ].join("\n"),
      );
    }

    expect(debt.length).toBeLessThanOrEqual(PUBLIC_MODULE_IMPORT_DEBT_BASELINE);
  });

  it("does not increase cross-owner deep import debt", () => {
    const debt = getCrossOwnerDeepImportDebt(edges);

    if (process.env.ARCHITECTURE_REPORT === "1" && debt.length > 0) {
      console.info(
        [
          "Cross-owner deep import debt:",
          ...debt.map((violation) => `- ${violation}`),
        ].join("\n"),
      );
    }

    expect(debt.length).toBeLessThanOrEqual(
      CROSS_OWNER_DEEP_IMPORT_DEBT_BASELINE,
    );
  });

  it("can report top deep import debt sources", () => {
    const report = formatDeepImportReport(edges);

    if (process.env.ARCHITECTURE_REPORT === "1") {
      console.info(report);
    }

    expect(report).toContain("Top deep import debt sources:");
  });
});
