import { CALL_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";
import { CallSession, Message } from "../types";
import { generateResponse } from "./llm.service";
import { loadFAQData } from "../knowledge/faq-data";
import { buildSystemPrompt } from "../knowledge/system-prompt";

import { config } from "../config/env";
import { createCallLog, updateCallLog } from "./call-log.service";

// In-memory call session store
const sessions = new Map<string, CallSession>();

export interface CallTurnResult {
  text: string;
  shouldEscalate: boolean;
  detectedLanguage: string;
  turnNumber: number;
}

function getOrCreateSession(
  callSid: string,
  from: string,
): { session: CallSession; isNew: boolean } {
  let session = sessions.get(callSid);
  if (!session) {
    session = {
      callSid,
      from,
      detectedLanguage: "en",
      conversationHistory: [],
      turnCount: 0,
      createdAt: new Date(),
    };
    sessions.set(callSid, session);
    logger.info({ callSid, from }, "New call session created");
    return { session, isNew: true };
  }
  return { session, isNew: false };
}

export async function handleCallTurn(
  callSid: string,
  from: string,
  userText: string,
): Promise<CallTurnResult> {
  const { session, isNew } = getOrCreateSession(callSid, from);

  if (isNew) {
    createCallLog(callSid, from, config.twilioPhoneNumber).catch((err) =>
      logger.error({ callSid, err }, "Failed to create call log"),
    );
  }

  session.turnCount++;

  logger.info(
    { callSid, turn: session.turnCount, userText },
    "Processing call turn",
  );

  // Check if we should force escalation (too many turns)
  const forceEscalate =
    session.turnCount >= CALL_SETTINGS.ESCALATION_AFTER_TURNS;

  // Generate AI response
  const faqData = loadFAQData();
  const systemPrompt = buildSystemPrompt(faqData);

  const llmResponse = await generateResponse(
    systemPrompt,
    session.conversationHistory,
    userText,
    session.detectedLanguage,
  );

  logger.info(
    { callSid, response: llmResponse.text },
    "Gemini response generated",
  );

  // Update detected language
  if (llmResponse.detectedLanguage) {
    session.detectedLanguage = llmResponse.detectedLanguage;
  }

  // Update conversation history
  session.conversationHistory.push(
    { role: "user", content: userText },
    { role: "assistant", content: llmResponse.text },
  );

  const shouldEscalate = llmResponse.shouldEscalate || forceEscalate;

  if (shouldEscalate) {
    logger.info(
      { callSid, reason: forceEscalate ? "max_turns" : "llm_decision" },
      "Escalating call",
    );
  }

  // Update MongoDB (fire-and-forget)
  updateCallLog(callSid, {
    turnCount: session.turnCount,
    conversationHistory: session.conversationHistory,
    detectedLanguage: session.detectedLanguage,
  }).catch((err) =>
    logger.error({ callSid, err }, "Failed to update call log"),
  );

  return {
    text: llmResponse.text,
    shouldEscalate,
    detectedLanguage: session.detectedLanguage,
    turnNumber: session.turnCount,
  };
}

export function getSessionData(callSid: string): CallSession | undefined {
  return sessions.get(callSid);
}

// Clean up session when call ends
export function cleanupSession(callSid: string): void {
  const session = sessions.get(callSid);
  sessions.delete(callSid);

  if (session) {
    updateCallLog(callSid, {
      status: "completed",
      endTime: new Date(),
      turnCount: session.turnCount,
      conversationHistory: session.conversationHistory,
    }).catch((err) =>
      logger.error({ callSid, err }, "Failed to finalize call log"),
    );
  }

  logger.info({ callSid }, "Call session cleaned up");
}
