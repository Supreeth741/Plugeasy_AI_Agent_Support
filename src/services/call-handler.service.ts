import fs from "fs";
import path from "path";
import { config } from "../config/env";
import { CALL_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";
import { CallSession, Message } from "../types";
import { transcribeAudio } from "./stt.service";
import { generateResponse } from "./llm.service";
import { synthesizeSpeech } from "./tts.service";
import { loadFAQData } from "../knowledge/faq-data";
import { buildSystemPrompt } from "../knowledge/system-prompt";

// In-memory call session store
const sessions = new Map<string, CallSession>();

// Directory for temporary TTS audio files
const AUDIO_DIR = path.join(process.cwd(), "tmp", "audio");

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

interface CallTurnResult {
  text: string;
  shouldEscalate: boolean;
  audioFilename: string;
}

function getOrCreateSession(callSid: string, from: string): CallSession {
  let session = sessions.get(callSid);
  if (!session) {
    session = {
      callSid,
      from,
      detectedLanguage: "en",
      conversationHistory: [],
      turnCount: 0,
      createdAt: new Date(),
    };
    sessions.set(callSid, session);
    logger.info({ callSid, from }, "New call session created");
  }
  return session;
}

async function downloadRecording(recordingUrl: string): Promise<Buffer> {
  // Twilio recordings require authentication
  const url = new URL(recordingUrl);
  url.username = config.twilioAccountSid;
  url.password = config.twilioAuthToken;

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Failed to download recording: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function handleCallTurn(
  callSid: string,
  from: string,
  recordingUrl: string,
): Promise<CallTurnResult> {
  const session = getOrCreateSession(callSid, from);
  session.turnCount++;

  logger.info({ callSid, turn: session.turnCount }, "Processing call turn");

  // 1. Download the recording from Twilio
  const audioBuffer = await downloadRecording(recordingUrl);

  // 2. Transcribe with Whisper
  const sttResult = await transcribeAudio(audioBuffer);
  session.detectedLanguage = sttResult.language;

  logger.info(
    { callSid, text: sttResult.text, language: sttResult.language },
    "Transcription result",
  );

  // 3. Check if we should force escalation (too many turns)
  const forceEscalate =
    session.turnCount >= CALL_SETTINGS.ESCALATION_AFTER_TURNS;

  // 4. Generate AI response
  const faqData = loadFAQData();
  const systemPrompt = buildSystemPrompt(faqData);

  const llmResponse = await generateResponse(
    systemPrompt,
    session.conversationHistory,
    sttResult.text,
    sttResult.language,
  );

  // 5. Update conversation history
  session.conversationHistory.push(
    { role: "user", content: sttResult.text },
    { role: "assistant", content: llmResponse.text },
  );

  const shouldEscalate = llmResponse.shouldEscalate || forceEscalate;

  if (shouldEscalate) {
    logger.info(
      { callSid, reason: forceEscalate ? "max_turns" : "llm_decision" },
      "Escalating call",
    );
  }

  // 6. Generate TTS audio
  const audioContent = await synthesizeSpeech(
    llmResponse.text,
    sttResult.language,
  );
  const audioFilename = `${callSid}-${session.turnCount}.mp3`;
  const audioPath = path.join(AUDIO_DIR, audioFilename);
  fs.writeFileSync(audioPath, audioContent);

  logger.info({ callSid, audioFilename }, "TTS audio saved");

  return {
    text: llmResponse.text,
    shouldEscalate,
    audioFilename,
  };
}

// Clean up session when call ends
export function cleanupSession(callSid: string): void {
  sessions.delete(callSid);
  logger.info({ callSid }, "Call session cleaned up");
}
