import textToSpeech from "@google-cloud/text-to-speech";
import {
  SUPPORTED_LANGUAGES,
  TTS_SETTINGS,
  SupportedLanguageCode,
} from "../config/constants";
import { logger } from "../utils/logger";

const client = new textToSpeech.TextToSpeechClient();

export async function synthesizeSpeech(
  text: string,
  language: string,
): Promise<Buffer> {
  const langKey = (
    language in SUPPORTED_LANGUAGES ? language : "en"
  ) as SupportedLanguageCode;
  const langConfig = SUPPORTED_LANGUAGES[langKey];

  logger.info(
    {
      language: langKey,
      voiceName: langConfig.voiceName,
      textLength: text.length,
    },
    "Synthesizing speech",
  );

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: langConfig.code,
      name: langConfig.voiceName,
    },
    audioConfig: {
      audioEncoding: TTS_SETTINGS.AUDIO_ENCODING,
      speakingRate: TTS_SETTINGS.SPEAKING_RATE,
      pitch: TTS_SETTINGS.PITCH,
    },
  });

  if (!response.audioContent) {
    throw new Error("Google Cloud TTS returned empty audio content");
  }

  const audioBuffer = Buffer.isBuffer(response.audioContent)
    ? response.audioContent
    : Buffer.from(response.audioContent);

  logger.info(
    { language: langKey, audioSize: audioBuffer.length },
    "Speech synthesized successfully",
  );

  return audioBuffer;
}
