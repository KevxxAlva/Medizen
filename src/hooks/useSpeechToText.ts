import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseSpeechToTextOptions {
  lang?: string;
  onResult?: (text: string) => void;
  formatPunctuation?: boolean;
}

// Convert spoken punctuation words in Spanish into actual punctuation
function applySpanishPunctuation(text: string): string {
  return text
    .replace(/\bpunto y aparte\b/gi, "\n\n")
    .replace(/\bpunto y seguido\b/gi, ". ")
    .replace(/\bpunto final\b/gi, ".")
    .replace(/\bpunto\b/gi, ".")
    .replace(/\bcoma\b/gi, ",")
    .replace(/\bdos puntos\b/gi, ":")
    .replace(/\bpunto y coma\b/gi, ";")
    .replace(/\bsigno de interrogacion\b/gi, "?")
    .replace(/\bparéntesis abre\b/gi, "(")
    .replace(/\bparéntesis cierra\b/gi, ")")
    .trim();
}

export function useSpeechToText({
  lang = "es-ES",
  onResult,
  formatPunctuation = true,
}: UseSpeechToTextOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const formatted = formatPunctuation
            ? applySpanishPunctuation(finalTranscript)
            : finalTranscript;
          if (onResult) {
            onResult(formatted);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition event error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Permiso de micrófono denegado en el navegador.");
          setIsListening(false);
        } else if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore cleanup abort
        }
      }
    };
  }, [lang, onResult, formatPunctuation]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("El dictado por voz no es compatible con este navegador.");
      return;
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Escuchando dictado médico... hable con claridad.", { duration: 2500 });
    } catch (e) {
      console.warn("Speech start warning:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
