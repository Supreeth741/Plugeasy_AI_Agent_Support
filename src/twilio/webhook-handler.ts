import { Request, Response } from "express";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import {
  buildGreetingTwiml,
  buildResponseTwiml,
  buildEscalationTwiml,
  buildErrorTwiml,
} from "./twiml-builder";
import {
  handleCallTurn,
  getSessionData,
  cleanupSession,
} from "../services/call-handler.service";
import { synthesizeSpeech } from "../services/tts.service";
import {
  saveAudioFile,
  cleanupAudioFiles,
} from "../services/audio-file.service";

import { createEscalation } from "../services/escalation.service";
import { updateCallLog } from "../services/call-log.service";
import { emitEscalationEvent } from "../server/socket";

export async function handleIncomingCall(
  req: Request,
  res: Response,
): Promise<void> {
  const callSid = req.body.CallSid as string;
  const from = req.body.From as string;

  logger.info({ callSid, from }, "Incoming call received");

  try {
    const greetingText =
      "Hello! Thank you for calling PlugEasy EV Charger Support. How can I help you today?";
    const audioBuffer = await synthesizeSpeech(greetingText, "en");
    const audioUrl = saveAudioFile(audioBuffer, callSid, 0);

    const gatherCallbackUrl = `${config.baseUrl}/twilio/gather-complete`;
    const twiml = buildGreetingTwiml(audioUrl, gatherCallbackUrl, "en");

    res.type("text/xml");
    res.send(twiml);
  } catch (error) {
    logger.error({ callSid, error }, "Error generating greeting audio");
    res.type("text/xml");
    res.send(buildErrorTwiml());
  }
}

export async function handleGatherComplete(
  req: Request,
  res: Response,
): Promise<void> {
  const callSid = req.body.CallSid as string;
  const from = req.body.From as string;
  const speechResult = req.body.SpeechResult as string;

  logger.info({ callSid, speechResult }, "Speech received");

  if (!speechResult) {
    logger.warn({ callSid }, "No speech detected");
    res.type("text/xml");
    res.send(buildErrorTwiml());
    return;
  }

  try {
    const result = await handleCallTurn(callSid, from, speechResult);

    if (result.shouldEscalate) {
      // Save escalation to MongoDB
      const session = getSessionData(callSid);
      try {
        const escalation = await createEscalation(
          callSid,
          result.text,
          from,
          session?.conversationHistory || [],
        );

        await updateCallLog(callSid, {
          status: "escalated",
          escalated: true,
          escalationReason: result.text,
        });

        emitEscalationEvent(escalation);
      } catch (err) {
        logger.error({ callSid, err }, "Failed to save escalation");
      }

      const audioBuffer = await synthesizeSpeech(
        result.text,
        result.detectedLanguage,
      );
      const audioUrl = saveAudioFile(audioBuffer, callSid, result.turnNumber);
      const twiml = buildEscalationTwiml(
        audioUrl,
        config.escalationPhoneNumber,
      );

      res.type("text/xml");
      res.send(twiml);
      return;
    }

    // Append follow-up question to the response text before TTS
    const fullResponseText = `${result.text} Is there anything else I can help you with?`;
    const audioBuffer = await synthesizeSpeech(
      fullResponseText,
      result.detectedLanguage,
    );
    const audioUrl = saveAudioFile(audioBuffer, callSid, result.turnNumber);

    const gatherCallbackUrl = `${config.baseUrl}/twilio/gather-complete`;
    const twiml = buildResponseTwiml(
      audioUrl,
      gatherCallbackUrl,
      result.detectedLanguage,
    );

    res.type("text/xml");
    res.send(twiml);
  } catch (error) {
    logger.error({ callSid, error }, "Error processing speech");
    res.type("text/xml");
    res.send(buildErrorTwiml());
  }
}

export function handleCallStatus(req: Request, res: Response): void {
  const callSid = req.body.CallSid as string;
  const status = req.body.CallStatus as string;

  logger.info({ callSid, status }, "Call status update");

  if (
    status === "completed" ||
    status === "failed" ||
    status === "busy" ||
    status === "no-answer"
  ) {
    cleanupAudioFiles(callSid);
    cleanupSession(callSid);
  }

  res.sendStatus(200);
}
