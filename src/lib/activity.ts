// The desk's call activity, worked out from the clock instead of stored: every day in the last two
// weeks gets its enquiries, calls, retries, callbacks and bookings during calling hours (9 AM to
// 9 PM, India time). Each day is generated from its own seed, so the past never changes and new
// calls appear as the day goes on. Real calls (test calls, uploaded leads) are stored separately.
import type { Agent, Call, CallStatus, Lead, LeadStatus, TranscriptLine } from "./types";

const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000, IST = 19_800_000; // IST is UTC+5:30
export const ACTIVITY_DAYS = 14; // today and the 13 days before it, as on the dashboard chart

// mulberry32: well mixed even for neighbouring seeds, so one day doesn't echo the next.
function rng(seed: number) {
  let a = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;
const pick = <T,>(r: R, a: readonly T[]) => a[Math.floor(r() * a.length)];
const between = (r: R, lo: number, hi: number) => lo + r() * (hi - lo);

// ---------- People ----------
const MEN = ["Ramesh", "Srinivas", "Venkatesh", "Mahesh", "Naresh", "Suresh", "Ravi", "Prasad", "Kiran", "Anil", "Satish", "Vamsi", "Gopal",
  "Raghu", "Harish", "Chandrasekhar", "Madhu", "Nagaraju", "Sudhakar", "Bhaskar", "Mallikarjuna", "Obulesu", "Ranganath", "Sreenivasulu", "Jagadeesh", "Pavan"];
const WOMEN = ["Lakshmi", "Padma", "Swathi", "Madhavi", "Harika", "Sravani", "Divya", "Keerthi", "Bhavani", "Anitha", "Sujatha", "Hemalatha", "Kavitha", "Sirisha", "Pushpa"];
const SURNAMES = ["Reddy", "Naidu", "Goud", "Chowdary", "Rao", "Setty", "Yadav", "Achari", "Sharma", "Varma", "Gupta", "Raju", "Babu"];
const MUSLIM_MEN = ["Imran", "Afroz", "Irfan", "Sameer", "Rafi", "Khaja", "Javeed", "Ameer", "Saleem"];
const MUSLIM_WOMEN = ["Nasreen", "Ayesha", "Fathima", "Shabana", "Rubeena"];

function person(r: R): { name: string; first: string } {
  const roll = r();
  if (roll < 0.18) {
    const f = pick(r, MUSLIM_MEN);
    return { name: pick(r, [`Shaik ${f}`, `Syed ${f}`, `${f} Khan`, `${f} Basha`]), first: f };
  }
  if (roll < 0.23) {
    const f = pick(r, MUSLIM_WOMEN);
    return { name: pick(r, [`${f} Begum`, `Shaik ${f}`]), first: f };
  }
  const f = roll < 0.75 ? pick(r, MEN) : pick(r, WOMEN);
  return { name: `${f} ${pick(r, SURNAMES)}`, first: f };
}
function phone(r: R) {
  const d = `${pick(r, ["6", "7", "8", "9", "9", "9"])}${String(Math.floor(r() * 1e9)).padStart(9, "0")}`;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

// ---------- Plots and words ----------
const PLOTS = [
  { size: 150, lakh: "13.5", te: "నూట యాభై", budgetTe: "పదమూడున్నర లక్షలు", en: "thirteen and a half lakh" },
  { size: 200, lakh: "18", te: "రెండు వందల", budgetTe: "పద్దెనిమిది లక్షలు", en: "eighteen lakh" },
  { size: 267, lakh: "24", te: "రెండు వందల అరవై ఏడు", budgetTe: "ఇరవై నాలుగు లక్షలు", en: "twenty-four lakh" },
] as const;
const SLOTS = [
  { label: "10:00 AM", te: "ఉదయం పది గంటలకి", en: "ten in the morning", h: 10 },
  { label: "11:00 AM", te: "ఉదయం పదకొండు గంటలకి", en: "eleven in the morning", h: 11 },
  { label: "12:00 PM", te: "మధ్యాహ్నం పన్నెండు గంటలకి", en: "twelve noon", h: 12 },
  { label: "4:00 PM", te: "సాయంత్రం నాలుగు గంటలకి", en: "four in the evening", h: 16 },
  { label: "5:00 PM", te: "సాయంత్రం ఐదు గంటలకి", en: "five in the evening", h: 17 },
] as const;
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_TE = ["ఆదివారం", "సోమవారం", "మంగళవారం", "బుధవారం", "గురువారం", "శుక్రవారం", "శనివారం"];
const DAY_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const KAVYA_SOURCES = ["Facebook ad", "Facebook ad", "Instagram ad", "99acres", "MagicBricks", "Housing.com", "Website", "Hoarding", "Referral", "Walk-in"];
const USES = {
  own: ["Own house", "Building for parents", "Own house, building next year", "Own house, moving from Hyderabad"],
  invest: ["Investment", "Investment for son's future", "NRI in Dubai, family will visit", "Investment, may resell later"],
} as const;

// IST calendar helpers (timestamps are UTC milliseconds).
const istDayStart = (t: number) => Math.floor((t + IST) / DAY) * DAY - IST;
const istWeekday = (t: number) => new Date(t + IST).getUTCDay();
const istHour = (t: number) => new Date(t + IST).getUTCHours() + new Date(t + IST).getUTCMinutes() / 60;
// Next calling-hours moment at or after t (9:05 AM to 8:45 PM).
function inHours(t: number, r: R) {
  const start = istDayStart(t), h = istHour(t);
  if (h < 9) return start + 9 * HOUR + between(r, 5, 50) * MIN;
  if (h > 20.75) return start + DAY + 9 * HOUR + between(r, 5, 50) * MIN;
  return t;
}
// Next Saturday or Sunday after t, at a slot.
function weekendSlot(t: number, r: R) {
  let d = istDayStart(t) + DAY;
  while (![0, 6].includes(istWeekday(d))) d += DAY;
  if (r() < 0.55 && istWeekday(d) === 6) d += DAY; // Sunday is the favourite
  const slot = pick(r, SLOTS);
  return { at: d + slot.h * HOUR, slot, wd: istWeekday(d) };
}

// ---------- Transcripts ----------
type Script = [TranscriptLine["who"], string][];
function timed(script: Script): { transcript: TranscriptLine[]; durationSec: number } {
  let at = 0;
  const transcript = script.map(([who, text]) => {
    const line = { who, text, at };
    if (who !== "action") at += Math.round(5 + text.length / (who === "agent" ? 6 : 7));
    return line;
  });
  return { transcript, durationSec: at + 4 };
}

interface Outcome {
  outcome: string; leadStatus: LeadStatus; summary: string; script: Script;
  actions: Call["actions"]; next?: { at: number; label: string }; followUp?: number;
}

function kavyaOutcome(agent: Agent, r: R, kind: string, t: number, first: string, plot: (typeof PLOTS)[number], use: string): Outcome {
  const hello: Script = [["agent", agent.opening.replace("{name}", first)], ["customer", pick(r, ["హా, చెప్పండి.", "అవునండి, చెప్పండి.", "హలో, చెప్పండి అండి."])]];
  const own = use.startsWith("Own") || use.startsWith("Building");
  if (kind === "visit") {
    const v = weekendSlot(t, r);
    const label = `${WEEKDAY[v.wd]} ${v.slot.label}`;
    return {
      outcome: agent.outcome, leadStatus: "hot", next: { at: v.at, label: `Site visit ${label}` },
      summary: `${use}, ${plot.size} sq yd, budget ₹${plot.lakh}L. Visit booked for ${DAY_EN[v.wd]} ${v.slot.label}; location sent on WhatsApp.`,
      actions: [{ key: "book_visit", label: `Site visit · ${label}` }, { key: "whatsapp", label: "Location sent on WhatsApp" }],
      script: [...hello,
        ["agent", "థాంక్యూ అండి. ప్లాట్ సొంత ఇంటి కోసమా, లేక ఇన్వెస్ట్‌మెంట్ కోసమా?"],
        ["customer", own ? `సొంత ఇల్లు కట్టుకోవాలి అండి. బడ్జెట్ ${plot.budgetTe} వరకు.` : `ఇన్వెస్ట్‌మెంట్ కోసం అండి. ${plot.budgetTe} లోపు ఉంటే చూస్తాను.`],
        ["agent", `అలాగా. ${plot.te} గజాల ప్లాట్ దాదాపు ${plot.budgetTe} కి వస్తుంది, DTCP అప్రూవ్డ్. ఒకసారి సైట్ చూడటానికి వస్తారా?`],
        ["customer", `${DAY_TE[v.wd]} ${v.slot.te} వస్తాను.`],
        ["action", `Site visit booked · ${label}`],
        ["agent", `సరే అండి, ${DAY_TE[v.wd]} ${v.slot.te} కన్ఫర్మ్ చేశాను. లొకేషన్ WhatsApp లో వస్తుంది. ఇంకేమైనా కావాలా అండి?`],
        ["customer", "లేదండి, థాంక్స్."],
        ["agent", "సరే అండి, ధన్యవాదాలు. మంచి రోజు అండి!"]],
    };
  }
  if (kind === "callback") {
    const evening = istHour(t) < 16.5;
    const at = evening ? istDayStart(t) + 18 * HOUR + between(r, 0, 20) * MIN : istDayStart(t) + DAY + 11 * HOUR + between(r, 0, 20) * MIN;
    const label = evening ? `${WEEKDAY[istWeekday(t)]} 6:00 PM` : `${WEEKDAY[istWeekday(at)]} 11:00 AM`;
    return {
      outcome: "Callback", leadStatus: "warm", next: { at, label: `Callback ${label}` }, followUp: at,
      summary: `Busy at work; asked for a call ${evening ? "this evening at 6" : "tomorrow at 11 AM"}.`,
      actions: [{ key: "callback", label: `Callback · ${label}` }],
      script: [...hello,
        ["customer", pick(r, ["ఇప్పుడు ఆఫీస్ లో ఉన్నానండి, కొంచెం బిజీ.", "డ్రైవింగ్ లో ఉన్నానండి.", "మీటింగ్ లో ఉన్నాను అండి."])],
        ["agent", "పర్వాలేదండి. ఎప్పుడు కాల్ చేయమంటారు?"],
        ["customer", evening ? "సాయంత్రం ఆరు తర్వాత చేయండి." : "రేపు ఉదయం పదకొండు గంటలకి చేయండి."],
        ["action", `Callback booked · ${label}`],
        ["agent", evening ? "సరే అండి, సాయంత్రం ఆరు గంటలకి కాల్ చేస్తాను. ధన్యవాదాలు!" : "సరే అండి, రేపు పదకొండు గంటలకి కాల్ చేస్తాను. ధన్యవాదాలు!"]],
    };
  }
  if (kind === "not") {
    const why = pick(r, [
      ["ఇప్పటికే వేరే దగ్గర ప్లాట్ తీసుకున్నామండి.", "Already bought a plot elsewhere."],
      ["ఇప్పుడు బడ్జెట్ లేదండి, ఆరు నెలల తర్వాత చూస్తాను.", "No budget right now; maybe in six months."],
      ["మాకు టౌన్ లోపల కావాలండి.", "Wants a plot inside town only."],
    ] as const);
    return {
      outcome: "Not interested", leadStatus: "cold", summary: why[1], actions: [],
      script: [...hello, ["customer", why[0]], ["agent", "అర్థమైంది అండి. ఎప్పుడైనా అవసరమైతే మాకు కాల్ చేయండి. ధన్యవాదాలు!"]],
    };
  }
  if (kind === "sales") {
    return {
      outcome: "Sent to sales", leadStatus: "hot", next: { at: t + 2 * HOUR, label: "Sales team to call" },
      summary: `Wants ${plot.size} sq yd and asked for a better price; transferred to the sales team.`,
      actions: [{ key: "transfer", label: "Transferred to sales team" }],
      script: [...hello,
        ["customer", `${plot.te} గజాలు కావాలి. రేటు కొంచెం తగ్గిస్తారా?`],
        ["agent", "ధర విషయం మా సేల్స్ టీమ్ మాట్లాడుతుంది అండి. ఇప్పుడే వాళ్ళకి కనెక్ట్ చేస్తాను, లైన్ లో ఉండండి."],
        ["action", "Transferred to sales team"]],
    };
  }
  return {
    outcome: "Info shared", leadStatus: "warm", next: { at: t + 3 * DAY, label: "Follow up in 3 days" },
    summary: `${use}, around ₹${plot.lakh}L. Asked about price and approvals; will discuss with family. Details sent on WhatsApp.`,
    actions: [{ key: "whatsapp", label: "Price details sent on WhatsApp" }],
    script: [...hello,
      ["agent", "ప్లాట్ సొంత ఇంటి కోసమా, ఇన్వెస్ట్‌మెంట్ కోసమా అండి?"],
      ["customer", own ? "ఇల్లు కట్టుకోవడానికి. రేటు ఎంత ఉంది?" : "ఇన్వెస్ట్‌మెంట్ కోసం. రేటు ఎంత?"],
      ["agent", `గజానికి తొమ్మిది వేలు అండి. ${plot.te} గజాలు దాదాపు ${plot.budgetTe}, DTCP, RERA రెండూ ఉన్నాయి.`],
      ["customer", "సరే, ఇంట్లో మాట్లాడి చెప్తాను."],
      ["action", "Price details sent on WhatsApp"],
      ["agent", "తప్పకుండా అండి. వివరాలు WhatsApp లో పంపించాను. ధన్యవాదాలు!"]],
  };
}

function meeraOutcome(agent: Agent, r: R, kind: string, t: number, first: string, selfEmployed: boolean): Outcome {
  const pending = selfEmployed ? "ITR" : "payslips";
  const hello: Script = [["agent", agent.opening.replace("{name}", first)], ["customer", pick(r, ["हाँ जी, बोलिए।", "जी, बताइए।", "हाँ, बोलिए मैडम।"])]];
  if (kind === "docs") {
    let d = istDayStart(t) + between(r, 2, 4) * DAY;
    if (istWeekday(d) === 0) d += DAY;
    const wd = istWeekday(d);
    return {
      outcome: agent.outcome, leadStatus: "hot", next: { at: d + 10 * HOUR, label: `Docs by ${WEEKDAY[wd]}` },
      summary: `Bank statement and ${pending} pending; promised by ${DAY_EN[wd]}. Upload link sent on WhatsApp.`,
      actions: [{ key: "whatsapp", label: "Upload link sent on WhatsApp" }],
      script: [...hello,
        ["agent", `जी, PAN और Aadhaar आ गए हैं। Bank statement और ${pending} अभी pending हैं।`],
        ["customer", `${pending} मैं इस हफ्ते निकलवा लूँगा।`],
        ["agent", `अच्छा जी। तो ${DAY_HI[wd]} तक upload कर देंगे?`],
        ["customer", `हाँ, ${DAY_HI[wd]} तक कर दूँगा।`],
        ["action", `Documents promised · ${WEEKDAY[wd]}`],
        ["agent", `ठीक है जी, upload link WhatsApp पर भेज दिया है। ${DAY_HI[wd]} को एक reminder भी कर दूँगी। धन्यवाद!`]],
    };
  }
  if (kind === "callback") {
    const at = istDayStart(t) + (istHour(t) < 18 ? 19 : 24 + 11) * HOUR;
    const label = `${WEEKDAY[istWeekday(at)]} ${istHour(t) < 18 ? "7:00 PM" : "11:00 AM"}`;
    return {
      outcome: "Callback", leadStatus: "warm", next: { at, label: `Callback ${label}` }, followUp: at,
      summary: `Was driving; asked for a call ${istHour(t) < 18 ? "after 7 PM" : "tomorrow morning"}.`,
      actions: [{ key: "callback", label: `Callback · ${label}` }],
      script: [...hello.slice(0, 1),
        ["customer", "अभी drive कर रहा हूँ जी।"],
        ["agent", "कोई बात नहीं जी, मैं कब कॉल करूँ?"],
        ["customer", istHour(t) < 18 ? "शाम सात बजे के बाद।" : "कल सुबह ग्यारह बजे।"],
        ["action", `Callback booked · ${label}`],
        ["agent", "ठीक है जी, तभी कॉल करती हूँ। धन्यवाद!"]],
    };
  }
  if (kind === "sales") {
    return {
      outcome: "Sent to sales", leadStatus: "warm", next: { at: t + 3 * HOUR, label: "Loan officer to call" },
      summary: "Asked about loan amount and EMI; passed to the loan officer.",
      actions: [{ key: "transfer", label: "Passed to loan officer" }],
      script: [...hello,
        ["customer", "loan कितना मिलेगा और EMI कितनी होगी?"],
        ["agent", "वो loan team आपकी eligibility देखकर बताएगी जी। मैं आज ही उनसे आपको call करवा देती हूँ।"],
        ["action", "Passed to loan officer"],
        ["customer", "ठीक है।"],
        ["agent", "जी, धन्यवाद। आपका दिन अच्छा रहे!"]],
    };
  }
  return {
    outcome: "Info shared", leadStatus: "warm", next: { at: t + 2 * DAY, label: "Check documents" },
    summary: `Asked which documents are pending; ${pending} and bank statement. Will check and upload.`,
    actions: [{ key: "whatsapp", label: "Document list sent on WhatsApp" }],
    script: [...hello,
      ["customer", "कौन से documents बाकी हैं?"],
      ["agent", `${pending} और पिछले छह महीने का bank statement बाकी है जी।`],
      ["customer", "ठीक है, देखकर भेजता हूँ।"],
      ["action", "Document list sent on WhatsApp"],
      ["agent", "जी, list WhatsApp पर भेज दी है। धन्यवाद!"]],
  };
}

function arjunOutcome(agent: Agent, r: R, kind: string, t: number, plot: (typeof PLOTS)[number]): Outcome {
  const hello: Script = [["agent", agent.opening], ["customer", pick(r, [
    "Hi, I saw your hoarding. You have plots in Kurnool?", "Hello, I'm calling about the plots on your Facebook ad.", "Hi, my friend gave me this number for plots."])]];
  if (kind === "visit") {
    const v = weekendSlot(t, r);
    const label = `${WEEKDAY[v.wd]} ${v.slot.label}`;
    return {
      outcome: agent.outcome, leadStatus: "hot", next: { at: v.at, label: `Site visit ${label}` },
      summary: `Called the office; ${plot.size} sq yd around ₹${plot.lakh}L. Visit booked for ${DAY_EN[v.wd]} ${v.slot.label} with free pickup.`,
      actions: [{ key: "book_visit", label: `Site visit · ${label}` }],
      script: [...hello,
        ["agent", "Yes sir, DTCP approved open plots in a gated layout. Is it for your own house or an investment?"],
        ["customer", `Own house. Around ${plot.en}.`],
        ["agent", `Got it. A ${plot.size} square yard plot comes to about ${plot.en}. Would you like to see the site?`],
        ["customer", `Yes, ${DAY_EN[v.wd]} at ${v.slot.en} works.`],
        ["action", `Site visit booked · ${label}`],
        ["agent", `Done, sir, ${DAY_EN[v.wd]} at ${v.slot.en}. We'll pick you up from Kurnool bus stand, and the location comes on WhatsApp. Anything else?`],
        ["customer", "No, that's all."],
        ["agent", "Thank you, have a great day!"]],
    };
  }
  if (kind === "callback") {
    const at = istDayStart(t) + (istHour(t) < 17 ? 18 : 24 + 11) * HOUR;
    const label = `${WEEKDAY[istWeekday(at)]} ${istHour(t) < 17 ? "6:00 PM" : "11:00 AM"}`;
    return {
      outcome: "Callback", leadStatus: "warm", next: { at, label: `Callback ${label}` },
      summary: "Wanted to talk after work; sales team to call back.",
      actions: [{ key: "callback", label: `Callback · ${label}` }],
      script: [...hello,
        ["agent", "Yes, we do, sir. Is it for your own house or an investment?"],
        ["customer", "I'm driving now. Can someone call me later?"],
        ["agent", istHour(t) < 17 ? "No problem at all, sir. Is six this evening okay?" : "No problem at all, sir. Is eleven tomorrow morning okay?"],
        ["customer", "Yes, that's fine."],
        ["action", `Callback booked · ${label}`],
        ["agent", "Great, our team will call you then. Thank you!"]],
    };
  }
  if (kind === "sales") {
    return {
      outcome: "Sent to sales", leadStatus: "hot", next: { at: t + HOUR, label: "Sales team to call" },
      summary: "Wanted to discuss the price; transferred to the sales team.",
      actions: [{ key: "transfer", label: "Transferred to sales team" }],
      script: [...hello,
        ["agent", "Yes sir, open plots of 150, 200 and 267 square yards. What size are you looking at?"],
        ["customer", "Two hundred. Can I talk to someone about the price?"],
        ["agent", "Sure, sir, connecting you to our sales team right now."],
        ["action", "Transferred to sales team"]],
    };
  }
  return {
    outcome: "Info shared", leadStatus: "warm", next: { at: t + 3 * DAY, label: "Follow up in 3 days" },
    summary: `Asked about price for ${plot.size} sq yd and approvals; details sent on WhatsApp.`,
    actions: [{ key: "whatsapp", label: "Price details sent on WhatsApp" }],
    script: [...hello,
      ["agent", "Yes sir, DTCP approved and RERA registered. What would you like to know?"],
      ["customer", "What's the price per yard?"],
      ["agent", `Nine thousand rupees per square yard, so a ${plot.size} yard plot is about ${plot.en}.`],
      ["customer", "Okay, I'll discuss at home and call back."],
      ["action", "Price details sent on WhatsApp"],
      ["agent", "Sure, I've sent the details on WhatsApp. Thank you!"]],
  };
}

function roll(r: R, table: [string, number][]) {
  let x = r();
  for (const [k, p] of table) { if ((x -= p) < 0) return k; }
  return table[table.length - 1][0];
}

// ---------- Generation ----------
interface Chain { lead: Lead; calls: Call[]; next?: { at: number; label: string } }

function makeCall(agent: Agent, lead: Lead, id: string, at: number, status: CallStatus, attempt: number, o?: Outcome): Call {
  const t = o ? timed(o.script) : { transcript: [], durationSec: 0 };
  return {
    id, agentId: agent.id, leadId: lead.id, name: lead.name, phone: lead.phone,
    direction: agent.direction === "inbound" ? "inbound" : "outbound",
    status, outcome: o?.outcome, leadStatus: o?.leadStatus, summary: o?.summary,
    durationSec: t.durationSec, costInr: Math.round((t.durationSec / 60) * 4.5 * 100) / 100, attempt,
    startedAt: new Date(at).toISOString(), transcript: t.transcript, actions: o?.actions ?? [],
  };
}

function dayChains(agents: Agent[], day: number, dayStart: number): Chain[] {
  const chains: Chain[] = [];
  const weekend = [0, 6].includes(istWeekday(dayStart));
  const kavya = agents.find((a) => a.id === "ag_kavya");
  const meera = agents.find((a) => a.id === "ag_meera");
  const arjun = agents.find((a) => a.id === "ag_arjun");

  if (kavya) {
    const r = rng(day * 7919 + 11);
    const n = Math.round(weekend ? between(r, 4, 8) : between(r, 8, 13));
    for (let k = 0; k < n; k++) {
      const p = person(r), plot = pick(r, PLOTS), use = pick(r, r() < 0.6 ? USES.own : USES.invest);
      const created = dayStart + between(r, 7.5, 22) * HOUR;
      const lead: Lead = { id: `ld_k${day}_${k}`, name: p.name, phone: phone(r), source: pick(r, KAVYA_SOURCES), agentId: kavya.id, status: "new",
        budget: `₹${plot.lakh}L`, notes: `${use}, ${plot.size} sq yd`, createdAt: new Date(created).toISOString() };
      const chain: Chain = { lead, calls: [] };
      // Speed to lead: called within a couple of minutes during calling hours, else next morning.
      let at = inHours(created + between(r, 1, 3) * MIN, r);
      for (let attempt = 1; attempt <= 3; attempt++) {
        const id = `cl_k${day}_${k}_${attempt}`;
        if (r() < 0.32) { // not answered: retry after 2 hours, then 4
          chain.calls.push(makeCall(kavya, lead, id, at, r() < 0.8 ? "no_answer" : "voicemail", attempt));
          chain.next = { at: inHours(at + (attempt === 1 ? 2 : 4) * HOUR, r), label: attempt < 3 ? "Retry scheduled" : "Try again tomorrow" };
          at = chain.next.at;
          continue;
        }
        const kind = roll(r, [["visit", 0.21], ["callback", 0.2], ["info", 0.35], ["not", 0.15], ["sales", 0.09]]);
        const o = kavyaOutcome(kavya, r, kind, at, p.first, plot, use);
        chain.calls.push(makeCall(kavya, lead, id, at, "connected", attempt, o));
        chain.next = o.next;
        if (o.followUp && r() < 0.85) { // the callback happens at the agreed time
          const kind2 = roll(r, [["visit", 0.45], ["info", 0.35], ["not", 0.2]]);
          const o2 = kavyaOutcome(kavya, r, kind2, o.followUp, p.first, plot, use);
          chain.calls.push(makeCall(kavya, lead, `${id}_cb`, o.followUp, "connected", attempt + 1, o2));
          chain.next = o2.next;
        }
        break;
      }
      chains.push(chain);
    }
  }

  if (meera) {
    const r = rng(day * 104729 + 23);
    const n = istWeekday(dayStart) === 0 ? 0 : Math.round(between(r, 4, 8));
    for (let k = 0; k < n; k++) {
      const p = person(r), self = r() < 0.4;
      const at = dayStart + between(r, 10, 19.5) * HOUR;
      const lead: Lead = { id: `ld_m${day}_${k}`, name: p.name, phone: phone(r), source: "Plot booked", agentId: meera.id, status: "new",
        budget: `₹${pick(r, ["10", "12", "15", "18"])}L loan`, notes: self ? "Self-employed, ITR needed" : "Salaried",
        createdAt: new Date(at - between(r, 2, 6) * DAY).toISOString() };
      const chain: Chain = { lead, calls: [] };
      if (r() < 0.22) {
        chain.calls.push(makeCall(meera, lead, `cl_m${day}_${k}`, at, "no_answer", 1));
        chain.next = { at: at + 2 * HOUR, label: "Retry scheduled" };
      } else {
        const kind = roll(r, [["docs", 0.5], ["callback", 0.2], ["info", 0.18], ["sales", 0.12]]);
        const o = meeraOutcome(meera, r, kind, at, p.first, self);
        chain.calls.push(makeCall(meera, lead, `cl_m${day}_${k}`, at, "connected", 1, o));
        chain.next = o.next;
        if (o.followUp && r() < 0.8) {
          const o2 = meeraOutcome(meera, r, roll(r, [["docs", 0.7], ["info", 0.3]]), o.followUp, p.first, self);
          chain.calls.push(makeCall(meera, lead, `cl_m${day}_${k}_cb`, o.followUp, "connected", 2, o2));
          chain.next = o2.next;
        }
      }
      chains.push(chain);
    }
  }

  if (arjun) {
    const r = rng(day * 15485863 + 37);
    const n = Math.round(weekend ? between(r, 5, 9) : between(r, 3, 7));
    for (let k = 0; k < n; k++) {
      const p = person(r), plot = pick(r, PLOTS);
      const at = dayStart + between(r, 9, 19) * HOUR;
      const lead: Lead = { id: `ld_a${day}_${k}`, name: p.name, phone: phone(r), source: "Office line", agentId: arjun.id, status: "new",
        budget: `₹${plot.lakh}L`, notes: `Called the office, ${plot.size} sq yd`, createdAt: new Date(at).toISOString() };
      const kind = roll(r, [["visit", 0.24], ["info", 0.46], ["callback", 0.15], ["sales", 0.15]]);
      const o = arjunOutcome(arjun, r, kind, at, plot);
      chains.push({ lead, calls: [makeCall(arjun, lead, `cl_a${day}_${k}`, at, "connected", 1, o)], next: o.next });
    }
  }
  return chains;
}

// What's next once a booked step has passed.
const AFTER: Record<string, string> = {
  "Site visit booked": "Follow up after visit", "Documents promised": "Check uploaded documents", "Sent to sales": "Sales team following up",
};

// Everything that has happened up to `now`: leads with their latest status, and calls, newest first.
export function generateActivity(agents: Agent[], now = Date.now()): { leads: Lead[]; calls: Call[] } {
  const leads: Lead[] = [];
  const calls: Call[] = [];
  const today = istDayStart(now);
  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const dayStart = today - i * DAY;
    const day = Math.round((dayStart + IST) / DAY); // stable day number: same seed every time
    for (const chain of dayChains(agents, day, dayStart)) {
      if (Date.parse(chain.lead.createdAt) > now) continue;
      const done = chain.calls.filter((c) => Date.parse(c.startedAt) <= now);
      calls.push(...done);
      const last = done.at(-1);
      const lastTalk = [...done].reverse().find((c) => c.status === "connected");
      const lead: Lead = { ...chain.lead, lastCallAt: last?.startedAt };
      if (lastTalk) {
        lead.status = lastTalk.leadStatus ?? "warm";
        if (lastTalk.summary) lead.notes = lastTalk.summary;
      }
      const pending = done.length < chain.calls.length;
      if (!done.length) lead.nextAction = Date.parse(chain.calls[0].startedAt) - now > 10 * MIN ? "Calls at 9 AM" : "Calling in a minute";
      else if (pending) lead.nextAction = lastTalk ? (lastTalk.outcome === "Callback" ? lastTalk.actions[0]?.label.replace(" · ", " ") : "Follow-up call") : "Retry scheduled";
      else if (chain.next && chain.next.at > now) lead.nextAction = chain.next.label;
      else if (lastTalk?.outcome && AFTER[lastTalk.outcome]) lead.nextAction = AFTER[lastTalk.outcome];
      leads.push(lead);
    }
  }
  leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  calls.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return { leads, calls };
}
