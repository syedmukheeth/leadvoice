export type Language = "te" | "hi" | "en";
export type Direction = "inbound" | "outbound";
export type LeadStatus = "new" | "hot" | "warm" | "cold" | "do_not_call";
export type CallStatus = "connected" | "no_answer" | "voicemail" | "failed" | "live";
export type ActionKey = "save_lead" | "book_visit" | "callback" | "transfer" | "whatsapp" | "calendar" | "webhook" | "memory";

export interface Voice {
  id: string; // Sarvam speaker id
  name: string;
  language: Language;
  gender: "female" | "male";
  tone: string;
  premium: boolean;
}

export interface Agent {
  id: string;
  name: string; // persona name, e.g. Kavya
  role: string; // one sentence: what this telecaller does
  template: string; // template key
  language: Language;
  voiceId: string;
  direction: Direction | "both";
  opening: string;
  script: string; // conversation guide shown in the editor
  knowledge: string; // facts the agent may share
  actions: ActionKey[];
  outcome: string; // what counts as a win, e.g. "Site visit booked"
  status: "live" | "paused" | "draft";
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  agentId: string;
  status: LeadStatus;
  budget?: string;
  notes?: string;
  nextAction?: string; // e.g. "Callback Thu 6:00 PM"
  createdAt: string;
  lastCallAt?: string;
}

export interface TranscriptLine { who: "agent" | "customer" | "action"; text: string; at: number }

export interface Call {
  id: string;
  agentId: string;
  leadId?: string;
  name: string;
  phone: string;
  direction: Direction;
  status: CallStatus;
  outcome?: string; // "Site visit booked", "Callback", ...
  leadStatus?: LeadStatus;
  summary?: string;
  durationSec: number;
  costInr: number;
  attempt: number;
  startedAt: string;
  transcript: TranscriptLine[];
  actions: { key: ActionKey; label: string }[];
}

export interface ApiKey { id: string; label: string; prefix: string; hash?: string; createdAt: string; lastUsedAt?: string }

export interface Workspace {
  name: string;
  industry: string;
  creditsInr: number;
  number?: { e164: string; status: "active" | "kyc_pending" | "none" };
  webhookUrl?: string;
  apiKeys: ApiKey[];
}

export interface Store {
  workspace: Workspace;
  agents: Agent[];
  leads: Lead[];
  calls: Call[];
}
