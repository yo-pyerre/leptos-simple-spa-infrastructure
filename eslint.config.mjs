import globals from "globals";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: [
      "**/*.{js,mjs,cjs,ts}"
    ]
  },
  {
    languageOptions: { 
      globals: globals.browser 
    }
  },
  {
    ignores: [
    'node_modules/',
    'cdk.out/',
    'dist/'
    ]
  },
  {
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended"
    ]
  },
  {
    rules: {
      "prettier/prettier": "error"
    }
  },
  ...tseslint.configs.recommended,
]; 