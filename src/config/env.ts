import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  baseUrl: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  geminiApiKey: string;
  maxConversationTurns: number;
  escalationPhoneNumber: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    baseUrl: requireEnv("BASE_URL"),
    twilioAccountSid: requireEnv("TWILIO_ACCOUNT_SID"),
    twilioAuthToken: requireEnv("TWILIO_AUTH_TOKEN"),
    twilioPhoneNumber: requireEnv("TWILIO_PHONE_NUMBER"),
    geminiApiKey: requireEnv("GEMINI_API_KEY"),
    maxConversationTurns: parseInt(
      process.env.MAX_CONVERSATION_TURNS || "10",
      10,
    ),
    escalationPhoneNumber: process.env.ESCALATION_PHONE_NUMBER || "",
  };
}

export const config = loadConfig();
