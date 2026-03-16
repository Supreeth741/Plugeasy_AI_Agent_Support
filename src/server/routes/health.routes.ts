import { Router } from "express";

export const healthRoutes = Router();

healthRoutes.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "PlugEasy-ai-agent-support",
    timestamp: new Date().toISOString(),
  });
});
