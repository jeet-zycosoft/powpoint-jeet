import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**', 'build/**', 'public/**'],
    },

    js.configs.recommended,

    {
        files: ['**/*.{js,jsx}'],

        plugins: {
            react,
            'react-hooks': reactHooks,
        },

        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',

            globals: {
                ...globals.browser,
                ...globals.node,
            },

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        settings: {
            react: {
                version: 'detect',
            },
        },

        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',

            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-vars': 'error',

            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
];
