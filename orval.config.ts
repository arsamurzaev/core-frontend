import { defineConfig } from "orval";

const input = {
  target: "http://localhost:4000/openapi.yaml",
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

      // чтобы все запросы шли через наш axios instance
      override: {
        mutator: {
          path: "./shared/api/client.ts",
          name: "mutator",
        },
      },

      // опционально: удобнее держать хуки рядом
      // mode: "single", // по умолчанию один файл
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