import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  // Global ignores. In flat config an `ignores` key sitting alongside `files`
  // only narrows that one config object — a standalone object is what
  // actually excludes paths from the run, which is why ESLint was still
  // walking the minified bundle in dist/ on every invocation.
  { ignores: ["dist/**", "build/**"] },
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      // src/lib holds AuthContext plus the gamification, retention and
      // adaptive-feedback engines, and src/api holds the backend client —
      // all of it previously unlinted, including rules-of-hooks on the
      // context providers.
      "src/lib/**/*.{js,mjs,cjs,jsx}",
      "src/api/**/*.{js,mjs,cjs,jsx}",
      "src/hooks/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
    ],
    // src/components/ui is generated shadcn scaffolding — not ours to lint.
    ignores: ["src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
