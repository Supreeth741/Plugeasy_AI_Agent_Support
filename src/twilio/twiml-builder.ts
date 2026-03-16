import twilio from "twilio";

const { VoiceResponse } = twilio.twiml;

const VOICE = "Polly.Aditi" as const;
const LANGUAGE = "en-IN" as const;

export function buildGreetingTwiml(gatherCallbackUrl: string): string {
  const response = new VoiceResponse();

  const gather = response.gather({
    input: ["speech"],
    action: gatherCallbackUrl,
    method: "POST",
    speechTimeout: "auto",
    language: LANGUAGE,
  });

  gather.say(
    { voice: VOICE, language: LANGUAGE },
    "Hello! Thank you for calling PlugEasy EV Charger Support. How can I help you today?",
  );

  // If no speech detected, prompt again
  response.say(
    { voice: VOICE, language: LANGUAGE },
    "I did not hear anything. Goodbye.",
  );

  return response.toString();
}

export function buildResponseTwiml(
  responseText: string,
  gatherCallbackUrl: string,
): string {
  const response = new VoiceResponse();

  const gather = response.gather({
    input: ["speech"],
    action: gatherCallbackUrl,
    method: "POST",
    speechTimeout: "auto",
    language: LANGUAGE,
  });

  gather.say(
    { voice: VOICE, language: LANGUAGE },
    responseText + " Is there anything else I can help you with?",
  );

  // If no speech, say goodbye
  response.say(
    { voice: VOICE, language: LANGUAGE },
    "Thank you for calling PlugEasy. Goodbye!",
  );

  return response.toString();
}

export function buildEscalationTwiml(
  escalationMessage: string,
  escalationNumber: string,
): string {
  const response = new VoiceResponse();

  response.say({ voice: VOICE, language: LANGUAGE }, escalationMessage);

  if (escalationNumber) {
    response.dial(escalationNumber);
  } else {
    response.say(
      { voice: VOICE, language: LANGUAGE },
      "Our team will call you back shortly. Thank you for your patience. Goodbye.",
    );
  }

  return response.toString();
}

export function buildErrorTwiml(): string {
  const response = new VoiceResponse();

  response.say(
    { voice: VOICE, language: LANGUAGE },
    "I apologize, but I am having trouble right now. Please try calling back in a few minutes. Goodbye.",
  );

  return response.toString();
}
