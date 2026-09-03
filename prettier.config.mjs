/** @type {import("prettier").Config} */
const config = {
    semi: true,
    singleQuote: true,

    // indentation
    tabWidth: 4,
    useTabs: false,

    // formatting rules
    trailingComma: 'all',
    printWidth: 100,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    quoteProps: 'as-needed',

    // jsx
    jsxSingleQuote: false,

    // line ending
    endOfLine: 'lf',

    // plugins
    plugins: ['prettier-plugin-tailwindcss'],

    // overrides for specific files
    overrides: [
        {
            files: '*.scss',
            options: {
                singleQuote: false,
            },
        },
        {
            files: '*.json',
            options: {
                tabWidth: 2,
            },
        },
    ],
};

export default config;
