export const CALL_SETTINGS = {
  MAX_RECORDING_SECONDS: 30,
  SILENCE_TIMEOUT_SECONDS: 3,
  MAX_CONVERSATION_TURNS: 10,
  ESCALATION_AFTER_TURNS: 3,
} as const;

export const GEMINI_SETTINGS = {
  MODEL: "gemini-2.5-flash",
  MAX_OUTPUT_TOKENS: 300,
  TEMPERATURE: 0.3,
} as const;

export const WHISPER_SETTINGS = {
  WHISPER_MODEL: "whisper-1",
} as const;

export const TTS_VOICE_MAP: Record<
  string,
  { languageCode: string; voiceName: string }
> = {
  en: { languageCode: "en-IN", voiceName: "en-IN-Wavenet-A" },
  hi: { languageCode: "hi-IN", voiceName: "hi-IN-Wavenet-A" },
  kn: { languageCode: "kn-IN", voiceName: "kn-IN-Wavenet-A" },
  ta: { languageCode: "ta-IN", voiceName: "ta-IN-Wavenet-A" },
  te: { languageCode: "te-IN", voiceName: "te-IN-Wavenet-A" },
  mr: { languageCode: "mr-IN", voiceName: "mr-IN-Wavenet-A" },
};

export const DEFAULT_TTS_VOICE = TTS_VOICE_MAP["en"];
