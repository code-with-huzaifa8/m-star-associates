import ts from "typescript-eslint";
export default [
  { ignores: ["node_modules/**", "dist/**", "work/**"] },
  {
    files: ["src/**/*.{ts,tsx}", "db/**/*.ts", "*.ts"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unreachable": "error",
      "no-dupe-keys": "error",
      "no-constant-condition": "error",
      "no-unsafe-finally": "error",
    },
  },
  {
    files: ["worker/*.mjs", "scripts/*.mjs", "tests/*.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "no-unreachable": "error",
      "no-dupe-keys": "error",
      "no-constant-condition": "error",
      "no-unsafe-finally": "error",
    },
  },
];
