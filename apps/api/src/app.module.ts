import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { HermesModule } from "./hermes/hermes.module";

@Module({
  imports: [HermesModule],
  controllers: [AppController]
})
export class AppModule {}
