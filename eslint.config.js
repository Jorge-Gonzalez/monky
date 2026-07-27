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

      // The house style is semicolon-free, matching .prettierrc. Without this rule
      // nothing enforced it, and `eslint --fix` reintroduced semicolons on every import
      // it rewrote. The default beforeStatementContinuationChars: "any" leaves the few
      // semicolons that ASI genuinely requires alone.
      semi: ["error", "never"],

      // Off, on evidence rather than taste. Its analysis disagrees with the compiler on
      // DOM query results -- it calls `querySelector(...) as HTMLElement | null`
      // unnecessary, and running its autofix removed assertions that tsc requires,
      // breaking the typecheck across nine files while the runtime tests stayed green.
      // A rule whose fix breaks the build, and whose every finding must be re-checked
      // against tsc by hand, costs more than it returns. It does catch genuinely
      // redundant `!` operators, so a manual pass is worth doing someday.
      "@typescript-eslint/no-unnecessary-type-assertion": "off",

      // TypeScript rules (override a few noisy ones for this project)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],

      // React rules
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  // Tests hold mocks to a different standard than production code. A test double is
  // deliberately shaped like the thing it stands in for rather than typed as it, and
  // `expect(obj.method)` passes a method reference it never calls -- which is exactly what
  // unbound-method exists to catch, and never a defect here. Left on, these rules report
  // once per *use* of an untyped mock, so a single test double buries the production
  // findings under hundreds of entries.
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "src/utils/testUtils.ts"],
    rules: {
      "@typescript-eslint/unbound-method": "off",
      // Consistent with the rules below: a stand-in that is deliberately partial has no
      // full type to state, and reporting the declaration while its consequences are
      // ignored is the worst of both. Mocks that *do* have a real type available should
      // still use it -- ReturnType<typeof factory> for a factory-built double.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
];
