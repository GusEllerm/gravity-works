/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

// Relative base so the same build serves from the GitHub Pages project path
// and from any static preview.
export default defineConfig({
  base: './',
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
