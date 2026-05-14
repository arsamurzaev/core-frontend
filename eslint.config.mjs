import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/core/**"],
              message:
                "shared is the foundation layer and must not import core.",
            },
            {
              group: ["@/sandbox/**"],
              message:
                "production code must use core/catalog-runtime instead of sandbox.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["core/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/core/widgets/**", "@/core/views/**"],
              message:
                "core/modules must stay domain-focused and must not import widgets or views.",
            },
            {
              group: ["@/sandbox/**"],
              message:
                "production code must use core/catalog-runtime instead of sandbox.",
            },
            {
              group: ["@/core/catalog-runtime/ui/*"],
              message:
                "import catalog runtime UI through the @/core/catalog-runtime/ui facade.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "core/**/*.{ts,tsx}"],
    ignores: ["core/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/sandbox/**"],
              message:
                "production code must use core/catalog-runtime instead of sandbox.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy archive, excluded from active maintenance.
    "w-old/**",
    // Local utility script for counting source lines, not app code.
    "count.js",
  ]),
]);

export default eslintConfig;
