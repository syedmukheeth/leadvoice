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
  { id: "kavitha_te_narration", name: "Kavitha · calm", language: "te", gender: "female", tone: "Slow, clear, reassuring", premium: true },
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

export interface Template {
  key: string;
  industry: string;
  title: string;
  example: string; // sample one-line task, shown as placeholder
  outcome: string;
  direction: "inbound" | "outbound" | "both";
  actions: ActionKey[];
  questions: string[]; // what the agent finds out
  accent: string; // tailwind bg class for the tile chip
}

export const TEMPLATES: Template[] = [
  { key: "real_estate", industry: "Real estate", title: "Qualify buyers, book site visits", example: "Call every Facebook lead for our Guntur plots, find their budget and book a Sunday site visit.", outcome: "Site visit booked", direction: "both", actions: ["save_lead", "book_visit", "callback", "transfer", "whatsapp", "memory"], questions: ["Own use or investment", "Budget", "Preferred size / facing", "When they plan to buy"], accent: "bg-signal-soft" },
  { key: "loans", industry: "Loans & insurance", title: "Screen eligibility, chase documents", example: "Call loan applicants, check salary and city, and remind them to upload PAN and payslips.", outcome: "Documents promised", direction: "outbound", actions: ["save_lead", "callback", "whatsapp", "webhook"], questions: ["Monthly income", "Employment type", "Loan amount", "Documents ready"], accent: "bg-live-soft" },
  { key: "coaching", industry: "Coaching & education", title: "Explain batches, book demo classes", example: "Call students who enquired, explain NEET batches and fees, and book a free demo class.", outcome: "Demo class booked", direction: "both", actions: ["save_lead", "book_visit", "callback", "whatsapp"], questions: ["Class / exam", "Preferred batch timing", "Parent decision maker"], accent: "bg-violet-soft" },
  { key: "hospital", industry: "Hospitals & clinics", title: "Answer patients, book appointments", example: "Answer calls to our clinic, tell timings and doctor availability, and book appointments.", outcome: "Appointment booked", direction: "inbound", actions: ["book_visit", "calendar", "transfer", "memory"], questions: ["Department / doctor", "Preferred date", "New or follow-up visit"], accent: "bg-hot-soft" },
  { key: "car_dealer", industry: "Car dealerships", title: "Follow up enquiries, book test drives", example: "Follow up website enquiries for the new SUV and book a test drive at the nearest showroom.", outcome: "Test drive booked", direction: "outbound", actions: ["save_lead", "book_visit", "callback", "whatsapp"], questions: ["Model interest", "Budget / finance", "Exchange vehicle"], accent: "bg-cold-soft" },
  { key: "cod", industry: "E-commerce", title: "Confirm cash-on-delivery orders", example: "Call every COD order, confirm the address and delivery time, and cancel fake orders.", outcome: "Order confirmed", direction: "outbound", actions: ["webhook", "callback", "whatsapp"], questions: ["Address correct", "Available for delivery", "Still wants the order"], accent: "bg-warm-soft" },
  { key: "restaurant", industry: "Restaurants", title: "Take table and party bookings", example: "Answer our restaurant line, take table bookings and party enquiries for 20+ people.", outcome: "Table booked", direction: "inbound", actions: ["book_visit", "calendar", "transfer"], questions: ["Date & time", "Number of guests", "Occasion"], accent: "bg-signal-soft" },
  { key: "recruitment", industry: "Recruitment", title: "Screen candidates", example: "Call applicants for the sales executive role, check notice period, current salary and location.", outcome: "Candidate shortlisted", direction: "outbound", actions: ["save_lead", "callback", "webhook"], questions: ["Notice period", "Current / expected salary", "Location"], accent: "bg-live-soft" },
];

export const templateByKey = (key: string) => TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0];
// Unknown ids (e.g. older v3 speakers) fall back to the first natural voice for that language.
export const voiceById = (id: string, lang?: Language) =>
  VOICES.find((v) => v.id === id) ?? (lang ? voicesFor(lang)[0] : undefined) ?? VOICES[0];
export const languageById = (id: Language) => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];

const KEYWORDS: Record<string, string[]> = {
  real_estate: ["plot", "flat", "villa", "site visit", "property", "real estate", "apartment", "layout", "venture"],
  loans: ["loan", "emi", "insurance", "document", "kyc", "policy", "credit"],
  coaching: ["student", "batch", "course", "coaching", "class", "neet", "jee", "fees", "admission"],
  hospital: ["patient", "doctor", "clinic", "hospital", "appointment", "opd"],
  car_dealer: ["car", "test drive", "showroom", "suv", "bike", "vehicle"],
  cod: ["cod", "order", "delivery", "cash on delivery", "address"],
  restaurant: ["table", "restaurant", "party", "dinner", "booking for"],
  recruitment: ["candidate", "notice period", "salary", "hiring", "interview", "job"],
};

export function guessTemplate(task: string): Template {
  const t = task.toLowerCase();
  let best = TEMPLATES[0], score = 0;
  for (const tpl of TEMPLATES) {
    const s = (KEYWORDS[tpl.key] ?? []).filter((k) => t.includes(k)).length;
    if (s > score) { best = tpl; score = s; }
  }
  return best;
}

// Price per connected minute, in rupees (credits).
export const PRICE_PER_MIN = { standard: 4.5, premium: 6 };
