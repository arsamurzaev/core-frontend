import { defineConfig } from "orval";
import { resolveOpenApiSource } from "./scripts/openapi-source";

const input = {
  target: resolveOpenApiSource().target,
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
      override: {
        mutator: {
          path: "./shared/api/client.ts",
          name: "mutator",
        },
      },
    },
  },
});
