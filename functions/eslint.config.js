// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["lib", "node_modules"],
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  {
    rules: {
      quotes: ["error", "double"],
      "max-len": ["warn", { code: 120 }],
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
