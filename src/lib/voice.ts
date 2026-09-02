export type VoiceStatus = "idle" | "listening" | "unsupported";

type Recog = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecog(): Recog | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recog;
    webkitSpeechRecognition?: new () => Recog;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function speechSupported() {
  return typeof window !== "undefined" && !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string) {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export function startPushToTalk(onFinal: (transcript: string) => void, onError: (m: string) => void): () => void {
  const rec = getRecog();
  if (!rec) {
    onError("On-device speech is not available in this browser. Type instead.");
    return () => {};
  }
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = true;
  let acc = "";
  rec.onresult = (ev) => {
    let chunk = "";
    for (let i = 0; i < ev.results.length; i++) {
      const r = ev.results[i];
      chunk += r[0].transcript;
      if (r.isFinal) acc = chunk;
    }
  };
  rec.onerror = (ev) => onError(ev.error);
  rec.onend = () => {
    const t = acc.trim();
    if (t) onFinal(t);
  };
  try {
    rec.start();
  } catch (e) {
    onError(String(e));
  }
  return () => {
    try {
      rec.stop();
    } catch {
      rec.abort();
    }
  };
}
