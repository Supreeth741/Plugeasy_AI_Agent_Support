import { Router } from "express";
import {
  handleIncomingCall,
  handleGatherComplete,
  handleCallStatus,
} from "../../twilio/webhook-handler";

export const twilioRoutes = Router();

// POST /twilio/voice — Twilio calls this when a call comes in
twilioRoutes.post("/voice", handleIncomingCall);

// POST /twilio/gather-complete — Twilio calls this with speech recognition results
twilioRoutes.post("/gather-complete", handleGatherComplete);

// POST /twilio/status — Twilio calls this with call status updates
twilioRoutes.post("/status", handleCallStatus);
