// ESLint v9 Flat Config
// See: https://eslint.org/docs/latest/use/configure/configuration-files-new

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";

export default [
  // Global ignores. This must be its own entry: `ignores` alongside `files` only narrows
  // that one config, so the type-checked rules below would still be applied to .d.ts
  // files, which have no parserOptions.project and cannot satisfy them.
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.config.{js,cjs,mjs,ts}",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
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
      // js.configs.recommended is already applied above; re-spreading it here also
      // re-enabled the base rules that typescript-eslint turns off on purpose. The
      // compiler already reports undefined names and unused locals, and the base rules
      // cannot see types, so they fire on type-only imports and ambient globals.
      "no-unused-vars": "off",
      "no-undef": "off",

      // TypeScript rules (override a few noisy ones for this project)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],

      // React rules
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];
