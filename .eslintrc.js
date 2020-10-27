module.exports = {
  extends: "divid",
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "max-lines": ["error", 2000],
    "@typescript-eslint/prefer-readonly-parameter-types": "off",
    "@typescript-eslint/naming-convention": "off",
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/no-dynamic-delete": "off",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/prefer-optional-chain": "off",
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/no-unsafe-member-access": "off", 
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unused-vars": "off"
  },
};
