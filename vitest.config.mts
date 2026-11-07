import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      // Solo definiciones de tipos: no aportan cobertura ejecutable.
      exclude: ['src/types/**'],
      // Ratchet: los umbrales reflejan la cobertura actual y deben subir,
      // nunca bajar, cuando se agreguen pruebas.
      thresholds: {
        statements: 72,
        branches: 74,
        functions: 76,
        lines: 72,
      },
    },
  },
});