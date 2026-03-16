export const CALL_SETTINGS = {
  MAX_CONVERSATION_TURNS: 10,
  ESCALATION_AFTER_TURNS: 3,
} as const;

export const GEMINI_SETTINGS = {
  MODEL: "gemini-2.5-flash",
  MAX_OUTPUT_TOKENS: 300,
  TEMPERATURE: 0.3,
} as const;
