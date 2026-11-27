import type { ActionKey, Language, Voice } from "./types";

export const LANGUAGES: { id: Language; label: string; native: string; hello: string }[] = [
  { id: "te", label: "Telugu", native: "తెలుగు", hello: "నమస్కారం" },
  { id: "hi", label: "Hindi", native: "हिन्दी", hello: "नमस्ते" },
  { id: "en", label: "English", native: "English", hello: "Hello" },
];

// Natural voices: Sarvam bulbul:v4-flash speakers recorded per language and speaking style.
// The id is the Sarvam speaker id, so the voice worker can use it directly.
export const VOICE_MODEL = "bulbul:v4-flash";
export const VOICES: Voice[] = [
  { id: "kavitha_te_conversation", name: "Kavitha", language: "te", gender: "female", tone: "Warm, everyday Telugu", premium: false },
  { id: "pooja_te_conversation", name: "Pooja", language: "te", gender: "female", tone: "Bright, friendly", premium: false },
  { id: "kavitha_te_narration", name: "Kavitha (calm)", language: "te", gender: "female", tone: "Slow, clear, reassuring", premium: true },
  { id: "tarun_te_narration", name: "Tarun", language: "te", gender: "male", tone: "Steady, confident", premium: true },
  { id: "ritu_hi_conversation", name: "Ritu", language: "hi", gender: "female", tone: "Natural, conversational", premium: false },
  { id: "simran_hi_conversation", name: "Simran", language: "hi", gender: "female", tone: "Warm, polite", premium: false },
  { id: "ishita_enhi_customer", name: "Ishita", language: "hi", gender: "female", tone: "Hinglish customer care", premium: true },
  { id: "rahul_hi_conversational", name: "Rahul", language: "hi", gender: "male", tone: "Easy-going, friendly", premium: false },
  { id: "aditya_hi_sales", name: "Aditya", language: "hi", gender: "male", tone: "Persuasive sales", premium: true },
  { id: "simran_en_conversation", name: "Simran", language: "en", gender: "female", tone: "Indian English, natural", premium: false },
  { id: "roopa_en_conversational", name: "Roopa", language: "en", gender: "female", tone: "Calm, articulate", premium: false },
  { id: "ishita_en_customer", name: "Ishita", language: "en", gender: "female", tone: "Customer care", premium: true },
  { id: "dev_en_conversational", name: "Dev", language: "en", gender: "male", tone: "Young, friendly", premium: false },
  { id: "deven_en_conversation", name: "Deven", language: "en", gender: "male", tone: "Mature, assured", premium: true },
];

export const voicesFor = (lang: Language) => VOICES.filter((v) => v.language === lang);

export const ACTIONS: Record<ActionKey, { label: string; hint: string }> = {
  save_lead: { label: "Save lead details", hint: "Name, budget, needs and status go into your lead list" },
  book_visit: { label: "Book appointments", hint: "Site visits, demos, test drives or table bookings" },
  callback: { label: "Schedule callbacks", hint: "Calls back at the exact time the customer asks" },
  transfer: { label: "Transfer to your team", hint: "Hands serious or upset callers to a person, live" },
  whatsapp: { label: "Send on WhatsApp", hint: "Location, brochure or payment link, mid-call" },
  calendar: { label: "Google Calendar", hint: "Books straight into your team's calendar" },
  webhook: { label: "Update your CRM", hint: "Posts every outcome to your CRM or Zapier" },
  memory: { label: "Caller memory", hint: "Remembers returning callers and past conversations" },
};

// Unknown ids (e.g. older v3 speakers) fall back to the first natural voice for that language.
export const voiceById = (id: string, lang?: Language) =>
  VOICES.find((v) => v.id === id) ?? (lang ? voicesFor(lang)[0] : undefined) ?? VOICES[0];
export const languageById = (id: Language) => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];


// Price per connected minute, in rupees (credits).
