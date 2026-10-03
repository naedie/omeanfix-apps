import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Sparkles, Wrench, BookOpen, DollarSign, Users, Send, Loader2, Play, Square, RefreshCw, CheckCircle2 } from 'lucide-react';
import { triggerRipple } from '../utils/ripple';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AssistantMode = 'troubleshooting' | 'guide' | 'cost_sparepart' | 'handsfree_technician';

export default function VoiceAssistantModal({ isOpen, onClose }: VoiceAssistantModalProps) {
  const [activeMode, setActiveMode] = useState<AssistantMode>('troubleshooting');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: 'Halo! Saya OMEANFIX Voice AI Assistant. Silakan pilih mode bantuan di atas atau tekan tombol mikrofon untuk berbicara mengenai konsultasi kerusakan, panduan aplikasi, estimasi biaya, atau mode hands-free teknisi.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [textInput, setTextInput] = useState('');
  const [audioMuted, setAudioMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAI]);

  // Initialize Speech Recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'id-ID';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
          setTextInput(text);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          if (transcript.trim()) {
            handleSendMessage(transcript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
      }
    }
  }, [transcript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Maaf, browser Anda tidak mendukung fitur Web Speech Recognition. Silakan ketik pesan Anda.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const speakText = (text: string) => {
    if (audioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || textInput;
    if (!query.trim()) return;

    const userTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user' as const, text: query, time: userTime }];
    setMessages(newMessages);
    setTextInput('');
    setTranscript('');
    setIsLoadingAI(true);

    try {
      // Format history for server
      const historyPayload = newMessages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/gemini/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          mode: activeMode,
          history: historyPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal terhubung ke AI server');

      const aiReply = data.text;
      const aiTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: 'assistant', text: aiReply, time: aiTime }]);
      speakText(aiReply);
    } catch (err: any) {
      console.error(err);
      const errReply = "Maaf, terjadi kendala koneksi AI saat ini. Silakan tanyakan kembali.";
      setMessages(prev => [...prev, { role: 'assistant', text: errReply, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }]);
      speakText(errReply);
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!isOpen) return null;

  const MODES = [
    { id: 'troubleshooting' as AssistantMode, label: 'Konsultasi & Diagnosa', icon: Wrench, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200' },
    { id: 'guide' as AssistantMode, label: 'Panduan Aplikasi', icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200' },
    { id: 'cost_sparepart' as AssistantMode, label: 'Estimasi & Sparepart', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' },
    { id: 'handsfree_technician' as AssistantMode, label: 'Hands-Free Teknisi', icon: Sparkles, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col h-[85vh] max-h-[750px] overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER MODAL DENGAN VISUALIZER GELOMBANG SUARA */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isSpeaking || isListening ? 'bg-emerald-500 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[16px] tracking-tight">OMEANFIX Voice AI</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold uppercase rounded-full border border-emerald-500/30">
                  Live Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Asisten suara cerdas & audio visualizer interaktif</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAudioMuted(!audioMuted)} 
              className={`p-2 rounded-full border transition-colors outline-none ${audioMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              title={audioMuted ? "Suara Asisten Dimatikan" : "Suara Asisten Aktif"}
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => { stopSpeaking(); onClose(); }} 
              className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-full border border-white/20 transition-colors outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AUDIO VISUALIZER GELOMBANG SUARA (ANIMATED SOUNDWAVES) */}
        <div className="bg-slate-950 px-6 py-4 flex flex-col items-center justify-center border-b border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-emerald-600/10 to-indigo-600/10 animate-pulse"></div>
          
          <div className="flex items-center gap-1.5 h-12 relative z-10 my-1">
            {[40, 75, 30, 90, 60, 100, 45, 80, 35, 95, 65, 85, 50, 70, 40, 90].map((h, i) => (
              <div 
                key={i} 
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isListening || isSpeaking 
                    ? 'bg-gradient-to-t from-blue-500 via-emerald-400 to-cyan-300 animate-bounce' 
                    : 'bg-slate-700 h-3'
                }`}
                style={{ 
                  height: isListening || isSpeaking ? `${Math.max(15, (h * Math.random() + 20))}px` : '12px',
                  animationDelay: `${i * 0.08}s` 
                }}
              ></div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1 relative z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-bold text-slate-300">
              {isListening ? 'Mendengarkan suara Anda...' : isSpeaking ? 'Asisten sedang berbicara...' : 'Ketuk mikrofon atau pilih mode di bawah'}
            </span>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="ml-2 px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-[10px] font-bold flex items-center gap-1">
                <Square className="w-3 h-3" /> Berhenti
              </button>
            )}
          </div>
        </div>

        {/* MODE SELECTOR TABS */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMode(m.id);
                  speakText(`Mode ${m.label} diaktifkan. Silakan sampaikan pertanyaan Anda.`);
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all outline-none ${
                  isActive 
                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-transparent shadow-md' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </div>
                <span className="text-[11px] font-extrabold leading-tight line-clamp-1">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* CHAT TRANSCRIPT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 scrollbar-hide">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in`}>
              <div className={`max-w-[85%] p-4 rounded-[22px] text-[13px] leading-relaxed font-medium shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-xs' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-xs'
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1 font-semibold">{msg.time}</span>
            </div>
          ))}

          {isLoadingAI && (
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-4 rounded-[22px] rounded-bl-xs border border-slate-100 dark:border-slate-700 w-fit shadow-sm animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">AI sedang menganalisis & menyusun jawaban...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT & MICROFONE CONTROLS */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center gap-2.5">
          <button
            onClick={toggleListening}
            className={`p-3.5 rounded-full shadow-lg transition-all outline-none flex items-center justify-center shrink-0 ${
              isListening 
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40 ring-4 ring-rose-200 dark:ring-rose-950' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 active:scale-95'
            }`}
            title={isListening ? "Hentikan Perekaman Suara" : "Mulai Bicara / Dikte Suara"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? "Mendengarkan suara Anda..." : "Ketik pertanyaan atau gunakan mikrofon..."}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 px-4 py-3.5 rounded-2xl text-xs font-semibold outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 border border-slate-200 dark:border-slate-700 transition-colors"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!textInput.trim() || isLoadingAI}
            className="p-3.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-40 disabled:bg-slate-200 text-white rounded-2xl shadow-md active:scale-95 transition-all outline-none shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
