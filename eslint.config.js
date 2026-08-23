import js from '@eslint/js';
import tsPlugin from 'typescript-eslint';

export default tsPlugin.config(
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*'],
              message: 'Authoritative core modules must remain platform-neutral.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Thread an explicit seeded RNG through authoritative core code.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Inject identifiers or clocks at the session/host boundary.',
        },
      ],
    },
  },
  {
    ignores: ['.gemini/**', 'dist/**', 'godot/build/**', 'node_modules/**'],
  }
);
