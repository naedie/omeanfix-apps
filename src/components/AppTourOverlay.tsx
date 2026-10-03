import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Wrench, Calendar, FileText, Truck, CheckCircle2, Play } from 'lucide-react';

interface AppTourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBooking?: () => void;
}

export default function AppTourOverlay({ isOpen, onClose, onStartBooking }: AppTourOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const TOUR_STEPS = [
    {
      step: 1,
      title: 'Pilih Kategori & Jasa Layanan',
      category: 'Langkah 1 dari 4',
      icon: Wrench,
      description: 'Di halaman Beranda, pilih kategori perbaikan yang Anda butuhkan (seperti AC, Mesin Cuci, Kulkas, Pompa Air, atau Kendaraan).',
      badge: 'Beranda OMEANFIX'
    },
    {
      step: 2,
      title: 'Tentukan Tindakan & Lokasi',
      category: 'Langkah 2 dari 4',
      icon: Calendar,
      description: 'Tentukan apakah Anda ingin teknisi datang langsung ke rumah (On-Demand Home Service) atau membawa unit ke workshop.',
      badge: 'Reservasi & Jadwal'
    },
    {
      step: 3,
      title: 'Tulis Keluhan & Dikte Suara',
      category: 'Langkah 3 dari 4',
      icon: FileText,
      description: 'Jelaskan keluhan kerusakan pada unit Anda. Anda bisa mengetik atau menggunakan fitur **Dikte Suara** (ikon mikrofon) untuk berbicara langsung.',
      badge: 'Detail Kerusakan'
    },
    {
      step: 4,
      title: 'Lacak Perjalanan Teknisi Real-Time',
      category: 'Langkah 4 dari 4',
      icon: Truck,
      description: 'Pantau status pengerjaan secara real-time melalui menu **Pesanan**, terima notifikasi instan, dan lakukan pembayaran setelah servis selesai.',
      badge: 'Pelacakan & Selesai'
    }
  ];

  const activeData = TOUR_STEPS[currentStep];
  const StepIcon = activeData.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
      setCurrentStep(0);
      if (onStartBooking) onStartBooking();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-white/20 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow & Header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/30">
              {activeData.category}
            </span>
            <button 
              type="button"
              onClick={() => { onClose(); setCurrentStep(0); }}
              className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors outline-none"
              title="Lewati Tur"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 shadow-lg">
              <StepIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block mb-0.5">{activeData.badge}</span>
              <h3 className="text-[18px] font-black tracking-tight leading-snug">{activeData.title}</h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700/80">
            <p className="text-[13px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              {activeData.description}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-between gap-1.5 px-1">
            {TOUR_STEPS.map((s, idx) => (
              <div 
                key={s.step} 
                onClick={() => setCurrentStep(idx)}
                className={`h-2 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === currentStep ? 'bg-blue-600 shadow-sm shadow-blue-600/30' : 
                  idx < currentStep ? 'bg-blue-200 dark:bg-blue-900' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              ></div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-[13px] transition-all active:scale-95 flex items-center justify-center gap-1.5 outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { onClose(); setCurrentStep(0); }}
                className="py-3.5 px-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 font-bold text-[12px] transition-colors outline-none"
              >
                Lewati Tur
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="ripple-btn flex-1 py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-[13px] shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 outline-none cursor-pointer"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Mulai Pesan Teknisi' : 'Lanjut'}</span>
              {currentStep === TOUR_STEPS.length - 1 ? <Play className="w-4 h-4 fill-white" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
