export interface STTResult {
  text: string;
  language: string;
}

export interface LLMResponse {
  text: string;
  shouldEscalate: boolean;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallSession {
  callSid: string;
  from: string;
  detectedLanguage: string;
  conversationHistory: Message[];
  turnCount: number;
  createdAt: Date;
}

export interface FAQEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  escalateIf: string | null;
  severity: "low" | "medium" | "high" | "critical";
}

export interface FAQCategory {
  id: string;
  name: string;
  faqs: FAQEntry[];
}

export interface FAQData {
  version: string;
  company: string;
  categories: FAQCategory[];
  escalationRules: {
    alwaysEscalate: string[];
    escalateAfterAttempts: number;
    escalationMessage: string;
  };
}
