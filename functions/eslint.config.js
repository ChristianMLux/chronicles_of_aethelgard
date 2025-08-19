const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,

  ...tseslint.config({
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      indent: ["error", 2],
      quotes: ["error", "double"],
      "max-len": ["error", { code: 120 }],
      "no-unused-vars": "warn",
    },
  }),

  {
    ignores: ["lib/", "node_modules/"],
  },
];
