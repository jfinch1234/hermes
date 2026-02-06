import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { CatalogAdapter, SessionId } from "@hermes/domain";
import { SessionStore } from "./hermes/session-store";
import { CATALOG_ADAPTER_TOKEN } from "./hermes/catalog-adapter.token";

@Controller()
export class AppController {
  constructor(
    private sessions: SessionStore,
    @Inject(CATALOG_ADAPTER_TOKEN) private catalogAdapter: CatalogAdapter
  ) {}

  @Get("health")
  getHealth() {
    return { status: "ok" };
  }

  @Get("ready")
  getReady() {
    if (!this.isReady()) {
      throw new ServiceUnavailableException("Not ready");
    }

    return { status: "ok" };
  }

  private isReady(): boolean {
    const storeId = process.env.STORE_ID ?? process.env.DEFAULT_STORE_ID ?? "";
    if (!storeId) {
      return false;
    }

    try {
      this.catalogAdapter.getSample(storeId, "", 1);
      this.sessions.get("healthcheck" as SessionId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
