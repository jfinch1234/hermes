import { Module } from "@nestjs/common";
import { HermesController } from "./hermes.controller";
import { ProofController } from "./proof.controller";
import { HermesService } from "./hermes.service";
import { SessionStore } from "./session-store";
import { AuditLogStore } from "./audit-log";
import { DiscoveryCache } from "./discovery-cache";
import { CATALOG_ADAPTER_TOKEN } from "./catalog-adapter.token";
import { SeedCatalogAdapter } from "@hermes/seed";
import { TraceStore } from "./trace-store";

@Module({
  controllers: [HermesController, ProofController],
  providers: [
    HermesService,
    SessionStore,
    AuditLogStore,
    DiscoveryCache,
    TraceStore,
    {
      provide: CATALOG_ADAPTER_TOKEN,
      useValue: new SeedCatalogAdapter()
    }
  ],
  exports: [SessionStore, CATALOG_ADAPTER_TOKEN]
})
export class HermesModule {}
