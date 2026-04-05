"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, X } from "lucide-react";

interface ParsedEvent {
  name: string;
  date: string | null;
  endDate: string | null;
  location: string | null;
  description: string | null;
  attendees: string[];
  reminderPresets: string[];
}

interface SpeechToEventProps {
  onParsed: (data: ParsedEvent) => void;
}

export function SpeechToEvent({ onParsed }: SpeechToEventProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    setError("");
    setTranscript("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setShowModal(true);
  }, []);

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function parseTranscript() {
    if (!transcript.trim()) {
      setError("No speech detected. Please try again.");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const res = await fetch("/api/parse-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse");
      }

      const parsed = await res.json();
      onParsed(parsed);
      setShowModal(false);
      setTranscript("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse event");
    }
    setParsing(false);
  }

  function handleClose() {
    stopListening();
    setShowModal(false);
    setTranscript("");
    setError("");
  }

  if (!showModal) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full py-6 text-base gap-2 border-dashed border-2"
        onClick={startListening}
      >
        <Mic className="h-5 w-5" />
        Add via AI
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Voice Input</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {isListening
            ? 'Listening... Describe your event (e.g. "Soccer practice next Tuesday at 4pm at Lincoln Park")'
            : transcript
              ? "Review your speech below, then tap Parse to create the event."
              : "Tap the microphone to start speaking."}
        </p>

        {/* Transcript */}
        {transcript && (
          <div className="rounded-lg bg-muted p-3 text-sm min-h-[60px]">
            {transcript}
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Controls */}
        <div className="flex gap-2">
          {isListening ? (
            <Button
              onClick={stopListening}
              variant="destructive"
              className="flex-1 gap-2"
            >
              <MicOff className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <>
              <Button
                onClick={startListening}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Mic className="h-4 w-4" />
                {transcript ? "Retry" : "Start"}
              </Button>
              {transcript && (
                <Button
                  onClick={parseTranscript}
                  className="flex-1 gap-2"
                  disabled={parsing}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    "Parse Event"
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
