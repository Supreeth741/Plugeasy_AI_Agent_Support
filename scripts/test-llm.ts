/**
 * Test script: Gemini LLM with EV FAQ system prompt
 * Usage: npx tsx scripts/test-llm.ts "My charger shows a red light"
 */
import "dotenv/config";
import { generateResponse } from "../src/services/llm.service";
import { loadFAQData } from "../src/knowledge/faq-data";
import { buildSystemPrompt } from "../src/knowledge/system-prompt";

async function main() {
  const userMessage =
    process.argv[2] || "My charger is not charging my vehicle";

  console.log(`User message: "${userMessage}"\n`);

  const faqData = loadFAQData();
  const systemPrompt = buildSystemPrompt(faqData);

  console.log("Sending to Gemini...\n");

  const result = await generateResponse(systemPrompt, [], userMessage, "en");

  console.log("Response:", result.text);
  console.log("Should escalate:", result.shouldEscalate);
}

main().catch(console.error);
