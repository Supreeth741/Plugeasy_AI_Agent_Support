import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/env";
import { GEMINI_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const DASHBOARD_SYSTEM_PROMPT = `You are an AI assistant helping a PlugEasy admin resolve escalated customer support issues.

CONTEXT:
- A customer called PlugEasy EV charger support and the issue was escalated to a human admin.
- You will be given the full call transcript between the AI agent and the customer.
- The admin is now chatting with you to understand the issue and figure out the resolution.

YOUR ROLE:
- Summarize the customer's issue clearly when asked.
- Suggest troubleshooting steps the admin can relay to the customer.
- Help draft a follow-up message or callback script.
- If the issue involves safety, emphasize urgency and recommend immediate field visit.
- If the issue involves warranty or refund, provide relevant policy information.
- Be concise, professional, and action-oriented.
- Do NOT use markdown formatting. Use plain text only.`;

export async function generateDashboardResponse(
  callTranscript: Array<{ role: string; content: string }>,
  chatHistory: Array<{ role: string; content: string }>,
  adminMessage: string,
): Promise<string> {
  logger.info(
    { adminMessageLength: adminMessage.length },
    "Generating dashboard AI response",
  );

  const model = genAI.getGenerativeModel({
    model: GEMINI_SETTINGS.MODEL,
    systemInstruction: DASHBOARD_SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.3,
    },
  });

  const transcriptSummary = callTranscript
    .map(
      (msg) =>
        `${msg.role === "user" ? "Customer" : "AI Agent"}: ${msg.content}`,
    )
    .join("\n");

  const history = [
    {
      role: "user" as const,
      parts: [
        {
          text: `Here is the call transcript that was escalated:\n\n${transcriptSummary}\n\nI am the admin. I will now ask you questions about this escalation.`,
        },
      ],
    },
    {
      role: "model" as const,
      parts: [
        {
          text: "I have reviewed the call transcript. How can I help you resolve this issue?",
        },
      ],
    },
    ...chatHistory.map((msg) => ({
      role: (msg.role === "admin" ? "user" : "model") as "user" | "model",
      parts: [{ text: msg.content }],
    })),
  ];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(adminMessage);
  const responseText =
    result.response.text() ||
    "I could not generate a response. Please try rephrasing your question.";

  logger.info(
    { responseLength: responseText.length },
    "Dashboard AI response generated",
  );

  return responseText;
}
