import { promises as fs } from "fs";
import { connection, type NextRequest } from "next/server";
import path from "path";
import { VOICE_MODEL, VOICES } from "@/lib/catalog";
import { setting } from "@/lib/env";

// What each voice says in its sample, written the way people really talk on the phone.
const SAMPLES: Record<string, string> = {
  te: "హలో సార్, నమస్కారం! నేను ASRG Constructions నుంచి మాట్లాడుతున్నాను. మీరు మా plots గురించి enquiry చేశారు కదా, రెండు నిమిషాలు మాట్లాడొచ్చా?",
  hi: "हैलो सर, नमस्ते! मैं ASRG Constructions से बात कर रही हूँ। आपने हमारे plots के बारे में पूछा था, क्या दो मिनट बात कर सकते हैं?",
  en: "Hi, good afternoon! I'm calling from ASRG Constructions about the plots you enquired about. Do you have two minutes to talk?",
};
const LANG_CODE: Record<string, string> = { te: "te-IN", hi: "hi-IN", en: "en-IN" };

// GET /api/voices/preview?voice=<speaker id> -> mp3 sample in that voice's language.
// Cached on disk, so each sample is generated only once.
export async function GET(request: NextRequest) {
  await connection(); // depends on the query string: never prerender
  const voice = VOICES.find((v) => v.id === request.nextUrl.searchParams.get("voice"));
  if (!voice) return new Response("Unknown voice", { status: 400 });

  const file = path.join(process.cwd(), ".data", "voices", `${voice.id}.mp3`);
  const headers = { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" };
  try {
    return new Response(new Uint8Array(await fs.readFile(file)), { headers });
  } catch { /* not cached yet */ }

  const key = setting("SARVAM_API_KEY");
  if (!key) return new Response("Add SARVAM_API_KEY to hear voice samples", { status: 503 });
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: SAMPLES[voice.language], target_language_code: LANG_CODE[voice.language],
      speaker: voice.id, model: VOICE_MODEL, output_audio_codec: "mp3",
    }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!res?.ok) return new Response("Voice service error", { status: 502 });
  const b64: string | undefined = (await res.json())?.audios?.[0];
  if (!b64) return new Response("No audio", { status: 502 });
  const audio = Buffer.from(b64, "base64");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, audio);
  return new Response(new Uint8Array(audio), { headers });
}
