import OpenAI from "openai";
import { config } from "../config/env";
import { WHISPER_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";
import { STTResult } from "../types";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename = "audio.wav",
): Promise<STTResult> {
  logger.info("Transcribing audio with Whisper...");

  const file = new File([new Uint8Array(audioBuffer)], filename, {
    type: "audio/wav",
  });

  const response = await openai.audio.transcriptions.create({
    model: WHISPER_SETTINGS.WHISPER_MODEL,
    file,
    response_format: "verbose_json",
  });

  const text = response.text || "";
  const language = response.language || "en";

  logger.info({ text, language }, "Transcription complete");

  return { text, language };
}
