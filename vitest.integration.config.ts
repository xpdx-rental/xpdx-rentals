import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Integration tests — these hit a REAL Supabase project and are therefore not
 * part of the default `npm run test` run, which stays hermetic and offline.
 *
 * Run with `npm run test:rls` once migration 0019 is applied and
 * SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY / SUPABASE_TEST_SERVICE_ROLE_KEY
 * are set. CLAUDE.md §12 requires their evidence before the conversion is done.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    // A real round trip to Supabase is slower than a unit test.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
