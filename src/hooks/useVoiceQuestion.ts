"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking" | "error";

const LANG = "pl-PL";

// Web Speech API (rozpoznawanie mowy) nie jest w standardowych typach DOM TypeScriptu.
type SpeechRecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function isVoiceSupported() {
  return getRecognitionConstructor() !== null && "speechSynthesis" in window;
}

const noopSubscribe = () => () => {};

async function askBackend(question: string): Promise<string> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  const data: { answer: string } = await res.json();
  return data.answer;
}

export function useVoiceQuestion() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  // Na serwerze zakładamy wsparcie, żeby nie pokazywać ostrzeżenia przed hydracją.
  const supported = useSyncExternalStore(noopSubscribe, isVoiceSupported, () => true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Chrome potrafi przerwać mowę, jeśli obiekt wypowiedzi zostanie zebrany przez GC.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cancelledRef = useRef(false);
  // Numer ostatniego pytania: odpowiedź na wcześniejsze lub anulowane pytanie jest pomijana.
  const requestIdRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTranscriptRef = useRef("");
  const submittedRef = useRef(false);

  useEffect(() => {
    // Po wyjściu z ekranu strona jest tylko ukrywana, więc stan trzeba wyzerować tu, a spóźniona odpowiedź nie może się odezwać.
    return () => {
      cancelledRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
      setStatus("idle");
      setError(null);
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Odblokowanie zablokowanej kolejki w Chrome/Edge
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG;

    const voices = window.speechSynthesis.getVoices();
    const polishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("pl"));

    // Preferencja stabilnych, dobrze brzmiących głosów
    const preferredVoice =
      polishVoices.find((v) => v.name.toLowerCase().includes("google")) ||
      polishVoices.find((v) => v.name.toLowerCase().includes("natural")) ||
      polishVoices.find((v) => v.name.toLowerCase().includes("online")) ||
      polishVoices.find((v) => v.name.toLowerCase().includes("zofia") || v.name.toLowerCase().includes("marek")) ||
      polishVoices.find((v) => v.name.toLowerCase().includes("paulina") || v.name.toLowerCase().includes("zosia")) ||
      polishVoices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setStatus("speaking");
    };
    utterance.onend = () => {
      setStatus("idle");
    };
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e.error);
      setStatus("idle");
    };

    utteranceRef.current = utterance;
    // Zapobiegamy zebraniu obiektu przez Garbage Collector w Chrome
    (window as unknown as { _speechUtterance?: SpeechSynthesisUtterance })._speechUtterance = utterance;

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleQuestion = useCallback(
    async (question: string) => {
      const requestId = ++requestIdRef.current;
      setError(null);
      setStatus("thinking");
      try {
        const answer = await askBackend(question);
        if (cancelledRef.current || requestId !== requestIdRef.current) return;
        speak(answer);
      } catch {
        if (cancelledRef.current || requestId !== requestIdRef.current) return;
        setError("Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.");
        setStatus("error");
      }
    },
    [speak]
  );

  const ask = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) return;

    cancelledRef.current = false;
    requestIdRef.current++;
    submittedRef.current = false;
    latestTranscriptRef.current = "";
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setError(null);
    window.speechSynthesis.cancel();

    const recognition = new Recognition();
    recognition.lang = LANG;
    // Ciągłe nasłuchiwanie oraz cząstkowe wyniki zapobiegają ucinaniu dziecka w trakcie myślenia
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const parts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i][0]?.transcript?.trim();
        if (item) parts.push(item);
      }
      const clean = parts.join(" ").trim();
      if (!clean) return;
      latestTranscriptRef.current = clean;

      // Resetujemy licznik ciszy przy każdym wypowiedzianym fragmencie
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Czekamy 1.4 sekundy ciszy zanim uznamy, że dziecko zadało całe pytanie
      silenceTimerRef.current = setTimeout(() => {
        if (submittedRef.current || cancelledRef.current) return;
        if (latestTranscriptRef.current.length > 2) {
          submittedRef.current = true;
          try {
            recognition.stop();
          } catch {}
          void handleQuestion(latestTranscriptRef.current);
        }
      }, 1400);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (!submittedRef.current) {
        setError(
          event.error === "not-allowed"
            ? "Brak dostępu do mikrofonu."
            : "Nie usłyszałem pytania. Spróbuj jeszcze raz."
        );
        setStatus("error");
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (!submittedRef.current && !cancelledRef.current) {
        if (latestTranscriptRef.current.length > 2) {
          submittedRef.current = true;
          void handleQuestion(latestTranscriptRef.current);
        } else {
          setError("Nie usłyszałem pytania. Spróbuj jeszcze raz.");
          setStatus("error");
        }
      }
    };

    recognitionRef.current = recognition;
    setStatus("listening");
    recognition.start();
  }, [handleQuestion]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  return { status, error, supported, ask, stop };
}
