import fs from "fs";
import path from "path";
import { config } from "../config/env";
import { logger } from "../utils/logger";

const AUDIO_DIR = path.join(process.cwd(), "tmp", "audio");

export function ensureAudioDir(): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

export function saveAudioFile(
  audioBuffer: Buffer,
  callSid: string,
  turnNumber: number,
): string {
  ensureAudioDir();
  const filename = `${callSid}-${turnNumber}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filePath, audioBuffer);

  const audioUrl = `${config.baseUrl}/audio/${filename}`;
  logger.info({ callSid, filename, audioUrl }, "Audio file saved");
  return audioUrl;
}

export function cleanupAudioFiles(callSid: string): void {
  try {
    if (!fs.existsSync(AUDIO_DIR)) return;
    const files = fs.readdirSync(AUDIO_DIR);
    for (const file of files) {
      if (file.startsWith(callSid)) {
        fs.unlinkSync(path.join(AUDIO_DIR, file));
      }
    }
    logger.info({ callSid }, "Audio files cleaned up");
  } catch (error) {
    logger.warn({ callSid, error }, "Error cleaning up audio files");
  }
}
