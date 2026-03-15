# Plugeasy AI Agent Support

AI-powered customer support call bot for Plugeasy EV chargers. Customers call in, describe their issue by voice, and the AI resolves it — or escalates to a human operator.

## How It Works

```
Customer calls → Twilio receives call
  → Greeting + record customer's voice
  → OpenAI Whisper transcribes speech (auto-detects language)
  → GPT-4 generates response using EV charger FAQ knowledge
  → Google Cloud TTS speaks the answer back
  → Loop until resolved or escalate to human operator
```

Handles ~60–70% of calls automatically. Supports English, Hindi, Kannada, Tamil, Telugu, and Marathi.

## Tech Stack

| Function       | Tool                           |
| -------------- | ------------------------------ |
| Call handling  | Twilio Voice                   |
| Speech-to-Text | OpenAI Whisper                 |
| AI brain       | GPT-4                          |
| Text-to-Speech | Google Cloud TTS               |
| Server         | Node.js + TypeScript + Express |

## Project Structure

```
src/
├── index.ts                          # Entry point
├── config/
│   ├── env.ts                        # Environment variable validation
│   └── constants.ts                  # Voice map, GPT settings, call limits
├── server/
│   ├── app.ts                        # Express setup
│   └── routes/
│       ├── twilio.routes.ts          # Twilio webhook endpoints
│       └── health.routes.ts          # GET /health
├── services/
│   ├── stt.service.ts                # Whisper transcription + language detection
│   ├── llm.service.ts                # GPT-4 response generation
│   ├── tts.service.ts                # Google Cloud TTS synthesis
│   └── call-handler.service.ts       # Orchestrates the full call pipeline
├── twilio/
│   ├── webhook-handler.ts            # Incoming call + recording handlers
│   └── twiml-builder.ts              # TwiML XML builders
├── knowledge/
│   ├── system-prompt.ts              # GPT-4 persona and rules
│   └── faq-data.ts                   # Loads FAQ from JSON
├── utils/
│   └── logger.ts                     # Pino structured logging
└── types/
    └── index.ts                      # Shared TypeScript types

knowledge-base/
└── ev-charger-faq.json               # EV charger FAQ (15 entries, 6 categories)

scripts/
├── test-stt.ts                       # Test Whisper standalone
├── test-llm.ts                       # Test GPT-4 with FAQ prompt
└── test-tts.ts                       # Test Google Cloud TTS
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

### 3. Get API keys

**Twilio** (call handling)

1. Sign up at https://www.twilio.com/try-twilio
2. Copy your **Account SID** and **Auth Token** from the dashboard
3. Buy a phone number with Voice capability
4. Set the phone number's voice webhook to `https://{your-url}/twilio/voice` (HTTP POST)

**OpenAI** (Whisper STT + GPT-4)

1. Sign up at https://platform.openai.com/signup
2. Create an API key at https://platform.openai.com/api-keys
3. Add billing credits ($5+ required for GPT-4 access)

**Google Cloud TTS** (text-to-speech)

1. Create a project at https://console.cloud.google.com
2. Enable the **Cloud Text-to-Speech API**
3. Create a service account and download the JSON key
4. Save it as `google-credentials.json` in the project root

### 4. Run the dev server

```bash
npm run dev
```

### 5. Expose to the internet (for Twilio webhooks)

```bash
npx ngrok http 3000
```

Copy the HTTPS URL and:

- Set `BASE_URL` in `.env` to the ngrok URL
- Update your Twilio phone number webhook to `https://{ngrok-url}/twilio/voice`

### 6. Test it

Call your Twilio phone number and describe an EV charger issue.

## Test Individual Services

```bash
# Test GPT-4 with the FAQ knowledge base
npm run test:llm "My charger shows a red light"

# Test Whisper speech-to-text (provide a .wav file)
npm run test:stt path/to/audio.wav

# Test Google Cloud TTS
npm run test:tts "Your charger may have a ground fault"
```

## API Endpoints

| Method | Path                         | Description                      |
| ------ | ---------------------------- | -------------------------------- |
| POST   | `/twilio/voice`              | Incoming call webhook            |
| POST   | `/twilio/recording-complete` | Recording finished callback      |
| POST   | `/twilio/status`             | Call status updates              |
| GET    | `/health`                    | Health check                     |
| GET    | `/audio/{filename}`          | Serves generated TTS audio files |

## Escalation

The AI escalates to a human operator when:

- Safety concerns are raised (burning smell, smoke, sparking)
- Customer asks for a human agent
- Warranty claims or refund requests
- Issue is unresolved after 3 conversation turns

## Customizing the Knowledge Base

Edit `knowledge-base/ev-charger-faq.json` to add or update FAQ entries. The server loads this file at startup — restart to pick up changes.

## Scripts

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `npm run dev`      | Start dev server with hot reload |
| `npm run build`    | Compile TypeScript to `dist/`    |
| `npm start`        | Run compiled production server   |
| `npm run test:stt` | Test Whisper STT                 |
| `npm run test:llm` | Test GPT-4 responses             |
| `npm run test:tts` | Test Google Cloud TTS            |
