/**
 * Test script: Google Cloud TTS
 * Usage: npx tsx scripts/test-tts.ts "Hello, this is a test" [language-code]
 */
import fs from "fs";
import path from "path";
import "dotenv/config";
import { synthesizeSpeech } from "../src/services/tts.service";

async function main() {
  const text =
    process.argv[2] ||
    "Welcome to Plugeasy. Your charger may have a ground fault. Try pressing the reset button.";
  const language = process.argv[3] || "en";

  console.log(`Text: "${text}"`);
  console.log(`Language: ${language}\n`);

  console.log("Synthesizing speech...\n");
  const audioBuffer = await synthesizeSpeech(text, language);

  const outputDir = path.join(process.cwd(), "tmp", "audio");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `test-tts-${language}.mp3`);
  fs.writeFileSync(outputPath, audioBuffer);

  console.log(`Audio saved to: ${outputPath}`);
  console.log(`Size: ${audioBuffer.length} bytes`);
}

main().catch(console.error);
