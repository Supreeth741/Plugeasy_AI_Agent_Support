import { Escalation, IEscalation } from "../models/escalation.model";
import { Message } from "../types";
import { logger } from "../utils/logger";

export async function createEscalation(
  callSid: string,
  reason: string,
  callerPhone: string,
  callTranscript: Message[],
): Promise<IEscalation> {
  const escalation = await Escalation.create({
    callSid,
    reason,
    callerPhone,
    callTranscript,
    chatHistory: [],
    status: "open",
  });
  logger.info({ callSid, escalationId: escalation._id }, "Escalation created");
  return escalation;
}

export async function getEscalations(
  page: number = 1,
  limit: number = 20,
  statusFilter?: "open" | "resolved",
): Promise<{ escalations: IEscalation[]; total: number }> {
  const query = statusFilter ? { status: statusFilter } : {};
  const skip = (page - 1) * limit;
  const [escalations, total] = await Promise.all([
    Escalation.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Escalation.countDocuments(query),
  ]);
  return { escalations, total };
}

export async function getEscalationById(
  id: string,
): Promise<IEscalation | null> {
  return Escalation.findById(id);
}

export async function addChatMessage(
  id: string,
  role: "admin" | "ai",
  content: string,
): Promise<IEscalation | null> {
  return Escalation.findByIdAndUpdate(
    id,
    {
      $push: {
        chatHistory: { role, content, timestamp: new Date() },
      },
    },
    { new: true },
  );
}

export async function resolveEscalation(
  id: string,
): Promise<IEscalation | null> {
  return Escalation.findByIdAndUpdate(
    id,
    {
      $set: { status: "resolved", resolvedAt: new Date() },
    },
    { new: true },
  );
}
