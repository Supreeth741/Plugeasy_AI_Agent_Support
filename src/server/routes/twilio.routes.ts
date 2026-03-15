import { Router } from "express";
import {
  handleIncomingCall,
  handleRecordingComplete,
  handleCallStatus,
} from "../../twilio/webhook-handler";

export const twilioRoutes = Router();

// POST /twilio/voice — Twilio calls this when a call comes in
twilioRoutes.post("/voice", handleIncomingCall);

// POST /twilio/recording-complete — Twilio calls this when recording finishes
twilioRoutes.post("/recording-complete", handleRecordingComplete);

// POST /twilio/status — Twilio calls this with call status updates
twilioRoutes.post("/status", handleCallStatus);
