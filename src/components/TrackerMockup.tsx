import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Package, MapPin, Wrench, Clock, 
  Map, ArrowRight, ShieldCheck, Loader2, X
} from 'lucide-react';

// Menambahkan properti (props) agar komponen ini bisa menerima data pesanan asli
export default function TrackerMockup({ order, onClose }: { order: any, onClose: () => void }) {
  const [activeStep, setActiveStep] = useState(0); 

  // Logika otomatis untuk menerjemahkan status Supabase menjadi titik Milestone
  useEffect(() => {
    if (!order) return;
    const status = (order.status || order.order_status || '').toLowerCase();
    
    if (['menunggu konfirmasi', 'menunggu_konfirmasi', 'baru'].includes(status)) setActiveStep(0);
    else if (['dijadwalkan', 'jadwal'].includes(status)) setActiveStep(1);
    else if (['menuju lokasi', 'perjalanan', 'otw'].includes(status)) setActiveStep(2);
    else if (['ditangani', 'dalam_pengerjaan', 'dalam pengerjaan', 'proses'].includes(status)) setActiveStep(3);
    else if (['selesai', 'selesai ditangani', 'lunas', 'menunggu pembayaran', 'menunggu_pembayaran'].includes(status)) setActiveStep(4);
    else setActiveStep(0); 
  }, [order]);

  const trackingSteps = [
    {
      id: 'diterima',
      title: 'Pesanan Diterima',
      desc: 'Admin sedang mengonfirmasi dan menjadwalkan pesanan Anda.',
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      id: 'persiapan',
      title: 'Dijadwalkan / Persiapan',
      desc: 'Pesanan sudah dijadwalkan. Teknisi menyiapkan alat & suku cadang.',
      icon: Package,
      color: 'bg-amber-500'
    },
    {
      id: 'perjalanan',
      title: 'Teknisi Menuju Lokasi',
      desc: 'Teknisi sedang dalam perjalanan. Mohon bersiap di lokasi.',
      icon: MapPin,
      color: 'bg-indigo-500'
    },
    {
      id: 'pengerjaan',
      title: 'Proses Pengerjaan (Ditangani)',
      desc: 'Teknisi sedang melakukan perbaikan / penanganan servis.',
      icon: Wrench,
      color: 'bg-fuchsia-500'
    },
    {
      id: 'selesai',
      title: 'Selesai & Bergaransi',
      desc: 'Perbaikan selesai. Terima kasih telah menggunakan OMEANFIX!',
      icon: ShieldCheck,
      color: 'bg-emerald-500'
    }
  ];

  if (!order) return null; // Sembunyikan jika tidak ada data

  const unitName = order.unit_name || 'Layanan Jasa';
  const orderCode = order.order_code || (order.id ? String(order.id).slice(0,8) : 'PESANAN');

  return (
    // Background Overlay Gelap (z-index dinaikkan ke level tertinggi)
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      
      {/* Kontainer Pop-up */}
      <div className="w-full max-w-md bg-white rounded-t-[32px] flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Tanda Tutup (Swipe indicator & X) */}
        <div className="w-full flex justify-center pt-4 pb-2 bg-white relative z-20">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
          <button onClick={onClose} className="absolute right-5 top-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 outline-none active:scale-95"><X className="w-4 h-4" /></button>
        </div>

        {/* AREA SCROLL */}
        <div className="overflow-y-auto scrollbar-hide">
          {/* HEADER KARTU */}
          <div className="w-full px-6 pt-2 pb-6 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"></div>
            <div className="flex justify-between items-start mb-2 mt-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Pesanan</p>
                <h2 className="text-[19px] font-black text-slate-900 tracking-tight">#{orderCode}</h2>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                Live Tracking
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">{unitName}</p>
          </div>

          {/* BODY MILESTONE TRACKER */}
          <div className="w-full px-6 relative">
            <div className="relative pl-4 mt-2">
              {/* Garis vertikal background */}
              <div className="absolute top-2 bottom-6 left-[23px] w-0.5 bg-slate-100 rounded-full"></div>

              <div className="space-y-8 relative">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index < activeStep;
                  const isActive = index === activeStep;
                  const isPending = index > activeStep;

                  return (
                    <div key={step.id} className={`flex gap-4 relative transition-all duration-500 ${isPending ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                      
                      {/* ICON & INDICATOR */}
                      <div className="relative z-10 flex flex-col items-center mt-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                          isActive ? `${step.color} border-white text-white shadow-lg ring-4 ring-slate-50` : 
                          'bg-white border-slate-200 text-slate-300'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />}
                        </div>
                        {/* Ripple Effect untuk status aktif */}
                        {isActive && (
                          <div className={`absolute inset-0 rounded-full ${step.color} opacity-30 animate-ping`}></div>
                        )}
                      </div>

                      {/* TEKS INFORMASI */}
                      <div className="flex-1 pb-2">
                        <h3 className={`text-[14px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                          {step.title}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                          {step.desc}
                        </p>

                        {/* SMART BUTTON */}
                        {isActive && step.id === 'perjalanan' && (
                          <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                            <a 
                              href="https://maps.google.com" // Link peta sementara
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold py-2.5 px-4 rounded-xl text-[11px] flex items-center justify-between transition-colors shadow-sm"
                            >

<Map className="w-4 h-4"/>
<span className="flex items-center gap-2"> Buka Peta Rute Teknisi</span>
                              <ArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                        
                        {/* SPINNER PENGERJAAN */}
                        {isActive && step.id === 'pengerjaan' && (
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-fuchsia-600 bg-fuchsia-50 py-2 px-3 rounded-lg border border-fuchsia-100 animate-in fade-in">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sedang ditangani teknisi...
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SPACER BLOCK - GAGASAN ANDA */}
          {/* Ini akan memberikan ruang kosong di bawah modal sehingga tidak tertutup menu */}
          <div className="h-32 w-full shrink-0 pointer-events-none"></div>

        </div>
      </div>
    </div>
  );
}