// ESLint v9 Flat Config
// See: https://eslint.org/docs/latest/use/configure/configuration-files-new

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.config.{js,cjs,mjs,ts}",
      "**/*.d.ts",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        chrome: "readonly",
      },
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      "@typescript-eslint": tseslint.plugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // General JS rules
      ...js.configs.recommended.rules,

      // TypeScript rules (override a few noisy ones for this project)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],

      // React rules
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];
