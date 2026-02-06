import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@hermes/domain": path.resolve(__dirname, "../../packages/domain/src"),
      "@hermes/rules": path.resolve(__dirname, "../../packages/rules/src")
    }
  },
  test: {
    environment: "node"
  }
});
