import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/e2e/**/*.e2e.ts"],
    testTimeout: 30_000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
