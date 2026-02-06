import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@hermes/domain": new URL("../domain/src", import.meta.url).pathname
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.invariants.test.ts"]
  }
});
