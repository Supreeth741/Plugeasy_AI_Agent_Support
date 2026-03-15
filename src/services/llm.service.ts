import OpenAI from "openai";
import { config } from "../config/env";
import { OPENAI_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";
import { LLMResponse, Message } from "../types";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function generateResponse(
  systemPrompt: string,
  conversationHistory: Message[],
  userMessage: string,
  detectedLanguage: string,
): Promise<LLMResponse> {
  logger.info({ userMessage, detectedLanguage }, "Generating LLM response...");

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    {
      role: "user",
      content:
        detectedLanguage !== "en"
          ? `[Customer is speaking in ${detectedLanguage}. Respond in the same language.]\n\n${userMessage}`
          : userMessage,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: OPENAI_SETTINGS.GPT_MODEL,
    messages,
    max_tokens: OPENAI_SETTINGS.GPT_MAX_TOKENS,
    temperature: OPENAI_SETTINGS.GPT_TEMPERATURE,
  });

  const rawText =
    completion.choices[0]?.message?.content ||
    "I apologize, I could not generate a response.";

  // Check for escalation signals in the response
  const shouldEscalate = /\[ESCALATE\]/i.test(rawText);
  const text = rawText.replace(/\[ESCALATE\]/gi, "").trim();

  logger.info({ text, shouldEscalate }, "LLM response generated");

  return { text, shouldEscalate };
}
