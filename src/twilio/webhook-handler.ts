import { Request, Response } from "express";
import { config } from "../config/env";
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

  const gatherCallbackUrl = `${config.baseUrl}/twilio/gather-complete`;
  const twiml = buildGreetingTwiml(gatherCallbackUrl);

  res.type("text/xml");
  res.send(twiml);
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
      const twiml = buildEscalationTwiml(
        result.text,
        config.escalationPhoneNumber,
      );
      res.type("text/xml");
      res.send(twiml);
      return;
    }

    const gatherCallbackUrl = `${config.baseUrl}/twilio/gather-complete`;
    const twiml = buildResponseTwiml(result.text, gatherCallbackUrl);

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

  res.sendStatus(200);
}
