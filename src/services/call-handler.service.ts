import { CALL_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";
import { CallSession, Message } from "../types";
import { generateResponse } from "./llm.service";
import { loadFAQData } from "../knowledge/faq-data";
import { buildSystemPrompt } from "../knowledge/system-prompt";

// In-memory call session store
const sessions = new Map<string, CallSession>();

interface CallTurnResult {
  text: string;
  shouldEscalate: boolean;
}

function getOrCreateSession(callSid: string, from: string): CallSession {
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
  }
  return session;
}

export async function handleCallTurn(
  callSid: string,
  from: string,
  userText: string,
): Promise<CallTurnResult> {
  const session = getOrCreateSession(callSid, from);
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

  return {
    text: llmResponse.text,
    shouldEscalate,
  };
}

// Clean up session when call ends
export function cleanupSession(callSid: string): void {
  sessions.delete(callSid);
  logger.info({ callSid }, "Call session cleaned up");
}
