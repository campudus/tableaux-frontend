const vitest = require("@vitest/eslint-plugin");

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:@vitest/legacy-recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 7,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      impliedStrict: true
    }
  },
  env: {
    browser: true,
    es6: true
  },
  plugins: [
    "@typescript-eslint/eslint-plugin",
    "standard",
    "react",
    "prettier",
    "lodash-fp",
    "@vitest"
  ],
  settings: {
    react: {
      createClass: "createReactClass",
      pragma: "React",
      version: "16.8.6"
    }
  },
  rules: {
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
  },
  overrides: [
    {
      files: ["**/__tests__/*.{j,t}s?(x)", "**/*.test.{j,t}s?(x)"],
      globals: {
        ...vitest.environments.env.globals
      }
    }
  ]
};
