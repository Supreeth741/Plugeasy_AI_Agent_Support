import express from "express";
import { logger } from "../utils/logger";
import { twilioRoutes } from "./routes/twilio.routes";
import { healthRoutes } from "./routes/health.routes";

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

  // Routes
  app.use("/twilio", twilioRoutes);
  app.use("/", healthRoutes);

  return app;
}
