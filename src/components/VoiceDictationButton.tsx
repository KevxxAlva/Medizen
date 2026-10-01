import React from "react";
import { Mic, MicOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceDictationButtonProps {
  onTranscript: (spokenText: string) => void;
  className?: string;
  size?: "icon" | "sm" | "default";
}

export function VoiceDictationButton({
  onTranscript,
  className = "",
  size = "icon",
}: VoiceDictationButtonProps) {
  const { isListening, isSupported, toggleListening } = useSpeechToText({
    lang: "es-ES",
    onResult: (text) => {
      onTranscript(text);
    },
  });

  if (!isSupported) {
    return null; // Gracefully hidden if browser doesn't support Web Speech API
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={size}
            onClick={toggleListening}
            className={cn(
              "rounded-xl transition-all duration-200 cursor-pointer",
              isListening
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
              className
            )}
            aria-label={isListening ? "Detener dictado por voz" : "Iniciar dictado por voz"}
          >
            {isListening ? (
              <span className="flex items-center gap-1.5 font-bold text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <Radio className="h-4 w-4 animate-spin text-rose-500" />
                {size !== "icon" && <span>Escuchando...</span>}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Mic className="h-4 w-4 text-primary/80" />
                {size !== "icon" && <span>Dictar</span>}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-semibold">
          {isListening ? "Clic para pausar dictado" : "Dictado por voz (Español)"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
