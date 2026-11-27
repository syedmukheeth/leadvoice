"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Send, Zap } from "lucide-react";
import { CUE } from "@/lib/live-cues";
import { saysGoodbye } from "@/lib/llm";
import { Waveform } from "./Waveform";
import { cx } from "./ui";

// A live phone-style call: the microphone streams to Gemini Live and the agent's voice streams
// back, so the customer can talk over the agent and replies start within about a second.
// If live calls aren't available (quota, outage), onFallback switches to step-by-step calls.

type State = "idle" | "connecting" | "speaking" | "listening" | "reconnecting" | "ended";
interface Line { who: "agent" | "customer" | "action" | "note"; text: string; at: number }

const WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";
const QUIET_MS = 9000; // silence before the agent checks the customer is still there
const ECHO_RMS = 0.03; // while the agent talks, quieter mic sound is treated as its own echo

// Microphone capture: averages down to 16 kHz, 16-bit PCM, posted in 40 ms frames with loudness.
const WORKLET = `class Pcm16 extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.step = 0; this.sum = 0; this.n = 0; this.out = new Int16Array(640); this.len = 0; this.energy = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.sum += ch[i]; this.n++; this.step++;
      if (this.step >= this.ratio) {
        this.step -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.sum / this.n)); this.sum = 0; this.n = 0;
        this.energy += v * v;
        this.out[this.len++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        if (this.len === this.out.length) {
          this.port.postMessage({ pcm: this.out.buffer, rms: Math.sqrt(this.energy / this.len) }, [this.out.buffer]);
          this.out = new Int16Array(640); this.len = 0; this.energy = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("pcm16", Pcm16);`;

const clock = () => Date.now();

function toBase64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromBase64(s: string): Int16Array {
  const bin = atob(s);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return new Int16Array(b.buffer, 0, b.length >> 1);
}

export function LiveCall({ agentId, name, languageLabel, onClose, onFallback }: {
  agentId: string; name: string; languageLabel: string; onClose: () => void; onFallback: () => void;
}) {
  const [state, setState] = useState<State>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [setup, setSetup] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [talking, setTalking] = useState(false); // the customer's mic is picking up speech
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);

  const st = useRef<State>("idle");
  const mutedRef = useRef(false);
  const talkingRef = useRef(false);
  const ws = useRef<WebSocket | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const mic = useRef<{ stream: MediaStream; node: AudioWorkletNode } | null>(null);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const playAt = useRef(0);
  const log = useRef<Line[]>([]);
  const open = useRef<{ agent: number; customer: number }>({ agent: -1, customer: -1 });
  const call = useRef({ heardAgent: false, ending: false, endAsked: false, lastSaid: "", userEnded: false, reconnects: 0, lastSound: 0, nudges: 0, connected: false, began: 0, saved: false });
  const chat = useRef<HTMLDivElement>(null);

  const set = (s: State) => { st.current = s; setState(s); };
  const render = () => setLines([...log.current]);
  const now = () => Math.round((Date.now() - call.current.began) / 1000);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { chat.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [lines]);
  useEffect(() => {
    if (state === "idle" || state === "ended" || state === "connecting") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Captions. The customer's words can arrive a moment after the agent has started answering; they
  // still belong before that answer, so they go in front of the agent's open line.
  function addCustomer(t: string) {
    const o = open.current, L = log.current;
    if (o.customer >= 0) L[o.customer] = { ...L[o.customer], text: L[o.customer].text + t };
    else if (o.agent >= 0 && o.agent === L.length - 1) { L.splice(o.agent, 0, { who: "customer", text: t, at: L[o.agent].at }); o.customer = o.agent; o.agent++; }
    else { L.push({ who: "customer", text: t, at: now() }); o.customer = L.length - 1; }
    render();
  }
  function addAgent(t: string) {
    const o = open.current, L = log.current;
    if (o.agent >= 0) L[o.agent] = { ...L[o.agent], text: L[o.agent].text + t };
    else { L.push({ who: "agent", text: t, at: now() }); o.agent = L.length - 1; }
    render();
  }
  function addLine(l: Omit<Line, "at">) {
    if (l.who === "action" && log.current.some((x) => x.who === "action" && x.text === l.text)) return;
    log.current.push({ ...l, at: now() }); render();
  }
  function closeTurn() { open.current = { agent: -1, customer: -1 }; }

  function speaking() { return sources.current.size > 0; }
  function stopPlayback() {
    sources.current.forEach((s) => { try { s.stop(); } catch {} });
    sources.current.clear();
    playAt.current = 0;
  }
  function play(pcm: Int16Array, rate: number) {
    const c = ctx.current;
    if (!c || st.current === "ended") return;
    const buf = c.createBuffer(1, pcm.length, rate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    const at = Math.max(c.currentTime + 0.05, playAt.current); // a small lead keeps chunks gapless
    src.start(at);
    playAt.current = at + buf.duration;
    sources.current.add(src);
    if (st.current === "listening") set("speaking");
    src.onended = () => {
      sources.current.delete(src);
      if (sources.current.size) return;
      call.current.lastSound = Date.now();
      if (call.current.ending) { hangUp(); return; }
      if (st.current === "speaking") set("listening");
    };
  }

  function sendJson(msg: unknown) {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg));
  }
  function cue(text: string) { sendJson({ realtimeInput: { text } }); }

  async function onMessage(ev: MessageEvent) {
    const raw = typeof ev.data === "string" ? ev.data : await (ev.data as Blob).text();
    let msg: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.setupComplete) {
      call.current.connected = true;
      const again = call.current.heardAgent;
      set("listening");
      if (!again) { cue(CUE.connected); return; }
      // Back after a dropped line: remind the agent where the call was, then carry on.
      const recap = log.current.filter((l) => l.who === "agent" || l.who === "customer").slice(-12)
        .map((l) => `${l.who === "agent" ? "You" : "Customer"}: ${l.text.trim()}`).join("\n");
      cue(`${CUE.reconnected}\nThe call so far:\n${recap}`);
      return;
    }
    if (msg.toolCall?.functionCalls) {
      for (const f of msg.toolCall.functionCalls as { id: string; name: string; args?: { label?: string } }[]) {
        if (f.name === "save_outcome" && f.args?.label) {
          addLine({ who: "action", text: f.args.label });
          sendJson({ toolResponse: { functionResponses: [{ id: f.id, name: f.name, response: { result: "saved" } }] } });
        } else if (f.name === "end_call") {
          // No reply to this one. The call ends once the agent's goodbye has been spoken: if it
          // asked to hang up while still asking "anything else?", the call waits for the goodbye.
          call.current.endAsked = true;
          if (saysGoodbye(call.current.lastSaid) && !speaking() && open.current.agent < 0) hangUp(); // goodbye already spoken
        } else {
          sendJson({ toolResponse: { functionResponses: [{ id: f.id, name: f.name, response: { result: "ok" } }] } });
        }
      }
    }
    const sc = msg.serverContent;
    if (sc) {
      if (sc.interrupted) { stopPlayback(); if (open.current.agent >= 0) addAgent("…"); closeTurn(); set("listening"); }
      if (sc.inputTranscription?.text) { call.current.nudges = 0; addCustomer(sc.inputTranscription.text); }
      for (const p of sc.modelTurn?.parts ?? []) {
        if (!p.inlineData?.data) continue;
        call.current.heardAgent = true;
        const rate = Number(/rate=(\d+)/.exec(p.inlineData.mimeType ?? "")?.[1] ?? 24000);
        play(fromBase64(p.inlineData.data), rate);
      }
      if (sc.outputTranscription?.text) addAgent(sc.outputTranscription.text);
      if (sc.turnComplete) {
        const said = open.current.agent >= 0 ? log.current[open.current.agent]?.text ?? "" : "";
        closeTurn();
        if (said) call.current.lastSaid = said;
        if (call.current.endAsked && saysGoodbye(said)) call.current.ending = true;
        if (call.current.ending && !speaking()) hangUp();
      }
    }
  }

  async function connect(): Promise<"ok" | "setup" | "fallback"> {
    const res = await fetch("/api/live-call", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId }),
      signal: AbortSignal.timeout(12000),
    }).catch(() => null);
    const d = await res?.json().catch(() => null);
    if (!res?.ok || !d?.token) {
      if (d?.setup) { setSetup(d.error); return "setup"; }
      return "fallback";
    }
    if (st.current === "ended") return "ok"; // hung up while connecting
    call.current.connected = false;
    const sock = new WebSocket(`${WS_URL}?access_token=${encodeURIComponent(d.token)}`);
    ws.current = sock;
    sock.onopen = () => sock.send(JSON.stringify({ setup: { model: `models/${d.model}` } }));
    sock.onmessage = onMessage;
    sock.onclose = (e) => { if (ws.current === sock) dropped(e); };
    // No answer from Gemini in time: treat it like a dropped line.
    setTimeout(() => { if (ws.current === sock && !call.current.connected) sock.close(); }, 10000);
    return "ok";
  }

  async function dropped(e: CloseEvent) {
    ws.current = null;
    if (st.current === "ended" || call.current.userEnded) return;
    if (call.current.ending) { hangUp(); return; }
    console.info("[live] closed", e.code, e.reason);
    // Never connected at all: live calls aren't available right now, use step-by-step calls.
    if (!call.current.heardAgent && call.current.reconnects === 0) { teardown(); onFallback(); return; }
    if (call.current.reconnects >= 2) {
      addLine({ who: "note", text: "The line dropped. Call again to carry on." });
      hangUp();
      return;
    }
    call.current.reconnects++;
    stopPlayback(); closeTurn();
    set("reconnecting");
    const r = await connect();
    if (r !== "ok") { addLine({ who: "note", text: "The line dropped. Call again to carry on." }); hangUp(); }
  }

  async function startMic(c: AudioContext) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
      await c.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      const node = new AudioWorkletNode(c, "pcm16");
      const mute = c.createGain(); mute.gain.value = 0;
      c.createMediaStreamSource(stream).connect(node);
      node.connect(mute); mute.connect(c.destination); // keeps the worklet running
      const silence = new Int16Array(640).buffer;
      node.port.onmessage = (ev: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => {
        if (!call.current.connected || st.current === "ended") return;
        const { pcm, rms } = ev.data;
        // While the agent talks, quiet sound is its own voice coming back through the speakers.
        const heard = !mutedRef.current && rms > (speaking() ? ECHO_RMS : 0.012);
        if (heard) { call.current.lastSound = Date.now(); call.current.nudges = 0; }
        if (heard !== talkingRef.current) { talkingRef.current = heard; setTalking(heard); }
        const send = mutedRef.current || (speaking() && rms < ECHO_RMS) ? silence : pcm;
        sendJson({ realtimeInput: { audio: { data: toBase64(send), mimeType: "audio/pcm;rate=16000" } } });
      };
      mic.current = { stream, node };
    } catch {
      addLine({ who: "note", text: "Microphone not available. You can still type below." });
    }
  }

  async function start() {
    log.current = []; render(); closeTurn(); setSetup(null); setSeconds(0);
    call.current = { heardAgent: false, ending: false, userEnded: false, reconnects: 0, lastSound: clock(), nudges: 0, connected: false, began: clock(), saved: false, endAsked: false, lastSaid: "" };
    set("connecting");
    const c = new AudioContext(); // created on the tap, so the browser lets it play
    ctx.current = c;
    void c.resume();
    const [r] = await Promise.all([connect(), startMic(c)]);
    if (r === "setup") { teardown(); set("ended"); return; }
    if (r === "fallback") { teardown(); onFallback(); }
  }

  // The agent checks in when the customer goes quiet, like a person on the phone would.
  useEffect(() => {
    if (state !== "listening") return;
    const t = setInterval(() => {
      const k = call.current;
      if (st.current !== "listening" || k.ending || speaking() || talkingRef.current) return;
      if (Date.now() - k.lastSound > QUIET_MS && k.nudges < 2) {
        k.nudges++; k.lastSound = Date.now();
        cue(CUE.silent);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  function teardown() {
    const sock = ws.current;
    ws.current = null;
    try { sock?.close(1000); } catch {}
    stopPlayback();
    if (mic.current) {
      mic.current.node.port.onmessage = null;
      mic.current.node.disconnect();
      mic.current.stream.getTracks().forEach((t) => t.stop());
      mic.current = null;
    }
    void ctx.current?.close().catch(() => {});
    ctx.current = null;
    talkingRef.current = false; setTalking(false);
  }

  function hangUp() {
    call.current.userEnded = true;
    teardown();
    set("ended");
    save();
  }

  // Keeps the call under Calls, with its transcript and anything it booked.
  function save() {
    const k = call.current;
    if (k.saved || !k.heardAgent) return;
    k.saved = true;
    const transcript = log.current.filter((l) => l.who !== "note").map((l) => ({ who: l.who, text: l.text.trim(), at: l.at }));
    void fetch("/api/calls", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ agentId, transcript, durationSec: now() }),
    }).catch(() => {});
  }

  function close() { hangUp(); set("idle"); onClose(); }

  useEffect(() => () => teardown(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const live = state !== "idle" && state !== "ended";
  const mm = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const label = state === "idle" ? "Ready when you are"
    : state === "connecting" ? "Calling…"
    : state === "reconnecting" ? "Line dropped, reconnecting…"
    : state === "ended" ? "Call ended"
    : state === "speaking" ? (talking ? "Go ahead, interrupt any time" : "Speaking")
    : talking ? "Listening…" : "Your turn, just talk";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="rise relative flex h-[min(720px,92vh)] w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-ink text-white shadow-[0_32px_80px_rgb(0_0_0/.35)]">
        <div className="px-7 pt-8 text-center">
          <p className="flex items-center justify-center gap-2 text-[12.5px] text-white/55">
            Call in {languageLabel}
            <span className="inline-flex items-center gap-1 rounded-full bg-live/15 px-2 py-0.5 text-[11px] font-medium text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live" /> Live
            </span>
          </p>
          <div className="relative mx-auto mt-6 h-28 w-28">
            <span className={cx("absolute inset-0 rounded-full bg-accent/30", (state === "speaking" || talking) && live && "animate-ping motion-reduce:animate-none")} />
            <span className="relative grid h-28 w-28 place-items-center rounded-full bg-accent text-[44px] font-semibold text-white">{name[0]}</span>
          </div>
          <p className="mt-5 text-[28px] font-semibold leading-none tracking-[-0.025em]">{name}</p>
          <p className={cx("mt-2 text-[13.5px]", state === "listening" ? "text-live" : "text-white/60")} aria-live="polite">
            {label} {live && state !== "connecting" && <span className="ml-1.5 tabular text-white/40">{mm}</span>}
          </p>
          <Waveform live={live && (state === "speaking" || talking)} bars={40} className="mx-auto mt-5 h-10 justify-center"
            color={talking ? "bg-live" : state === "speaking" ? "bg-viz-1" : "bg-white/15"} />
        </div>

        <div ref={chat} className="mt-4 flex-1 space-y-2 overflow-y-auto px-5 pb-3">
          {lines.map((l, i) => l.who === "action" ? (
            <p key={i} className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-viz-1"><Zap size={13} strokeWidth={2} /> {l.text}</p>
          ) : l.who === "note" ? (
            <p key={i} className="text-center text-[12.5px] text-[#ff9b8f]">{l.text}</p>
          ) : (
            <div key={i} className={cx("flex", l.who === "agent" ? "justify-start" : "justify-end")}>
              <p className={cx("max-w-[85%] rounded-xl px-3.5 py-2 text-[14px] leading-relaxed",
                l.who === "agent" ? "rounded-bl-sm bg-white/10" : "rounded-br-sm bg-accent text-white")}>{l.text.trim()}</p>
            </div>
          ))}
          {setup && (
            <div role="alert" className="mx-2 mt-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-[14px] font-medium text-white">This AI agent can&apos;t take calls yet</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{setup}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">Add the key in Vercel (Settings, Environment Variables), then redeploy.</p>
            </div>
          )}
          {state === "idle" && !setup && (
            <p className="px-4 pt-4 text-center text-[13px] leading-relaxed text-white/55">
              {name} picks up and greets you. Talk the way you would on a phone call: no buttons, no waiting, and you can cut in any time.
            </p>
          )}
        </div>

        <div className="border-t border-white/10 px-5 pb-6 pt-4">
          {live && (
            <form className="mb-4 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const t = text.trim(); if (!t) return;
              setText(""); stopPlayback(); closeTurn();
              addLine({ who: "customer", text: t }); closeTurn();
              call.current.lastSound = Date.now();
              cue(t);
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
