/**
 * Test script: Whisper STT
 * Usage: npx tsx scripts/test-stt.ts [path-to-audio-file]
 *
 * If no audio file is provided, creates a silent WAV for API validation.
 */
import fs from "fs";
import "dotenv/config";
import { transcribeAudio } from "../src/services/stt.service";

async function main() {
  const audioPath = process.argv[2];

  if (!audioPath) {
    console.log("Usage: npx tsx scripts/test-stt.ts <path-to-wav-file>");
    console.log("\nNo audio file provided. Testing API connectivity...\n");

    // Create a minimal valid WAV file (silence) to test the API
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36, 4); // file size - 8
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); // chunk size
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(1, 22); // mono
    header.writeUInt32LE(16000, 24); // sample rate
    header.writeUInt32LE(32000, 28); // byte rate
    header.writeUInt16LE(2, 32); // block align
    header.writeUInt16LE(16, 34); // bits per sample
    header.write("data", 36);
    header.writeUInt32LE(0, 40); // data size

    try {
      const result = await transcribeAudio(header, "test-silence.wav");
      console.log("STT API is reachable!");
      console.log("Result:", result);
    } catch (error: any) {
      console.error("STT API test failed:", error.message);
    }
    return;
  }

  if (!fs.existsSync(audioPath)) {
    console.error(`File not found: ${audioPath}`);
    process.exit(1);
  }

  const audioBuffer = fs.readFileSync(audioPath);
  console.log(`Transcribing: ${audioPath} (${audioBuffer.length} bytes)\n`);

  const result = await transcribeAudio(audioBuffer, audioPath);
  console.log("Transcription:", result.text);
  console.log("Language:", result.language);
}

main().catch(console.error);
