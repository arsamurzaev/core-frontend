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

const BOUNDARY_RULES: BoundaryRule[] = [
  {
    message: "shared must not import core",
    sourcePath: "shared",
    targetPath: "core",
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

function getExtension(filePath: string): string {
  const match = filePath.match(/(\.[^.]+)$/);
  return match?.[1] ?? "";
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

describe("architecture boundaries", () => {
  const edges = collectImportEdges();

  it.each(BOUNDARY_RULES)("$message", (rule) => {
    expect(getRuleViolations(rule, edges)).toEqual([]);
  });
});
