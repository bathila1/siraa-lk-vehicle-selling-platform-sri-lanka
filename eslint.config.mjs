// import { dirname } from 'node:path';
// import { fileURLToPath } from 'node:url';

// import { FlatCompat } from '@eslint/eslintrc';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({ baseDirectory: __dirname });

// const config = [
//   ...compat.extends('next/core-web-vitals', 'next/typescript'),
//   {
//     rules: {
//       'react/no-unescaped-entities': 'off',
//       '@typescript-eslint/no-unused-vars': [
//         'warn',
//         { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
//       ],
//       '@typescript-eslint/consistent-type-imports': [
//         'warn',
//         { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
//       ],
//       'import/order': [
//         'warn',
//         {
//           groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
//           'newlines-between': 'always',
//           alphabetize: { order: 'asc' },
//         },
//       ],
//     },
//   },
//   {
//     ignores: ['.next/**', 'node_modules/**', 'public/**', 'supabase/**'],
//   },
// ];

// export default config;

import nextPlugin from 'eslint-config-next';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'supabase/**'],
  },
];
