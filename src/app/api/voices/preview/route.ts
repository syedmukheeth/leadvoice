import { promises as fs } from "fs";
import { connection, type NextRequest } from "next/server";
import path from "path";
import { VOICE_MODEL, VOICES } from "@/lib/catalog";
import { setting } from "@/lib/env";
import { dataDir } from "@/lib/paths";
import { forSpeech } from "@/lib/pronounce";
import { lockedResponse, unlockedRequest } from "@/lib/gate-server";

// What each voice says in its sample, written the way people really talk on the phone.
const SAMPLES: Record<string, string> = {
  te: "హలో సార్, నమస్కారం! నేను ASRG Constructions నుంచి మాట్లాడుతున్నాను. మీరు మా plots గురించి enquiry చేశారు కదా, రెండు నిమిషాలు మాట్లాడొచ్చా?",
  hi: "हैलो सर, नमस्ते! मैं ASRG Constructions से बात कर रही हूँ। आपने हमारे plots के बारे में पूछा था, क्या दो मिनट बात कर सकते हैं?",
  en: "Hi, good afternoon! I'm calling from ASRG Constructions about the plots you enquired about. Do you have two minutes to talk?",
};
const LANG_CODE: Record<string, string> = { te: "te-IN", hi: "hi-IN", en: "en-IN" };

// GET /api/voices/preview?voice=<speaker id> -> mp3 sample in that voice's language.
// Cached on disk (see paths.ts), so each sample is generated only once per server.
export async function GET(request: NextRequest) {
  if (!(await unlockedRequest())) return lockedResponse();
  await connection(); // depends on the query string: never prerender
  const voice = VOICES.find((v) => v.id === request.nextUrl.searchParams.get("voice"));
  if (!voice) return new Response("Unknown voice", { status: 400 });

  const file = path.join(dataDir(), "voices", `${voice.id}.mp3`);
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
      text: forSpeech(SAMPLES[voice.language], voice.language), target_language_code: LANG_CODE[voice.language],
      speaker: voice.id, model: VOICE_MODEL, output_audio_codec: "mp3",
    }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!res?.ok) return new Response("Voice service error", { status: 502 });
  const b64: string | undefined = (await res.json())?.audios?.[0];
  if (!b64) return new Response("No audio", { status: 502 });
  const audio = Buffer.from(b64, "base64");
  // Caching is a nice-to-have: a read-only disk must not stop the sample from playing.
  await fs.mkdir(path.dirname(file), { recursive: true }).then(() => fs.writeFile(file, audio)).catch(() => {});
  return new Response(new Uint8Array(audio), { headers });
}
