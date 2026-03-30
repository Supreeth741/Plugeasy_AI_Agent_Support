import twilio from "twilio";
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
} from "../config/constants";

const { VoiceResponse } = twilio.twiml;

function getGatherLanguage(langCode: string): string {
  const key = (
    langCode in SUPPORTED_LANGUAGES ? langCode : "en"
  ) as SupportedLanguageCode;
  return SUPPORTED_LANGUAGES[key].gatherLanguage;
}

export function buildGreetingTwiml(
  audioUrl: string,
  gatherCallbackUrl: string,
  language: string = "en",
): string {
  const response = new VoiceResponse();

  const gather = response.gather({
    input: ["speech"],
    action: gatherCallbackUrl,
    method: "POST",
    speechTimeout: "auto",
    language: getGatherLanguage(language) as any,
  });

  gather.play(audioUrl);

  response.say(
    { voice: "Polly.Aditi", language: "en-IN" },
    "I did not hear anything. Goodbye.",
  );

  return response.toString();
}

export function buildResponseTwiml(
  audioUrl: string,
  gatherCallbackUrl: string,
  language: string = "en",
): string {
  const response = new VoiceResponse();

  const gather = response.gather({
    input: ["speech"],
    action: gatherCallbackUrl,
    method: "POST",
    speechTimeout: "auto",
    language: getGatherLanguage(language) as any,
  });

  gather.play(audioUrl);

  response.say(
    { voice: "Polly.Aditi", language: "en-IN" },
    "Thank you for calling PlugEasy. Goodbye!",
  );

  return response.toString();
}

export function buildEscalationTwiml(
  audioUrl: string,
  escalationNumber: string,
): string {
  const response = new VoiceResponse();

  response.play(audioUrl);

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
    "I apologize, but I am having trouble right now. Please try calling back in a few minutes. Goodbye.",
  );

  return response.toString();
}
