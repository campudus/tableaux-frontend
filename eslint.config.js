import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import prettierPlugin from "eslint-plugin-prettier";
import lodashFpPlugin from "eslint-plugin-lodash-fp";
import standardPlugin from "eslint-plugin-standard";
import vitestPlugin from "@vitest/eslint-plugin";

const serverFiles = ["server/*.{j,t}s", "vite.config.{j,t}s"];

export default [
  {
    ignores: [
      "**/node_modules",
      "**/lib",
      "**/dist",
      "**/out",
      "**/__tests__",
      "**/.cache",
      "coverage/",
      ".vscode/",
      "data/",
      "docs/",
      ".idea/"
    ]
  },
  js.configs.recommended,
  ...tsPlugin.configs["flat/recommended"],
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 7,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          impliedStrict: true
        }
      }
    },
    plugins: {
      react: reactPlugin,
      prettier: prettierPlugin,
      "lodash-fp": lodashFpPlugin,
      standard: standardPlugin
    },
    settings: {
      react: {
        createClass: "createReactClass",
        pragma: "React",
        version: "16.8.6"
      }
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      quotes: ["error", "double"],
      "no-console": "off",
      "trailing-comma": "off",
      "prettier/prettier": "error",
      camelcase: ["warn", { properties: "always" }],
      eqeqeq: ["error", "allow-null"],
      "no-eval": "error",
      "no-shadow-restricted-names": "error",
      "no-this-before-super": "error",
      "no-unneeded-ternary": ["error", { defaultAssignment: false }],
      "no-with": "error",
      "comma-dangle": ["error", "never"],
      "lodash-fp/consistent-compose": "off",
      "lodash-fp/consistent-name": ["error", "f"],
      "lodash-fp/no-argumentless-calls": "error",
      "lodash-fp/no-chain": "error",
      "lodash-fp/no-extraneous-args": "error",
      "lodash-fp/no-extraneous-function-wrapping": "warn",
      "lodash-fp/no-extraneous-iteratee-args": "error",
      "lodash-fp/no-for-each": "off",
      "lodash-fp/no-partial-of-curried": "error",
      "lodash-fp/no-single-composition": "error",
      "lodash-fp/no-submodule-destructuring": "error",
      "lodash-fp/no-unused-result": "error",
      "lodash-fp/prefer-compact": "error",
      "lodash-fp/prefer-composition-grouping": "off",
      "lodash-fp/prefer-constant": ["error", { arrowFunctions: false }],
      "lodash-fp/prefer-flat-map": "error",
      "lodash-fp/prefer-get": "error",
      "lodash-fp/prefer-identity": ["error", { arrowFunctions: false }],
      "lodash-fp/preferred-alias": "off",
      "lodash-fp/use-fp": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none"
        }
      ],
      "@typescript-eslint/no-unused-expressions": "warn",
      "react/jsx-uses-react": "warn",
      "react/jsx-uses-vars": "warn",
      "react/react-in-jsx-scope": "off",
      "react/no-typos": "error",
      "react/no-this-in-sfc": "error",
      "react/prefer-stateless-function": "warn",
      "react/prop-types": "off",
      "react/jsx-key": "warn",
      "react/jsx-no-duplicate-props": "error",
      "react/display-name": "off"
    }
  },
  {
    ignores: serverFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2015
      }
    }
  },
  {
    files: serverFiles,
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["**/__tests__/*.{j,t}s?(x)", "**/*.test.{j,t}s?(x)"],
    plugins: {
      vitest: vitestPlugin
    },
    languageOptions: {
      globals: {
        ...vitestPlugin.environments.env.globals
      }
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules
    }
  }
];
