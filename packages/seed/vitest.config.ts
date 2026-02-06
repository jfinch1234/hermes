import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@hermes/domain": path.resolve(__dirname, "../domain/src")
    }
  },
  test: {
    environment: "node"
  }
});
