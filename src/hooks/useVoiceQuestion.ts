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
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
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

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith("pl"));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleQuestion = useCallback(
    async (question: string) => {
      setStatus("thinking");
      try {
        const answer = await askBackend(question);
        if (cancelledRef.current) return;
        speak(answer);
      } catch {
        if (cancelledRef.current) return;
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
    setError(null);
    window.speechSynthesis.cancel();

    const recognition = new Recognition();
    recognition.lang = LANG;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let gotResult = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      gotResult = true;
      void handleQuestion(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      gotResult = true;
      setError(
        event.error === "not-allowed"
          ? "Brak dostępu do mikrofonu."
          : "Nie usłyszałem pytania. Spróbuj jeszcze raz."
      );
      setStatus("error");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!gotResult && !cancelledRef.current) {
        setError("Nie usłyszałem pytania. Spróbuj jeszcze raz.");
        setStatus("error");
      }
    };

    recognitionRef.current = recognition;
    setStatus("listening");
    recognition.start();
  }, [handleQuestion]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  return { status, error, supported, ask, stop };
}
