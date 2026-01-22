import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
      
      // Forbid inline style prop (except for PDF, SVG, or dynamic positioning)
      'react/forbid-dom-props': [
        'error',
        {
          forbid: [
            {
              propName: 'style',
              message: 'Inline styles are forbidden. Use CSS classes with design tokens instead. Only exception: dynamic values (width, transform, etc.), PDF generation, or SVG positioning.',
            },
          ],
        },
      ],
      
      // Restrict inline style objects
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
          message: 'Inline style objects are forbidden. Use CSS classes with design tokens. Only exception: dynamic values like width={`${percentage}%`}, transform, PDF/SVG positioning.',
        },
      ],
      
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
  // Override for PDF components - allow inline styles
  {
    files: ['**/*.pdf.jsx', '**/*.PDF.jsx', '**/pdf/**/*.jsx'],
    rules: {
      'react/forbid-dom-props': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
