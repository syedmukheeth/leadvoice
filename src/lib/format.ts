const TZ = "Asia/Kolkata";

export const pct = (x: number, hasData = true) => (hasData ? `${Math.round(x * 100)}%` : "—");
export const inr = (x: number, digits = 0) =>
  "₹" + x.toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const num = (x: number) => x.toLocaleString("en-IN");
export const mmss = (s: number) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "—");

export const dayTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const shortDay = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: TZ, day: "numeric", month: "short" }).format(new Date(iso));
export const time = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export function ago(iso: string, now = Date.now()) {
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

// "Site visit booked", 8 -> "8 site visits booked"; "Documents promised", 3 -> "3 documents promised"
export function pluralOutcome(outcome: string, n: number) {
  const words = outcome.toLowerCase().split(" ");
  if (n !== 1 && words.length > 1) {
    const i = words.length - 2;
    if (!words[i].endsWith("s")) words[i] += "s";
  }
  return `${n} ${words.join(" ")}`;
}

export const maskPhone = (p: string) => p.replace(/(\+91\s?\d{2})\d+(\d{3})$/, "$1•••••$2");
