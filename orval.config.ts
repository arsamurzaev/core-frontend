import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "orval";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");
const localOpenApiPath = resolve(process.cwd(), "runtime/openapi.json");

const input = {
  target:
    process.env.ORVAL_OPENAPI_URL ??
    (existsSync(localOpenApiPath)
      ? localOpenApiPath
      : `${apiBaseUrl}/openapi.yaml`),
};

export default defineConfig({
  apiReactQuery: {
    input,
    output: {
      // react-query hooks
      target: "./shared/api/generated/react-query/index.ts",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      prettier: true,

      // Все запросы идут через наш axios instance.
      override: {
        mutator: {
          path: "./shared/api/client.ts",
          name: "mutator",
        },
      },

      // По умолчанию Orval держит все хуки в одном файле.
      // mode: "single",
    },
  },
  apiZod: {
    input,
    output: {
      // zod schemas
      target: "./shared/api/generated/zod/index.ts",
      client: "zod",
      clean: true,
      prettier: true,
    },
  },
  apiAxios: {
    input,
    output: {
      // plain axios functions
      target: "./shared/api/generated/axios/index.ts",
      client: "axios",
      httpClient: "axios",
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: "./shared/api/client.ts",
          name: "mutator",
        },
      },
    },
  },
});
