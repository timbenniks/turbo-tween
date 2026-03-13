import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'react'],
    categories: {
      correctness: 'warn',
    },
    env: {
      builtin: true,
    },
    ignorePatterns: ['dist/', 'node_modules/', '*.config.*'],
    overrides: [
      {
        files: ['src/**/*.ts', 'tests/**/*.ts'],
        rules: {
          '@typescript-eslint/ban-ts-comment': 'error',
          'no-array-constructor': 'error',
          '@typescript-eslint/no-duplicate-enum-values': 'error',
          '@typescript-eslint/no-empty-object-type': 'error',
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/no-extra-non-null-assertion': 'error',
          '@typescript-eslint/no-misused-new': 'error',
          '@typescript-eslint/no-namespace': 'error',
          '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
          '@typescript-eslint/no-require-imports': 'error',
          '@typescript-eslint/no-this-alias': 'error',
          '@typescript-eslint/no-unnecessary-type-constraint': 'error',
          '@typescript-eslint/no-unsafe-declaration-merging': 'error',
          '@typescript-eslint/no-unsafe-function-type': 'error',
          'no-unused-expressions': 'error',
          'no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
            },
          ],
          '@typescript-eslint/no-wrapper-object-types': 'error',
          '@typescript-eslint/prefer-as-const': 'error',
          '@typescript-eslint/prefer-namespace-keyword': 'error',
          '@typescript-eslint/triple-slash-reference': 'error',
          'no-console': 'warn',
        },
      },
      {
        files: ['src/engine.ts', 'src/tween.ts', 'src/timeline.ts'],
        rules: {
          'unicorn/no-thenable': 'off',
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 2,
    sortPackageJson: false,
    ignorePatterns: ['pnpm-lock.yaml', 'dist/', 'test-results/', 'coverage/', 'node_modules/'],
  },
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        vue: './src/vue/index.ts',
        react: './src/react/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'react', 'react-dom'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
      },
    },
    target: 'es2020',
    minify: false,
  },
});
