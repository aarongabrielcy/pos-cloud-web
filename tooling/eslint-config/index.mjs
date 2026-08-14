// Shared flat ESLint config for every workspace package. Root eslint.config.mjs re-exports this so
// every package lints the same way without copying rules.
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export const baseConfig = tseslint.config(
  { ignores: ["**/dist/**", "**/coverage/**", "**/.turbo/**", "**/generated/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
);

export const reactConfig = tseslint.config(
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
