import { readFile, stat } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  formatOpenApiSource,
  type OpenApiSource,
  resolveOpenApiSource,
} from "./openapi-source";

const OPENAPI_TIMEOUT_MS = 5_000;

async function main() {
  const source = resolveOpenApiSource();

  console.log(`OpenAPI preflight: ${formatOpenApiSource(source)}`);
  await assertOpenApiSourceAvailable(source);
  console.log(`OpenAPI preflight passed (${source.reason}).`);
}

export async function assertOpenApiSourceAvailable(source: OpenApiSource) {
  if (source.kind === "file") {
    await assertOpenApiFileAvailable(source.target);
    return;
  }

  await assertOpenApiUrlAvailable(source.target);
}

async function assertOpenApiFileAvailable(filePath: string) {
  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      throw new Error("OpenAPI source is not a file");
    }

    if (fileStat.size <= 0) {
      throw new Error("OpenAPI file is empty");
    }

    if (filePath.toLowerCase().endsWith(".json")) {
      const content = await readFile(filePath, "utf8");
      JSON.parse(content);
    }
  } catch (error) {
    throw new Error(
      `OpenAPI file is not usable at ${filePath}. Export backend OpenAPI or set ORVAL_OPENAPI_URL. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function assertOpenApiUrlAvailable(openApiUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAPI_TIMEOUT_MS);

  try {
    const response = await fetch(openApiUrl, {
      headers: {
        accept: "application/yaml, application/json, text/yaml, */*",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAPI responded with HTTP ${response.status}`);
    }

    const body = await response.text();

    if (!body.trim()) {
      throw new Error("OpenAPI response is empty");
    }
  } catch (error) {
    throw new Error(
      `OpenAPI is not available at ${openApiUrl}. Start backend, export runtime/openapi.json, or use --skip-api for local checks. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

if (isMainModule()) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];

  return entrypoint ? import.meta.url === pathToFileURL(entrypoint).href : false;
}
