import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Volume2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  appendMode?: boolean; // If true, appends to currentValue with space
  compact?: boolean; // Icon-only for search bars
  buttonText?: string;
  className?: string;
  language?: string;
  placeholderPrompt?: string;
}

export default function VoiceInputButton({
  onTranscript,
  currentValue = '',
  appendMode = true,
  compact = false,
  buttonText = 'Dikte Suara',
  className = '',
  language = 'id-ID',
  placeholderPrompt = 'Mendengarkan... Silakan berbicara sekarang'
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition && !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    }
  }, []);

  const startListening = async () => {
    setErrorMessage(null);
    setInterimText('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              currentInterim += transcript;
            }
          }

          if (currentInterim) {
            setInterimText(currentInterim);
          }

          if (finalTranscript) {
            const cleanedText = finalTranscript.trim();
            if (cleanedText) {
              if (appendMode && currentValue.trim()) {
                onTranscript(`${currentValue.trim()} ${cleanedText}`);
              } else {
                onTranscript(cleanedText);
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage("Izin mikrofon ditolak.");
          } else if (event.error === 'no-speech') {
            setErrorMessage("Tidak ada suara terdeteksi.");
          } else {
            setErrorMessage("Gagal merekam suara.");
          }
          setIsListening(false);
          setInterimText('');
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimText('');
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        fallbackMediaRecorder();
      }
    } else {
      fallbackMediaRecorder();
    }
  };

  const fallbackMediaRecorder = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Browser tidak mendukung input audio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
      };

      mediaRecorder.onstop = () => {
        setIsListening(false);
        stream.getTracks().forEach(track => track.stop());
        setInterimText("Audio berhasil direkam.");
        setTimeout(() => setInterimText(''), 2000);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Microphone access error:", err);
      setErrorMessage("Tidak dapat mengakses mikrofon.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setInterimText('');
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  // Compact Mode (for search bars)
  if (compact) {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? "Hentikan Suara" : "Cari lewat Suara"}
          className={`p-2 rounded-xl transition-all duration-200 outline-none flex items-center justify-center ${
            isListening 
              ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-300' 
              : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          } ${className}`}
        >
          {isListening ? (
            <Mic className="w-4 h-4 animate-bounce text-white" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {isListening && (
          <div className="absolute right-0 top-full mt-1.5 z-50 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{interimText || 'Mendengarkan suara...'}</span>
          </div>
        )}
      </div>
    );
  }

  // Full / Pill Mode (for textareas / complaint forms)
  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={toggleListening}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 outline-none ${
          isListening
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-300'
            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/60'
        } ${className}`}
      >
        {isListening ? (
          <>
            <Mic className="w-3.5 h-3.5 animate-bounce" />
            <span>Mendengarkan...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {/* Floating Listening Feedback */}
      {isListening && (
        <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-[11px] text-rose-800 dark:text-rose-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0"></div>
            <span className="font-semibold truncate">{interimText || placeholderPrompt}</span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline ml-2 shrink-0 cursor-pointer"
          >
            Selesai
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
}
