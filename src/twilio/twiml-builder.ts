import twilio from "twilio";

const { VoiceResponse } = twilio.twiml;

export function buildGreetingTwiml(
  recordingCallbackUrl: string,
  maxRecordingSeconds: number,
): string {
  const response = new VoiceResponse();

  response.say(
    { voice: "Polly.Aditi", language: "en-IN" },
    "Welcome to Plugeasy EV Charger Support. Please describe your issue after the beep.",
  );

  response.record({
    maxLength: maxRecordingSeconds,
    action: recordingCallbackUrl,
    playBeep: true,
    trim: "trim-silence",
  });

  // Fallback if no recording received
  response.say("Sorry, I did not receive any input. Goodbye.");

  return response.toString();
}

export function buildResponseTwiml(
  audioUrl: string,
  recordingCallbackUrl: string,
  maxRecordingSeconds: number,
): string {
  const response = new VoiceResponse();

  response.play(audioUrl);

  response.say(
    { voice: "Polly.Aditi", language: "en-IN" },
    "Is there anything else I can help you with? Please speak after the beep.",
  );

  response.record({
    maxLength: maxRecordingSeconds,
    action: recordingCallbackUrl,
    playBeep: true,
    trim: "trim-silence",
  });

  response.say("Thank you for calling Plugeasy. Goodbye.");

  return response.toString();
}

export function buildEscalationTwiml(
  escalationMessage: string,
  escalationNumber: string,
): string {
  const response = new VoiceResponse();

  response.say({ voice: "Polly.Aditi", language: "en-IN" }, escalationMessage);

  if (escalationNumber) {
    response.dial(escalationNumber);
  } else {
    response.say(
      { voice: "Polly.Aditi", language: "en-IN" },
      "Our team will call you back shortly. Thank you for your patience. Goodbye.",
    );
  }

  return response.toString();
}

export function buildErrorTwiml(): string {
  const response = new VoiceResponse();

  response.say(
    { voice: "Polly.Aditi", language: "en-IN" },
    "I apologize, but I am having trouble processing your request right now. Please try calling back in a few minutes. Goodbye.",
  );

  return response.toString();
}
