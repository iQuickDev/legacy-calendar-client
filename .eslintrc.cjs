module.exports = {
    env: { node: true, browser: true },
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-essential',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
    ],
    parser: 'vue-eslint-parser',
    parserOptions: {
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser',
        sourceType: 'module'
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'vue/html-indent': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/max-attributes-per-line': 'off'
    }
};
