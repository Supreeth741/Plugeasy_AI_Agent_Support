import http from "http";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { createApp } from "./server/app";
import { connectDatabase } from "./db/connection";
import { initializeSocketIO } from "./server/socket";
import { ensureAudioDir } from "./services/audio-file.service";

async function main() {
  // Ensure audio directory exists
  ensureAudioDir();

  // Connect to MongoDB
  await connectDatabase();

  // Create Express app and HTTP server
  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize Socket.IO on the same HTTP server
  initializeSocketIO(httpServer);

  httpServer.listen(config.port, () => {
    logger.info(
      { port: config.port, baseUrl: config.baseUrl },
      "PlugEasy AI Agent Support server started",
    );
    logger.info("Waiting for incoming calls...");
    logger.info(
      { dashboard: `http://localhost:${config.port}/dashboard/` },
      "Dashboard available",
    );
  });
}

main().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
