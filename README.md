# LeadVoice

Self-serve AI telecallers for Indian businesses. Describe the job in one sentence, pick a natural Telugu, Hindi or English voice, and the AI employee calls your leads, answers questions from what you taught it, and books the visit, callback or order.

This is the web app (Next.js 16). The phone-calling voice worker lives in the sibling `telugu-agent` project.

## What's in it

- **Overview:** wins, connect rate, spend and cost per win, a 14-day call chart and the call funnel.
- **AI employees:** hire from one sentence (Gemini writes the script), edit script, knowledge, actions and voice, and test-call in the browser.
- **Calls:** every call with filters, search and a transcript replay.
- **Leads:** status board, paste or CSV import, and a lead API (`POST /api/v1/leads` with a Bearer key).
- **Voices:** native Sarvam voices with samples.

Until Supabase is connected the app runs on a sample workspace stored in `.data/store.json` (on Vercel, in the server's temp folder, reset on redeploy).

## Run locally

```bash
npm install
cp .env.example .env.local   # add GOOGLE_API_KEY and SARVAM_API_KEY
npm run dev                  # http://localhost:3000
```

Keys are also picked up from `../telugu-agent/.env`, so if the voice agent is set up you can skip `.env.local`.

## Checks

```bash
npm test          # unit tests (node --test)
npm run lint
npx tsc --noEmit
npm run build
```

## Deploy (Vercel)

```bash
vercel link --yes --project leadvoice
vercel env add GOOGLE_API_KEY production
vercel env add SARVAM_API_KEY production
vercel deploy --prod
```

Without the two keys the site still works on sample data; test calls, AI script writing and voice samples switch on once they are added.
