import { Controller, Get, Param } from "@nestjs/common";
import { HermesService } from "./hermes.service";

@Controller("api/hermes/session")
export class ProofController {
  constructor(private hermes: HermesService) {}

  @Get(":sessionId/proof")
  proof(@Param("sessionId") sessionId: string) {
    return this.hermes.getProof(sessionId);
  }
}
