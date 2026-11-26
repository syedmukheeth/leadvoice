"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Send, Zap } from "lucide-react";
import { Waveform } from "./Waveform";
import { cx } from "./ui";

type State = "idle" | "connecting" | "speaking" | "listening" | "hearing" | "thinking" | "ended";
interface Line { who: "agent" | "customer" | "action" | "error"; text: string }

const LABEL: Record<State, string> = {
  idle: "", connecting: "Calling…", speaking: "Speaking", listening: "Listening, go ahead",
  hearing: "Hearing you…", thinking: "Thinking…", ended: "Call ended",
};

// 16 kHz mono WAV from captured float chunks, as base64.
function toWavBase64(chunks: Float32Array[], rate: number): string {
  const len = chunks.reduce((a, c) => a + c.length, 0);
  const all = new Float32Array(len);
  let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  const ratio = rate / 16000, n = Math.floor(len / ratio), pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const s = Math.floor(i * ratio), e = Math.min(len, Math.floor((i + 1) * ratio));
    let v = 0;
    for (let j = s; j < e; j++) v += all[j];
    v = Math.max(-1, Math.min(1, v / Math.max(1, e - s)));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.length * 2), dv = new DataView(buf);
  const str = (off: number, s: string) => [...s].forEach((ch, i) => dv.setUint8(off + i, ch.charCodeAt(0)));
  str(0, "RIFF"); dv.setUint32(4, 36 + pcm.length * 2, true); str(8, "WAVEfmt "); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, "data"); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function TestCall({ agentId, name, languageLabel, open, onClose }: {
  agentId: string; name: string; languageLabel: string; open: boolean; onClose: () => void;
}) {
  const [state, setState] = useState<State>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [setup, setSetup] = useState<string | null>(null); // a missing-key problem: stop the call, show it once
  const [muted, setMuted] = useState(false);
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [slow, setSlow] = useState(false);
  const st = useRef<State>("idle");
  const mutedRef = useRef(false);
  const history = useRef<{ who: "agent" | "customer"; text: string }[]>([]);
  const mic = useRef<{ ctx: AudioContext; stream: MediaStream; node: ScriptProcessorNode } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const chunks = useRef<Float32Array[]>([]);
  const vad = useRef({ speech: 0, silence: 0, noise: 0.01 });
  const chat = useRef<HTMLDivElement>(null);

  const set = (s: State) => { st.current = s; setState(s); };
  // Same error twice in a row is shown once, so a retry loop never floods the screen.
  const add = (l: Line) => setLines((x) => (l.who === "error" && x.at(-1)?.who === "error" && x.at(-1)?.text === l.text ? x : [...x, l]));

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { // explain long waits instead of looking frozen
    if (state !== "thinking" && state !== "connecting") return;
    const t = setTimeout(() => setSlow(true), 6000);
    return () => { clearTimeout(t); setSlow(false); };
  }, [state]);
  useEffect(() => { chat.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [lines]);
  useEffect(() => {
    if (state === "idle" || state === "ended" || state === "connecting") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  async function turn(payload: Record<string, unknown>) {
    set("thinking");
    try {
      const res = await fetch("/api/test-call", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, history: history.current, ...payload }),
        signal: AbortSignal.timeout(40000),
      });
      const d = await res.json();
      if (!res.ok && d.setup) { setSetup(d.error); hangUp(); return; }
      if (!res.ok) throw new Error(d.error ?? "No answer");
      if (payload.audio || payload.text) {
        if (!d.heard) { set("listening"); add({ who: "error", text: "Didn't catch that. Please say it again." }); return; }
        if (payload.audio) add({ who: "customer", text: d.heard }); // typed text is already on screen
        history.current.push({ who: "customer", text: d.heard });
      }
      if (d.action) setLines((ls) => (ls.some((x) => x.who === "action" && x.text === d.action) ? ls : [...ls, { who: "action", text: d.action }]));
      if (d.reply) {
        add({ who: "agent", text: d.reply });
        history.current.push({ who: "agent", text: d.reply });
      }
      const after = () => { audio.current = null; if (d.end) hangUp(); else set("listening"); };
      if (d.audio) {
        set("speaking");
        const a = new Audio(`data:audio/mpeg;base64,${d.audio}`);
        audio.current = a;
        a.onended = after; a.onerror = after;
        a.play().catch(after);
      } else after();
    } catch (e) {
      // A dropped or timed-out connection: keep the call going and ask again, in plain words.
      const network = e instanceof TypeError || (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError"));
      add({ who: "error", text: network ? "The connection dropped. Please say that again." : e instanceof Error ? e.message : "Something went wrong" });
      set("listening");
    }
  }

  async function start() {
    setLines([]); setSetup(null); history.current = []; setSeconds(0); set("connecting");
    // Check the server can actually run a call before asking for the microphone.
    const ready = await fetch("/api/test-call").then((r) => r.json()).catch(() => null);
    if (ready && ready.ready === false) {
      setSetup(`Calls aren't switched on here yet: ${ready.missing.join(" and ")} ${ready.missing.length > 1 ? "are" : "is"} missing.`);
      set("ended");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const silent = ctx.createGain(); silent.gain.value = 0;
      src.connect(node); node.connect(silent); silent.connect(ctx.destination);
      node.onaudioprocess = (e) => {
        const s = st.current;
        if (mutedRef.current || (s !== "listening" && s !== "hearing")) return;
        const data = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length), ms = (1000 * data.length) / ctx.sampleRate, v = vad.current;
        const loud = rms > Math.max(0.012, v.noise * 3);
        if (s === "listening") {
          if (!loud) { v.noise = v.noise * 0.95 + rms * 0.05; chunks.current = [new Float32Array(data)]; return; }
          set("hearing"); v.speech = 0; v.silence = 0;
        }
        chunks.current.push(new Float32Array(data));
        if (loud) { v.speech += ms; v.silence = 0; } else v.silence += ms;
        const total = chunks.current.length * ms;
        if ((v.silence > 900 && v.speech > 250) || total > 25000) {
          const wav = toWavBase64(chunks.current, ctx.sampleRate);
          chunks.current = [];
          turn({ audio: wav });
        } else if (v.silence > 1500 && v.speech <= 250) {
          chunks.current = []; set("listening");
        }
      };
      mic.current = { ctx, stream, node };
    } catch {
      add({ who: "error", text: "Microphone not available. You can still type below." });
    }
    await turn({ start: true });
  }

  function hangUp() {
    audio.current?.pause(); audio.current = null;
    if (mic.current) {
      mic.current.node.disconnect();
      mic.current.stream.getTracks().forEach((t) => t.stop());
      mic.current.ctx.close();
      mic.current = null;
    }
    set("ended");
  }

  function close() { hangUp(); set("idle"); onClose(); }

  useEffect(() => () => { // stop the mic if the page unmounts mid-call
    if (mic.current) { mic.current.stream.getTracks().forEach((t) => t.stop()); mic.current.ctx.close(); }
    audio.current?.pause();
  }, []);

  if (!open) return null;
  const live = state !== "idle" && state !== "ended";
  const mm = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="rise relative flex h-[min(720px,92vh)] w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-ink text-white shadow-[0_32px_80px_rgb(0_0_0/.35)]">
        <div className="px-7 pt-8 text-center">
          <p className="text-[12.5px] text-white/55">Test call in {languageLabel}</p>
          <div className="relative mx-auto mt-6 h-28 w-28">
            <span className={cx("absolute inset-0 rounded-full bg-accent/30", (state === "speaking" || state === "hearing") && "animate-ping motion-reduce:animate-none")} />
            <span className="relative grid h-28 w-28 place-items-center rounded-full bg-accent text-[44px] font-semibold text-white">{name[0]}</span>
          </div>
          <p className="mt-5 text-[28px] font-semibold leading-none tracking-[-0.025em]">{name}</p>
          <p className={cx("mt-2 text-[13.5px]", state === "listening" || state === "hearing" ? "text-live" : "text-white/60")}>
            {state === "idle" ? "Ready when you are" : slow ? "Still thinking. The AI is busy, hang on…" : LABEL[state]} {live && <span className="ml-1.5 tabular text-white/40">{mm}</span>}
          </p>
          <Waveform live={state === "speaking" || state === "hearing"} bars={40} className="mx-auto mt-5 h-10 justify-center"
            color={state === "speaking" ? "bg-viz-1" : state === "hearing" ? "bg-live" : "bg-white/15"} />
        </div>

        <div ref={chat} className="mt-4 flex-1 space-y-2 overflow-y-auto px-5 pb-3">
          {lines.map((l, i) => l.who === "action" ? (
            <p key={i} className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-viz-1"><Zap size={13} strokeWidth={2} /> {l.text}</p>
          ) : l.who === "error" ? (
            <p key={i} className="text-center text-[12.5px] text-[#ff9b8f]">{l.text}</p>
          ) : (
            <div key={i} className={cx("flex", l.who === "agent" ? "justify-start" : "justify-end")}>
              <p className={cx("max-w-[85%] rounded-xl px-3.5 py-2 text-[14px] leading-relaxed",
                l.who === "agent" ? "rounded-bl-sm bg-white/10" : "rounded-br-sm bg-accent text-white")}>{l.text}</p>
            </div>
          ))}
          {setup && (
            <div role="alert" className="mx-2 mt-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-[14px] font-medium text-white">This AI employee can&apos;t take calls yet</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{setup}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">Add the missing keys in Vercel (Settings, Environment Variables), then redeploy.</p>
            </div>
          )}
          {state === "idle" && !setup && (
            <p className="px-4 pt-4 text-center text-[13px] leading-relaxed text-white/55">
              {name} greets you first. Speak naturally and pause when you&apos;re done, and the reply comes in {name}&apos;s own voice. Headphones help.
            </p>
          )}
        </div>

        <div className="border-t border-white/10 px-5 pb-6 pt-4">
          {live && (
            <form className="mb-4 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const t = text.trim(); if (!t || state === "thinking") return;
              setText(""); audio.current?.pause(); add({ who: "customer", text: t });
              turn({ text: t });
            }}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Or type instead"
                className="flex-1 rounded-lg bg-white/10 px-3.5 py-2.5 text-[14px] outline-none placeholder:text-white/45 focus:bg-white/15" />
              <button className="grid w-11 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20" aria-label="Send"><Send size={16} strokeWidth={1.75} /></button>
            </form>
          )}
          <div className="flex items-center justify-center gap-5">
            {live && (
              <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}
                className={cx("grid h-14 w-14 place-items-center rounded-full transition", muted ? "bg-white text-ink" : "bg-white/10 hover:bg-white/20")}>
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            {live ? (
              <button onClick={hangUp} aria-label="Hang up" className="grid h-16 w-16 place-items-center rounded-full bg-hot hover:brightness-110"><PhoneOff size={24} /></button>
            ) : (
              <button onClick={start} aria-label="Start call" className="grid h-16 w-16 place-items-center rounded-full bg-live hover:brightness-110"><Phone size={24} /></button>
            )}
            <button onClick={close} className="absolute right-5 top-5 rounded-full px-3 py-1 text-[12.5px] text-white/60 transition-colors hover:bg-white/10 hover:text-white">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
