import { Router, Request, Response } from "express";
import {
  getCallLogs,
  getCallLogByCallSid,
} from "../../services/call-log.service";
import {
  getEscalations,
  getEscalationById,
  addChatMessage,
  resolveEscalation,
} from "../../services/escalation.service";
import { generateDashboardResponse } from "../../services/dashboard-ai.service";
import { emitEscalationResolved } from "../socket";
import { logger } from "../../utils/logger";

export const apiRoutes = Router();

// --- Call Logs ---

apiRoutes.get("/calls", async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { logs, total } = await getCallLogs(page, limit);
  res.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

apiRoutes.get("/calls/:callSid", async (req: Request, res: Response) => {
  const log = await getCallLogByCallSid(req.params.callSid as string);
  if (!log) {
    res.status(404).json({ error: "Call not found" });
    return;
  }
  res.json(log);
});

// --- Escalations ---

apiRoutes.get("/escalations", async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const statusParam = req.query.status;
  const status = (typeof statusParam === "string" ? statusParam : undefined) as
    | "open"
    | "resolved"
    | undefined;

  const { escalations, total } = await getEscalations(page, limit, status);
  res.json({
    data: escalations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

apiRoutes.get("/escalations/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const escalation = await getEscalationById(id);
  if (!escalation) {
    res.status(404).json({ error: "Escalation not found" });
    return;
  }
  res.json(escalation);
});

apiRoutes.post("/escalations/:id/chat", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const escalation = await getEscalationById(id);
  if (!escalation) {
    res.status(404).json({ error: "Escalation not found" });
    return;
  }

  if (escalation.status === "resolved") {
    res.status(400).json({ error: "Escalation is already resolved" });
    return;
  }

  // Save admin message
  await addChatMessage(id, "admin", message);

  // Generate AI response
  try {
    const aiResponse = await generateDashboardResponse(
      escalation.callTranscript,
      escalation.chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      message,
    );

    // Save AI response
    const updated = await addChatMessage(id, "ai", aiResponse);

    res.json({
      adminMessage: message,
      aiResponse,
      escalation: updated,
    });
  } catch (error) {
    logger.error({ error }, "Error generating dashboard AI response");
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

apiRoutes.patch(
  "/escalations/:id/resolve",
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const escalation = await resolveEscalation(id);
    if (!escalation) {
      res.status(404).json({ error: "Escalation not found" });
      return;
    }

    emitEscalationResolved(id);
    res.json(escalation);
  },
);
