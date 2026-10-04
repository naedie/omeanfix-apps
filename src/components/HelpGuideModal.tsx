import React, { useState, useEffect } from 'react';
import { 
  X, Search, BookOpen, CheckCircle2, ChevronRight, HelpCircle, 
  Wrench, Calendar, FileText, Truck, Sparkles, ShieldCheck,
  MapPin, Lock, User, CreditCard, Zap, Car, Smartphone, Ticket, Award
} from 'lucide-react';
import { supabase } from '../supabase';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpGuideModal({ isOpen, onClose }: HelpGuideModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const DEFAULT_HELP_TOPICS = [
    {
      id: 'step-1',
      step: 'Langkah 1',
      title: 'Pilih Kategori & Layanan Servis',
      category: 'Pemesanan',
      iconName: 'Wrench',
      summary: 'Cara memilih jasa perawatan atau perbaikan perangkat rumah tangga.',
      details: [
        'Buka halaman Beranda OMEANFIX.',
        'Pilih kategori jasa yang Anda butuhkan (contoh: AC, Mesin Cuci, Kulkas, Pompa Air, dll).',
        'Tentukan jenis tindakan apakah Perawatan Berkala atau Perbaikan Kerusakan.',
        'Pilih metode pelayanan: Panggil Teknisi ke Rumah atau Bawa Sendiri ke Workshop.'
      ]
    },
    {
      id: 'step-2',
      step: 'Langkah 2',
      title: 'Isi Data Diri, Lokasi & Jadwal',
      category: 'Reservasi',
      iconName: 'Calendar',
      summary: 'Menentukan alamat lokasi pengerjaan dan waktu kedatangan teknisi.',
      details: [
        'Masukkan alamat lengkap beserta patokan agar teknisi mudah menemukan lokasi Anda.',
        'Pilih tanggal kedatangan yang tersedia pada kalender interaktif.',
        'Pilih slot waktu yang diinginkan (Pagi, Siang, Sore, atau Malam).'
      ]
    },
    {
      id: 'step-3',
      step: 'Langkah 3',
      title: 'Tulis Keluhan & Gunakan Dikte Suara',
      category: 'Fitur Suara',
      iconName: 'FileText',
      summary: 'Memasukkan detail kerusakan dengan mengetik atau berbicara langsung.',
      details: [
        'Jelaskan keluhan kerusakan unit pada kolom detail.',
        'Gunakan tombol "Dikte Suara" (ikon mikrofon) untuk berbicara langsung tanpa mengetik.',
        'Lampirkan foto kondisi unit yang rusak jika diperlukan (opsional).',
        'Gunakan kupon dari Voucher Wallet untuk potongan harga.'
      ]
    },
    {
      id: 'step-4',
      step: 'Langkah 4',
      title: 'Kirim Pesanan & Lacak Real-Time',
      category: 'Pelacakan',
      iconName: 'Truck',
      summary: 'Memantau status pengerjaan teknisi dan progres perbaikan.',
      details: [
        'Setelah pesanan dibuat, Anda akan mendapatkan Nomor Pesanan unik (contoh: #ORD-XXXX).',
        'Gunakan menu "Lacak Status Pesanan" di beranda untuk memantau perjalanan teknisi secara real-time.',
        'Terima notifikasi instan saat teknisi tiba dan saat perbaikan selesai.'
      ]
    },
    {
      id: 'step-5',
      step: 'Langkah 5',
      title: 'Pencarian Suku Cadang & Tambah Part',
      category: 'Sparepart',
      iconName: 'Sparkles',
      summary: 'Mencari komponen suku cadang original dengan fitur pencarian suara.',
      details: [
        'Buka tab "Sparepart" di menu bawah aplikasi.',
        'Gunakan kolom pencarian atau tombol mikrofon (Pencarian Suara) untuk mencari komponen (misal: "Kapasitor AC").',
        'Tambahkan suku cadang langsung ke pesanan aktif Anda untuk disatukan dalam tagihan.'
      ]
    }
  ];

  const [helpTopics, setHelpTopics] = useState<any[]>(DEFAULT_HELP_TOPICS);

  useEffect(() => {
    if (!isOpen) return;

    const fetchHelpDocs = async () => {
      try {
        const { data, error } = await supabase
          .from('app_information_docs')
          .select('*')
          .eq('doc_type', 'help_center')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any, idx: number) => ({
            id: d.id ? String(d.id) : `db-help-${idx}`,
            step: `Langkah ${d.display_order ?? idx + 1}`,
            title: d.title,
            category: d.summary ? d.summary.split(' ')[0] : 'Panduan',
            iconName: d.icon_name || d.icon || 'BookOpen',
            summary: d.summary,
            details: Array.isArray(d.details) && d.details.length > 0 ? d.details : [d.summary]
          }));
          setHelpTopics(mapped);
        }
      } catch (err) {
        console.warn('Hybrid fallback used for Help Guide Modal:', err);
      }
    };

    fetchHelpDocs();
  }, [isOpen]);

  const renderCmsIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'Truck': return <Truck className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'MapPin': return <MapPin className={className} />;
      case 'Lock': return <Lock className={className} />;
      case 'User': return <User className={className} />;
      case 'CreditCard': return <CreditCard className={className} />;
      case 'HelpCircle': return <HelpCircle className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'CheckCircle2': return <CheckCircle2 className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Car': return <Car className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Ticket': return <Ticket className={className} />;
      case 'Award': return <Award className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  if (!isOpen) return null;

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.details.some((d: string) => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight">Tutorial & Bantuan Aplikasi</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Panduan langkah demi langkah (Onboarding) OMEANFIX</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari topik bantuan (mis: pemesanan, dikte suara, sparepart)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-11 pr-10 py-3 rounded-2xl text-[13px] font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3.5 no-scrollbar">
          {filteredTopics.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Topik tidak ditemukan</h4>
              <p className="text-xs text-slate-400">Coba kata kunci lain atau pilih dari daftar panduan.</p>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isSelected = selectedTopicId === topic.id;

              return (
                <div 
                  key={topic.id}
                  onClick={() => setSelectedTopicId(isSelected ? null : topic.id)}
                  className={`p-4 rounded-[22px] border transition-all cursor-pointer outline-none ${
                    isSelected 
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-md ring-1 ring-blue-200' 
                      : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {renderCmsIcon(topic.iconName || 'BookOpen', 'w-4 h-4')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-md tracking-wider">
                            {topic.step}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                            {topic.category}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-[14px] text-slate-900 dark:text-white tracking-tight leading-snug">{topic.title}</h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{topic.summary}</p>
                      </div>
                    </div>
                    <div className={`p-1.5 rounded-full text-slate-400 transition-transform shrink-0 ${isSelected ? 'rotate-90 text-blue-600' : ''}`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="mt-4 pt-3.5 border-t border-blue-200/50 dark:border-blue-900/40 space-y-2 animate-in fade-in duration-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800 dark:text-blue-300 mb-2">Panduan Detail:</p>
                      {topic.details.map((det: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-[12px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{det}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Support Tip */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs rounded-b-[32px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Butuh bantuan teknis langsung?
          </span>
          <a
            href="https://wa.me/6281200000000?text=Halo%20Admin%20OMEANFIX,%20saya%20butuh%20bantuan%20terkait%20aplikasi."
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] shadow-sm active:scale-95 transition-all"
          >
            Hubungi WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
