import { Request, Response } from "express";
import { config } from "../config/env";
import { CALL_SETTINGS } from "../config/constants";
import { logger } from "../utils/logger";
import {
  buildGreetingTwiml,
  buildResponseTwiml,
  buildEscalationTwiml,
  buildErrorTwiml,
} from "./twiml-builder";
import { handleCallTurn } from "../services/call-handler.service";

export function handleIncomingCall(req: Request, res: Response): void {
  const callSid = req.body.CallSid as string;
  const from = req.body.From as string;

  logger.info({ callSid, from }, "Incoming call received");

  const recordingCallbackUrl = `${config.baseUrl}/twilio/recording-complete`;
  const twiml = buildGreetingTwiml(
    recordingCallbackUrl,
    CALL_SETTINGS.MAX_RECORDING_SECONDS,
  );

  res.type("text/xml");
  res.send(twiml);
}

export async function handleRecordingComplete(
  req: Request,
  res: Response,
): Promise<void> {
  const callSid = req.body.CallSid as string;
  const recordingUrl = req.body.RecordingUrl as string;
  const from = req.body.From as string;

  logger.info({ callSid, recordingUrl }, "Recording complete");

  try {
    // Twilio provides the recording URL without .wav extension — append it
    const audioUrl = `${recordingUrl}.wav`;

    const result = await handleCallTurn(callSid, from, audioUrl);

    if (result.shouldEscalate) {
      const twiml = buildEscalationTwiml(
        result.text,
        config.escalationPhoneNumber,
      );
      res.type("text/xml");
      res.send(twiml);
      return;
    }

    // Serve the generated TTS audio and continue conversation
    const ttsAudioUrl = `${config.baseUrl}/audio/${result.audioFilename}`;
    const recordingCallbackUrl = `${config.baseUrl}/twilio/recording-complete`;

    const twiml = buildResponseTwiml(
      ttsAudioUrl,
      recordingCallbackUrl,
      CALL_SETTINGS.MAX_RECORDING_SECONDS,
    );

    res.type("text/xml");
    res.send(twiml);
  } catch (error) {
    logger.error({ callSid, error }, "Error processing recording");
    res.type("text/xml");
    res.send(buildErrorTwiml());
  }
}

export function handleCallStatus(req: Request, res: Response): void {
  const callSid = req.body.CallSid as string;
  const status = req.body.CallStatus as string;

  logger.info({ callSid, status }, "Call status update");

  res.sendStatus(200);
}
