const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("typescript-eslint");


module.exports = [
  // Grundkonfiguration für alle JavaScript-Dateien
  {
    languageOptions: {
      globals: {
        ...globals.node, // Fügt alle Node.js-Globale wie 'require', 'module' etc. hinzu
      },
    },
  },
  // Wendet die empfohlenen Regeln von ESLint an
  pluginJs.configs.recommended,

  // Spezifische Konfiguration für TypeScript-Dateien
  ...tseslint.config({
    files: ["src/**/*.ts"], // Wendet dies nur auf TS-Dateien im src-Ordner an
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Hier kannst du spezifische TS-Regeln überschreiben
      "indent": ["error", 2],
      "quotes": ["error", "double"],
      "max-len": ["error", { "code": 120 }],
      "no-unused-vars": "warn", // Ungenutzte Variablen als Warnung, nicht als Fehler
    },
  }),

  // Konfiguration, um bestimmte Dateien zu ignorieren
  {
    ignores: ["lib/", "node_modules/"],
  },
];