module.exports = {
    env: {
        browser: false,
        es2021: true,
        mocha: true,
        node: true,
    },
    plugins: ["@typescript-eslint"],
    extends: [
        "standard",
        "plugin:prettier/recommended",
        "plugin:node/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        "prefer-const": "off",
        "prettier/prettier": 0,
        "no-unused-vars": "warn",
        "handle-callback-err": "warn",
        "camelcase": "off",
        "node/no-unsupported-features/es-syntax": [
            "error",
            { ignores: ["modules"] },
        ],
    },
};
