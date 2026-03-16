import { config } from "./config/env";
import { logger } from "./utils/logger";
import { createApp } from "./server/app";

const app = createApp();

app.listen(config.port, () => {
  logger.info(
    { port: config.port, baseUrl: config.baseUrl },
    "PlugEasy AI Agent Support server started",
  );
  logger.info("Waiting for incoming calls...");
});
