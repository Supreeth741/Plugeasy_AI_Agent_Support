import { CallLog, ICallLog } from "../models/call-log.model";
import { logger } from "../utils/logger";

export async function createCallLog(
  callSid: string,
  from: string,
  to: string,
): Promise<ICallLog> {
  const log = await CallLog.create({
    callSid,
    from,
    to,
    startTime: new Date(),
    status: "in-progress",
  });
  logger.info({ callSid }, "Call log created");
  return log;
}

export async function updateCallLog(
  callSid: string,
  updates: Partial<
    Pick<
      ICallLog,
      | "turnCount"
      | "conversationHistory"
      | "detectedLanguage"
      | "status"
      | "escalated"
      | "escalationReason"
      | "endTime"
      | "resolved"
    >
  >,
): Promise<void> {
  await CallLog.findOneAndUpdate({ callSid }, { $set: updates });
  logger.debug({ callSid }, "Call log updated");
}

export async function getCallLogs(
  page: number = 1,
  limit: number = 20,
): Promise<{ logs: ICallLog[]; total: number }> {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    CallLog.find().sort({ startTime: -1 }).skip(skip).limit(limit),
    CallLog.countDocuments(),
  ]);
  return { logs, total };
}

export async function getCallLogByCallSid(
  callSid: string,
): Promise<ICallLog | null> {
  return CallLog.findOne({ callSid });
}
