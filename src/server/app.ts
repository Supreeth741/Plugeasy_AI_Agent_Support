import express from "express";
import path from "path";
import { logger } from "../utils/logger";
import { twilioRoutes } from "./routes/twilio.routes";
import { healthRoutes } from "./routes/health.routes";
import { apiRoutes } from "./routes/api.routes";

export function createApp(): express.Application {
  const app = express();

  // Parse Twilio webhook bodies (application/x-www-form-urlencoded)
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Request logging middleware
  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, "Request received");
    next();
  });

  // Serve generated audio files
  app.use("/audio", express.static(path.join(process.cwd(), "tmp", "audio")));

  // Serve dashboard static files
  app.use(
    "/dashboard",
    express.static(path.join(process.cwd(), "public", "dashboard")),
  );

  // API routes
  app.use("/api", apiRoutes);

  // Twilio routes
  app.use("/twilio", twilioRoutes);

  // Health check
  app.use("/", healthRoutes);

  return app;
}
