// client/eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // ============================
  // 1️⃣ Main Application Config
  // ============================
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["dist", "node_modules", "tests/"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Base JS rules
      ...js.configs.recommended.rules,

      // React rules
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // React 17+ doesn’t need import React
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",

      // Hooks & Refresh
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // General cleanup
      "no-unused-vars": ["warn"],
      "no-console": ["warn",{ allow: ["error"] }],
      "react/prop-types": "off"
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // ============================
  // 2️⃣ Tests Configuration
  // ============================
  {
    files: ["tests/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-console": "off", // Allow console statements in tests
    },
  },
]);
