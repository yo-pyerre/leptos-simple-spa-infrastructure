import globals from "globals";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.browser }},
  {ignores: [
    'node_modules/',
    'cdk.out/',
    'dist/'
  ]},
  ...tseslint.configs.recommended,
]; 