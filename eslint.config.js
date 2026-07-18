import js from "@eslint/js";

const browserGlobals = {
  Blob: "readonly",
  URL: "readonly",
  document: "readonly",
  globalThis: "readonly",
  Intl: "readonly",
  navigator: "readonly",
  structuredClone: "readonly",
  window: "readonly",
};

export default [
  {
    ignores: ["dist/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: browserGlobals,
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tests/**/*.js", "*.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        globalThis: "readonly",
        process: "readonly",
        structuredClone: "readonly",
      },
    },
  },
];
