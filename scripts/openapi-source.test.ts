import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveOpenApiSource } from "./openapi-source";

function createWorkspace() {
  return mkdtempSync(join(tmpdir(), "catalog-openapi-source-"));
}

describe("resolveOpenApiSource", () => {
  it("prefers ORVAL_OPENAPI_URL when it is an HTTP URL", () => {
    const rootDir = createWorkspace();

    expect(
      resolveOpenApiSource({
        rootDir,
        env: { ORVAL_OPENAPI_URL: "https://example.test/openapi.yaml" },
      }),
    ).toEqual({
      kind: "url",
      target: "https://example.test/openapi.yaml",
      reason: "ORVAL_OPENAPI_URL",
    });
  });

  it("supports ORVAL_OPENAPI_URL as a file path", () => {
    const rootDir = createWorkspace();

    expect(
      resolveOpenApiSource({
        rootDir,
        env: { ORVAL_OPENAPI_URL: "runtime/openapi.json" },
      }),
    ).toEqual({
      kind: "file",
      target: resolve(rootDir, "runtime/openapi.json"),
      reason: "ORVAL_OPENAPI_URL",
    });
  });

  it("prefers the local runtime OpenAPI file when it exists", () => {
    const rootDir = createWorkspace();
    const runtimeDir = join(rootDir, "runtime");
    mkdirSync(runtimeDir);
    writeFileSync(join(runtimeDir, "openapi.json"), "{}");

    expect(resolveOpenApiSource({ rootDir, env: {} })).toEqual({
      kind: "file",
      target: join(runtimeDir, "openapi.json"),
      reason: "runtime/openapi.json",
    });
  });

  it("falls back to the sibling backend runtime OpenAPI file", () => {
    const rootDir = join(createWorkspace(), "frontend");
    const backendRuntimeDir = resolve(rootDir, "../backend/runtime");
    mkdirSync(backendRuntimeDir, { recursive: true });
    writeFileSync(join(backendRuntimeDir, "openapi.json"), "{}");

    expect(resolveOpenApiSource({ rootDir, env: {} })).toEqual({
      kind: "file",
      target: join(backendRuntimeDir, "openapi.json"),
      reason: "../backend/runtime/openapi.json",
    });
  });

  it("falls back to the configured API base URL", () => {
    const rootDir = createWorkspace();

    expect(
      resolveOpenApiSource({
        rootDir,
        env: { API_BASE_URL: "https://api.example.test/" },
      }),
    ).toEqual({
      kind: "url",
      target: "https://api.example.test/openapi.yaml",
      reason: "API_BASE_URL fallback",
    });
  });
});
