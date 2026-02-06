import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { HermesService } from "./hermes.service";

@Controller("sessions")
export class HermesController {
  constructor(private hermes: HermesService) {}

  @Post()
  createSession(@Body() body: { storeId: string }) {
    return this.hermes.createSession(body.storeId);
  }

  @Post(":sessionId/search")
  search(
    @Param("sessionId") sessionId: string,
    @Body() body: { query: string; storeId?: string }
  ) {
    return this.hermes.search(sessionId, body.query, body.storeId);
  }

  @Post(":sessionId/clarify")
  clarify(
    @Param("sessionId") sessionId: string,
    @Body() body: { attributeKey: string; selectedOption: string }
  ) {
    return this.hermes.clarify(sessionId, body.attributeKey, body.selectedOption);
  }

  @Post(":sessionId/repair")
  repair(
    @Param("sessionId") sessionId: string,
    @Body() body: { note?: string }
  ) {
    return this.hermes.expectationRepair(sessionId, body.note);
  }

  @Get(":sessionId/audit")
  audit(@Param("sessionId") sessionId: string) {
    return this.hermes.getAudit(sessionId);
  }
}
