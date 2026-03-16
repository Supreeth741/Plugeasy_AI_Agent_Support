import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/env";
import { GEMINI_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";
import { LLMResponse, Message } from "../types";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function generateResponse(
  systemPrompt: string,
  conversationHistory: Message[],
  userMessage: string,
  detectedLanguage: string,
): Promise<LLMResponse> {
  logger.info({ userMessage, detectedLanguage }, "Generating LLM response...");

  const model = genAI.getGenerativeModel({
    model: GEMINI_SETTINGS.MODEL,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: GEMINI_SETTINGS.MAX_OUTPUT_TOKENS,
      temperature: GEMINI_SETTINGS.TEMPERATURE,
    },
  });

  const history = conversationHistory.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });

  const prompt =
    detectedLanguage !== "en"
      ? `[Customer is speaking in ${detectedLanguage}. Respond in the same language.]\n\n${userMessage}`
      : userMessage;

  const result = await chat.sendMessage(prompt);
  const rawText =
    result.response.text() || "I apologize, I could not generate a response.";

  // Check for escalation signals in the response
  const shouldEscalate = /\[ESCALATE\]/i.test(rawText);
  const text = rawText.replace(/\[ESCALATE\]/gi, "").trim();

  logger.info({ text, shouldEscalate }, "LLM response generated");

  return { text, shouldEscalate };
}
