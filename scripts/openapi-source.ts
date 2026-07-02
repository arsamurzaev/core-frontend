import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import process from "node:process";

export type OpenApiSource =
  | {
      kind: "file";
      target: string;
      reason: string;
    }
  | {
      kind: "url";
      target: string;
      reason: string;
    };

type ResolveOpenApiSourceOptions = {
  env?: NodeJS.ProcessEnv;
  rootDir?: string;
};

export function resolveOpenApiSource(
  options: ResolveOpenApiSourceOptions = {},
): OpenApiSource {
  const env = options.env ?? process.env;
  const rootDir = options.rootDir ?? process.cwd();
  const envTarget = env.ORVAL_OPENAPI_URL?.trim();

  if (envTarget) {
    return isHttpUrl(envTarget)
      ? { kind: "url", target: envTarget, reason: "ORVAL_OPENAPI_URL" }
      : {
          kind: "file",
          target: resolveFileTarget(rootDir, envTarget),
          reason: "ORVAL_OPENAPI_URL",
        };
  }

  const localOpenApiPath = resolve(rootDir, "runtime/openapi.json");
  if (existsSync(localOpenApiPath)) {
    return {
      kind: "file",
      target: localOpenApiPath,
      reason: "runtime/openapi.json",
    };
  }

  const backendOpenApiPath = resolve(rootDir, "../backend/runtime/openapi.json");
  if (existsSync(backendOpenApiPath)) {
    return {
      kind: "file",
      target: backendOpenApiPath,
      reason: "../backend/runtime/openapi.json",
    };
  }

  const apiBaseUrl = (
    env.NEXT_PUBLIC_API_BASE_URL ??
    env.API_BASE_URL ??
    "http://localhost:4000"
  ).replace(/\/$/, "");

  return {
    kind: "url",
    target: `${apiBaseUrl}/openapi.yaml`,
    reason: "API_BASE_URL fallback",
  };
}

export function formatOpenApiSource(source: OpenApiSource): string {
  return source.kind === "file"
    ? `file ${source.target}`
    : `GET ${source.target}`;
}

function resolveFileTarget(rootDir: string, target: string): string {
  return isAbsolute(target) ? target : resolve(rootDir, target);
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
