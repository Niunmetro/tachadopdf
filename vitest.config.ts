import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Excluir los worktrees del motor (.forja/arboles/*): sin esto vitest recoge copias
    // duplicadas de cada suite desde los arboles de trabajo de FORJA e infla el recuento.
    exclude: ['**/node_modules/**', '**/dist/**', '.forja/**'],
  },
});
