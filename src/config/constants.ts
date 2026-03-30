export const CALL_SETTINGS = {
  MAX_CONVERSATION_TURNS: 10,
  ESCALATION_AFTER_TURNS: 3,
} as const;

export const GEMINI_SETTINGS = {
  MODEL: "gemini-2.5-flash",
  MAX_OUTPUT_TOKENS: 300,
  TEMPERATURE: 0.3,
} as const;

export const TTS_SETTINGS = {
  AUDIO_ENCODING: "MP3" as const,
  SPEAKING_RATE: 1.0,
  PITCH: 0.0,
} as const;

export const SUPPORTED_LANGUAGES = {
  en: {
    code: "en-IN",
    voiceName: "en-IN-Wavenet-A",
    gatherLanguage: "en-IN",
    label: "English",
  },
  hi: {
    code: "hi-IN",
    voiceName: "hi-IN-Wavenet-A",
    gatherLanguage: "hi-IN",
    label: "Hindi",
  },
  kn: {
    code: "kn-IN",
    voiceName: "kn-IN-Wavenet-A",
    gatherLanguage: "kn-IN",
    label: "Kannada",
  },
  mr: {
    code: "mr-IN",
    voiceName: "mr-IN-Wavenet-A",
    gatherLanguage: "mr-IN",
    label: "Marathi",
  },
  te: {
    code: "te-IN",
    voiceName: "te-IN-Wavenet-A",
    gatherLanguage: "te-IN",
    label: "Telugu",
  },
  bn: {
    code: "bn-IN",
    voiceName: "bn-IN-Wavenet-A",
    gatherLanguage: "bn-IN",
    label: "Bengali",
  },
  ta: {
    code: "ta-IN",
    voiceName: "ta-IN-Wavenet-A",
    gatherLanguage: "ta-IN",
    label: "Tamil",
  },
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;
