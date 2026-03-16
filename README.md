# PlugEasy AI Agent Support

AI-powered customer support call bot for PlugEasy EV chargers. Customers call in, describe their issue by voice, and the AI resolves it — or escalates to a human operator.

## How It Works

```
Customer calls → Twilio receives call
  → Greeting + listen for customer's speech
  → Twilio speech recognition transcribes speech
  → Google Gemini generates response using EV charger FAQ knowledge
  → Twilio TTS (Amazon Polly) speaks the answer back
  → Loop until resolved or escalate to human operator
```

Handles ~60–70% of calls automatically. Supports English, Hindi, Kannada, Tamil, Telugu, and Marathi.

## Tech Stack

| Function       | Tool                                       |
| -------------- | ------------------------------------------ |
| Call handling  | Twilio Voice                               |
| Speech-to-Text | Twilio built-in speech recognition         |
| AI brain       | Google Gemini (`gemini-2.5-flash`)         |
| Text-to-Speech | Twilio TTS (Amazon Polly `Aditi`, `en-IN`) |
| Server         | Node.js + TypeScript + Express             |
| Logging        | Pino (structured JSON)                     |

## Project Structure

```
src/
├── index.ts                          # Entry point
├── config/
│   ├── env.ts                        # Environment variable validation
│   └── constants.ts                  # Gemini settings, call limits
├── server/
│   ├── app.ts                        # Express setup
│   └── routes/
│       ├── twilio.routes.ts          # Twilio webhook endpoints
│       └── health.routes.ts          # GET /health
├── services/
│   ├── llm.service.ts                # Gemini response generation
│   └── call-handler.service.ts       # Orchestrates the full call pipeline
├── twilio/
│   ├── webhook-handler.ts            # Incoming call + gather handlers
│   └── twiml-builder.ts              # TwiML XML builders
├── knowledge/
│   ├── system-prompt.ts              # Gemini persona and rules
│   └── faq-data.ts                   # Loads FAQ from JSON
├── utils/
│   └── logger.ts                     # Pino structured logging
└── types/
    └── index.ts                      # Shared TypeScript types

knowledge-base/
└── ev-charger-faq.json               # EV charger FAQ (15 entries, 6 categories)

scripts/
├── test-stt.ts                       # Test Whisper STT standalone
├── test-llm.ts                       # Test Gemini with FAQ prompt
├── test-tts.ts                       # Test Google Cloud TTS standalone
└── list-models.js                    # List available Gemini models
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

Edit `.env` with your values:

| Variable                  | Required | Description                                     |
| ------------------------- | -------- | ----------------------------------------------- |
| `BASE_URL`                | Yes      | Public URL for Twilio webhooks (e.g. ngrok URL) |
| `TWILIO_ACCOUNT_SID`      | Yes      | Twilio account SID                              |
| `TWILIO_AUTH_TOKEN`       | Yes      | Twilio auth token                               |
| `TWILIO_PHONE_NUMBER`     | Yes      | Twilio phone number with Voice capability       |
| `GEMINI_API_KEY`          | Yes      | Google Gemini API key                           |
| `PORT`                    | No       | Server port (default: `3000`)                   |
| `NODE_ENV`                | No       | Environment mode (default: `development`)       |
| `MAX_CONVERSATION_TURNS`  | No       | Max turns before ending call (default: `10`)    |
| `ESCALATION_PHONE_NUMBER` | No       | Phone number to dial on escalation              |

### 3. Get API keys

**Twilio** (call handling + speech recognition + TTS)

1. Sign up at https://www.twilio.com/try-twilio
2. Copy your **Account SID** and **Auth Token** from the dashboard
3. Buy a phone number with Voice capability
4. Set the phone number's voice webhook to `https://{your-url}/twilio/voice` (HTTP POST)

**Google Gemini** (AI brain)

1. Go to https://aistudio.google.com/
2. Create an API key from Google AI Studio

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
# Test Gemini with the FAQ knowledge base
npm run test:llm "My charger shows a red light"

# Test Whisper speech-to-text (provide a .wav file)
npm run test:stt path/to/audio.wav

# Test Google Cloud TTS
npm run test:tts "Your charger may have a ground fault"
```

## API Endpoints

| Method | Path                      | Description                         |
| ------ | ------------------------- | ----------------------------------- |
| POST   | `/twilio/voice`           | Incoming call webhook               |
| POST   | `/twilio/gather-complete` | Speech recognition results callback |
| POST   | `/twilio/status`          | Call status updates                 |
| GET    | `/health`                 | Health check                        |

## Call Flow

1. Customer calls the Twilio number → Twilio POSTs to `/twilio/voice`
2. Server responds with TwiML containing `<Gather input="speech">` pointed at `/twilio/gather-complete`
3. Customer speaks → Twilio transcribes and POSTs `SpeechResult` to `/twilio/gather-complete`
4. Server sends transcription to Gemini, gets AI response, returns TwiML with `<Say>` + another `<Gather>` for the next turn
5. Loop continues until the issue is resolved or escalation is triggered

## Escalation

The AI escalates to a human operator when:

- Safety concerns are raised (burning smell, smoke, sparking)
- Customer asks for a human agent
- Warranty claims or refund requests
- Issue is unresolved after 3 conversation turns

When escalating, if `ESCALATION_PHONE_NUMBER` is configured the call is transferred via `<Dial>`. Otherwise the customer is told the team will call back.

## Customizing the Knowledge Base

Edit `knowledge-base/ev-charger-faq.json` to add or update FAQ entries. The server loads this file at startup — restart to pick up changes.

## Scripts

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `npm run dev`      | Start dev server with hot reload |
| `npm run build`    | Compile TypeScript to `dist/`    |
| `npm start`        | Run compiled production server   |
| `npm run test:stt` | Test Whisper STT standalone      |
| `npm run test:llm` | Test Gemini responses            |
| `npm run test:tts` | Test Google Cloud TTS standalone |
