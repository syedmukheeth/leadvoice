import type { Agent, Call, Lead, LeadStatus, Store, TranscriptLine } from "./types";

// Deterministic sample workspace, so the product looks alive before the first real call.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const NAMES = ["Ramesh Reddy", "Sita Lakshmi", "Ravi Kumar", "Prasad Rao", "Anjali Sharma", "Srinivas Goud", "Padma Priya",
  "Venkatesh Naidu", "Kiran Babu", "Swathi Varma", "Naresh Yadav", "Madhavi Latha", "Suresh Chowdary", "Harika Devi",
  "Gopal Krishna", "Divya Teja", "Mahesh Babu", "Sravani K", "Anil Kumar", "Bhavani Shankar", "Raju Patel", "Keerthi S",
  "Satish Varma", "Pooja Mehta", "Arjun Singh", "Neha Gupta", "Imran Khan", "Lakshmi Narayana", "Vamsi Krishna", "Deepika R"];
const SOURCES = ["Meta ad", "Instagram ad", "Website", "99acres", "Walk-in", "Google ad", "Referral"];

export const DEMO_AGENTS: Agent[] = [
  {
    id: "ag_kavya", name: "Kavya", role: "Calls every plot enquiry, finds the budget and books a Sunday site visit.",
    template: "real_estate", language: "te", voiceId: "kavitha_te_conversation", direction: "both",
    opening: "నమస్కారం {name} గారు, నేను ASRG Constructions నుంచి AI అసిస్టెంట్ కావ్య. మీరు మా ప్లాట్స్ గురించి ఎంక్వైరీ చేశారు కదా — రెండు నిమిషాలు మాట్లాడొచ్చా?",
    script: "1. Greet, say you are the AI assistant from ASRG Constructions, mention their plot enquiry, ask if it's a good time.\n2. Ask: own use or investment?\n3. Ask budget and preferred plot size or facing.\n4. Answer questions only from the knowledge section.\n5. Offer a site visit this weekend with free pickup; repeat the day and time to confirm.\n6. If busy, book a callback at a time they choose.\n7. Thank them and say the location will come on WhatsApp.",
    knowledge: "ASRG Constructions layout, Kurnool. The exact site location is shared on WhatsApp after the call.\nDTCP approved, RERA registered. Clear title, immediate registration.\nOpen plots of 150, 200 and 267 square yards. East and North facing available.\nPrice: ₹9,000 per square yard (150 sq yd about ₹13.5 lakh, 200 about ₹18 lakh, 267 about ₹24 lakh). Corner and East facing ₹300 per sq yd extra.\nBooking amount ₹1 lakh, balance within 60 days. No discounts on the phone: price talks only with the sales team.\nBank loans from SBI and HDFC for eligible buyers; the team helps with paperwork. Never promise loan approval or EMI.\nSite visits every day 9 AM to 6 PM; free pickup from Kurnool bus stand on Saturday and Sunday.",
    actions: ["save_lead", "book_visit", "callback", "transfer", "whatsapp", "memory"], outcome: "Site visit booked",
    status: "live", createdAt: "2026-11-02T10:00:00+05:30",
  },
  {
    id: "ag_meera", name: "Meera", role: "Helps ASRG plot buyers with their home-loan documents and gets a date they'll upload by.",
    template: "loans", language: "hi", voiceId: "ritu_hi_conversation", direction: "outbound",
    opening: "नमस्ते {name} जी, मैं मीरा, ASRG Constructions से बोल रही हूँ। आपके plot के home loan documents के बारे में बात करनी थी, अभी दो मिनट बात हो सकती है?",
    script: "1. Greet, confirm it is a good time.\n2. Ask which documents are ready and which are pending.\n3. If they are self-employed, say ITR is needed instead of payslips.\n4. Get a day by which they will upload; repeat it to confirm.\n5. Offer to send the upload link on WhatsApp.\n6. If they have loan questions, say the loan team will call them.\n7. Thank them warmly.",
    knowledge: "Home loans for ASRG Constructions plots in Kurnool through SBI and HDFC, for eligible buyers.\nDocuments needed: PAN card, Aadhaar card, last 3 months' payslips (self-employed: last 2 years' ITR), last 6 months' bank statement, 2 passport photos.\nUpload link is sent on WhatsApp. Our team helps with the loan paperwork for free.\nNever promise loan approval, loan amount, interest rate or EMI: the loan team checks eligibility.",
    actions: ["save_lead", "callback", "whatsapp", "webhook"], outcome: "Documents promised",
    status: "live", createdAt: "2026-11-12T10:00:00+05:30",
  },
  {
    id: "ag_arjun", name: "Arjun", role: "Answers the ASRG office line in English: plot questions, site visits and callbacks.",
    template: "real_estate", language: "en", voiceId: "dev_en_conversational", direction: "inbound",
    opening: "Hello, thank you for calling ASRG Constructions, this is Arjun. How can I help you today?",
    script: "1. Greet warmly and ask how you can help.\n2. Understand what they need: plots, price, location, loans or a visit.\n3. Answer only from the knowledge section, in one or two sentences.\n4. Ask whether it's for their own home or an investment, and their budget.\n5. Offer a site visit (free pickup on weekends); repeat the day and time to confirm.\n6. For anything you don't know, offer a callback from the sales team at a time they choose.\n7. Thank them.",
    knowledge: "ASRG Constructions sells open residential plots in a gated layout in Kurnool. The exact site location is shared on WhatsApp.\nOffice: Kurnool, near the bus stand, open 9 AM to 7 PM every day.\nDTCP approved, RERA registered. Clear title, immediate registration.\nPlots of 150, 200 and 267 square yards; East and North facing available.\nPrice: ₹9,000 per square yard (150 sq yd about ₹13.5 lakh, 200 about ₹18 lakh, 267 about ₹24 lakh). Corner and East facing ₹300 per sq yd extra. No discounts on the phone.\nBooking amount ₹1 lakh, balance within 60 days.\nBank loans from SBI and HDFC for eligible buyers; the team helps with paperwork. Never promise approval or EMI.\nSite visits every day 9 AM to 6 PM; free pickup from Kurnool bus stand on Saturday and Sunday.",
    actions: ["book_visit", "transfer", "memory"], outcome: "Site visit booked",
    status: "live", createdAt: "2026-11-20T10:00:00+05:30",
  },
];

const TELUGU_CALL: [TranscriptLine["who"], string][] = [
  ["agent", "నమస్కారం {name} గారు, నేను ASRG Constructions నుంచి AI అసిస్టెంట్ కావ్య. మీరు మా ప్లాట్స్ గురించి ఎంక్వైరీ చేశారు కదా — రెండు నిమిషాలు మాట్లాడొచ్చా?"],
  ["customer", "హా, చెప్పండి."],
  ["agent", "థాంక్యూ సార్. మీరు ఇల్లు కట్టుకోవడానికా, లేక ఇన్వెస్ట్‌మెంట్ కోసమా?"],
  ["customer", "ఇల్లు కట్టుకోవడానికి. బడ్జెట్ ఇరవై లక్షల వరకు."],
  ["agent", "సూపర్ సార్. మా దగ్గర ఇరవై లక్షల లోపు DTCP అప్రూవ్డ్ ప్లాట్స్ ఉన్నాయి. ఈ ఆదివారం సైట్ విజిట్‌కి రాగలరా?"],
  ["customer", "ఆదివారం పదకొండు గంటలకి ఓకే."],
  ["action", "Site visit booked · Sun 11:00 AM"],
  ["action", "Location sent on WhatsApp"],
  ["agent", "ఆదివారం ఉదయం పదకొండు గంటలకి బుక్ చేశాను సార్. లొకేషన్ WhatsApp లో పంపించాను. ముందు రోజు రిమైండర్ కాల్ చేస్తాను. ధన్యవాదాలు!"],
];

const HINDI_CALL: [TranscriptLine["who"], string][] = [
  ["agent", "नमस्ते {name} जी, मैं मीरा, ASRG Constructions से AI असिस्टेंट। दो मिनट बात कर सकते हैं?"],
  ["customer", "हाँ जी, बोलिए।"],
  ["agent", "आपकी payslips और bank statement अभी pending हैं। आप इन्हें कब तक upload कर पाएँगे?"],
  ["customer", "शुक्रवार तक कर दूँगा।"],
  ["action", "Upload link sent on WhatsApp"],
  ["agent", "बढ़िया। Upload link मैंने WhatsApp पर भेज दिया है। शुक्रवार को एक reminder भी कर दूँगी। धन्यवाद!"],
];

export function buildDemoStore(now = new Date()): Store {
  const r = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const leads: Lead[] = [];
  const calls: Call[] = [];

  NAMES.forEach((name, i) => {
    const agent = i % 5 === 3 ? DEMO_AGENTS[1] : DEMO_AGENTS[0];
    const created = new Date(now.getTime() - (r() * 13 + 0.2) * 86400000);
    const phone = `+91 9${String(800000000 + Math.floor(r() * 199999999)).padStart(9, "0")}`;
    const status = (["hot", "warm", "warm", "cold", "new", "hot", "cold"] as LeadStatus[])[i % 7];
    const budget = agent.id === "ag_kavya" ? `₹${pick([12, 15, 18, 20, 24, 30])}L` : `₹${pick([25, 35, 40, 50])}L loan`;
    leads.push({
      id: `ld_${i}`, name, phone, source: pick(SOURCES), agentId: agent.id, status, budget,
      notes: status === "hot" ? (agent.id === "ag_kavya" ? "200 sq yd east facing, coming with family" : "Will upload documents by Friday")
        : status === "warm" ? "Interested, deciding after Sankranti" : status === "cold" ? "Budget too low right now" : undefined,
      nextAction: status === "hot" ? (agent.id === "ag_kavya" ? "Site visit Sun 11:00 AM" : "Reminder Fri 10:00 AM") : status === "warm" ? "Callback Thu 6:00 PM" : undefined,
      createdAt: created.toISOString(), lastCallAt: created.toISOString(),
    });
  });

  for (let i = 0; i < 140; i++) {
    const lead = leads[i % leads.length];
    const agent = DEMO_AGENTS.find((a) => a.id === lead.agentId)!;
    const daysAgo = Math.floor(r() * 14);
    const started = new Date(now.getTime() - daysAgo * 86400000 - r() * 9 * 3600000);
    started.setHours(Math.max(9, Math.min(20, started.getHours())));
    if (started > now) started.setTime(now.getTime() - (5 + r() * 120) * 60000); // never in the future
    const roll = r();
    const status = roll < 0.66 ? "connected" : roll < 0.9 ? "no_answer" : "voicemail";
    const connected = status === "connected";
    const outcomeRoll = r();
    const outcome = !connected ? undefined : outcomeRoll < 0.24 ? agent.outcome : outcomeRoll < 0.42 ? "Callback" : outcomeRoll < 0.5 ? "Sent to sales" : outcomeRoll < 0.62 ? "Not interested" : "Info shared";
    const dur = connected ? 60 + Math.floor(r() * 300) : 0;
    const script = agent.language === "hi" ? HINDI_CALL : TELUGU_CALL;
    const first = lead.name.split(" ")[0];
    calls.push({
      id: `cl_${i}`, agentId: agent.id, leadId: lead.id, name: lead.name, phone: lead.phone,
      direction: r() < 0.25 && agent.direction !== "outbound" ? "inbound" : "outbound",
      status, outcome, leadStatus: connected ? (outcome === agent.outcome ? "hot" : outcome === "Not interested" ? "cold" : "warm") : undefined,
      summary: connected ? (outcome === agent.outcome
        ? (agent.id === "ag_kavya" ? `Wants a plot for own house, budget ${lead.budget}. Visit booked for Sunday 11 AM; location sent on WhatsApp.` : "Payslips and bank statement pending; promised by Friday. Upload link sent on WhatsApp.")
        : outcome === "Callback" ? "Busy at work; asked for a call this evening at 6."
        : outcome === "Not interested" ? (agent.id === "ag_kavya" ? "Already bought a plot elsewhere." : "Took a loan from another bank.")
        : outcome === "Sent to sales" ? (agent.id === "ag_kavya" ? "Wanted to negotiate the price; transferred to the sales team." : "Asked about the interest rate; transferred to a loan officer.")
        : (agent.id === "ag_kavya" ? "Asked about price and approvals; will discuss with family." : "Asked which documents are pending; will check and upload.")) : undefined,
      durationSec: dur, costInr: Math.round((dur / 60) * 4.5 * 100) / 100, attempt: connected ? 1 : 1 + Math.floor(r() * 3),
      startedAt: started.toISOString(),
      transcript: connected ? script.map(([who, text], k) => ({ who, text: text.replace("{name}", first), at: k * 9 })) : [],
      actions: outcome === agent.outcome ? [{ key: "book_visit", label: agent.outcome }, { key: "whatsapp", label: "WhatsApp sent" }] : outcome === "Callback" ? [{ key: "callback", label: "Callback 6:00 PM" }] : [],
    });
  }
  calls.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return {
    workspace: {
      name: "ASRG Constructions", industry: "Real estate", creditsInr: 4820,
      number: { e164: "+91 80 4718 2290", status: "active" },
      webhookUrl: "https://hooks.example.com/leadvoice",
      apiKeys: [{ id: "key_1", label: "Website form", prefix: "lv_live_8f3a", createdAt: "2026-11-05T10:00:00+05:30", lastUsedAt: now.toISOString() }],
    },
    agents: DEMO_AGENTS,
    leads,
    calls,
  };
}
