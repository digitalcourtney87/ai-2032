import { defineConfig } from "vitest/config";

// Engine and content tests are pure TypeScript, so they run in plain Node.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
