// Configuración de ESLint (flat config, ESLint 9+).
// El backend es CommonJS + TypeScript; no usamos reglas con información de tipos
// (type-checked) para mantener el lint rápido y evitar exigir un tsconfig que
// incluya también tests/.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'graphify-out/**',
      '**/*.config.mts',
      '**/*.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // TypeScript ya valida los símbolos; evitamos el doble aviso de no-undef.
      'no-undef': 'off',
      'no-console': 'off',
      // Se irán endureciendo en fases posteriores (Fase 2/3), no de golpe.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },
  prettier,
);
