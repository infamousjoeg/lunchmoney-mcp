import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/api/**",
        "src/tools/**",
        "src/utils/**",
        "src/auth-provider.ts",
        "src/credential-store.ts",
        "src/cli.ts",
        "src/server.ts",
        "src/setup.ts",
      ],
      reporter: ["text", "lcov"],
    },
  },
});
