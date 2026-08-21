import js from '@eslint/js';
import tsPlugin from 'typescript-eslint';

export default tsPlugin.config(
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
);
