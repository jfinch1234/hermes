import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { validateEnterprisePolicyOnStartup } from "./hermes/policy-validation";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateConfig(): void {
  requireEnv("NODE_ENV");

  const proofMode = requireEnv("DEV_PROOF_MODE");
  if (proofMode !== "true" && proofMode !== "false") {
    throw new Error("DEV_PROOF_MODE must be 'true' or 'false'");
  }

  const storeId = process.env.STORE_ID ?? process.env.DEFAULT_STORE_ID;
  if (!storeId) {
    throw new Error("Missing required STORE_ID (or DEFAULT_STORE_ID)");
  }
}

async function bootstrap() {
  validateEnterprisePolicyOnStartup();
  validateConfig();
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}

bootstrap();
