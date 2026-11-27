# ASRG Constructions: AI calling desk

A custom AI calling portal built by LeadVoice for one business. The AI agents call leads and answer calls in Telugu, Hindi and English, answer questions only from what they've been taught, and book site visits and callbacks.

Everything client-specific lives in `src/lib/client.ts` (name, city, how names are pronounced) and in each agent's script and knowledge. The phone-calling voice agent lives in the sibling `telugu-agent` project.

## Pages

- **Overview:** site visits booked, connect rate, talk time and callbacks, a 14-day call chart and the call funnel.
- **Talk to AI:** call any agent from the browser, like a phone call. Calls are live (Gemini Live): the agent's voice streams back as it speaks, replies start in about a second, and you can cut in any time. If live calls are busy, the call switches to step-by-step mode (Sarvam speech + Gemini) on its own. Every call is saved under Calls. Use Chrome and allow the microphone.
- **AI agents:** each agent's script, knowledge, actions and voice.
- **Calls:** every call with filters, search and a transcript replay.
- **Leads:** status board, paste or CSV import.
- **Integrations:** a lead API (`POST /api/v1/leads` with a Bearer key) and an outcome webhook for websites, ads and CRMs.

The desk's call activity (enquiries, calls, retries, callbacks, bookings) is generated from the clock in `src/lib/activity.ts`: two weeks of history during calling hours, growing through the day. What people set or add (agent edits, uploaded leads, Talk to AI calls) is saved in `.data/store.json` (on Vercel, in the server's temp folder, reset on redeploy).

## Run locally

```bash
npm install
cp .env.example .env.local   # add GOOGLE_API_KEY and SARVAM_API_KEY
npm run dev                  # http://localhost:3000
```

Keys are also read from `../telugu-agent/.env`, so if the voice agent is set up you can skip `.env.local`.

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Deploy (Vercel)

```bash
vercel link --yes --project leadvoice
vercel env add SITE_PASSWORD production
vercel env add GOOGLE_API_KEY production
vercel env add SARVAM_API_KEY production
vercel deploy --prod
```

The site is password protected: it stays locked until `SITE_PASSWORD` is set, and visitors enter it once per device (30 days).
