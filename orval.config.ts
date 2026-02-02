import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "http://localhost:4000/openapi.yaml",
    },
    output: {
      // куда генерить
      target: "./shared/api/generated/index.ts",
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
});
