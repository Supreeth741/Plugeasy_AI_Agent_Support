import textToSpeech from "@google-cloud/text-to-speech";
import { logger } from "../utils/logger";
import { TTS_VOICE_MAP, DEFAULT_TTS_VOICE } from "../config/constants";

const client = new textToSpeech.TextToSpeechClient();

export async function synthesizeSpeech(
  text: string,
  language: string,
): Promise<Buffer> {
  const voiceConfig = TTS_VOICE_MAP[language] || DEFAULT_TTS_VOICE;

  logger.info(
    { language, voiceConfig: voiceConfig.voiceName },
    "Synthesizing speech...",
  );

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: voiceConfig.languageCode,
      name: voiceConfig.voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.95,
      pitch: 0,
    },
  });

  if (!response.audioContent) {
    throw new Error("No audio content returned from Google Cloud TTS");
  }

  const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
  logger.info({ bytes: audioBuffer.length }, "Speech synthesized");

  return audioBuffer;
}
