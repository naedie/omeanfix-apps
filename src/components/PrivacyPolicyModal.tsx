import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, FileText, User, Wrench, MapPin, Lock, 
  Sparkles, CheckCircle2, ChevronDown, ChevronUp, HelpCircle, BookOpen, AlertCircle, Zap, Car, Smartphone, Ticket, Award,
  Calendar, Truck, CreditCard
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabase';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  const { isDark } = useTheme();
  const [activeAccordionId, setActiveAccordionId] = useState<string | null>(null);
  const [showFullLegal, setShowFullLegal] = useState<boolean>(false);

  const DEFAULT_SECTIONS = [
    {
      id: 'collect',
      title: 'Data yang Kami Kumpulkan',
      summary: 'Nama lengkap, No. WhatsApp, alamat/wilayah Cirebon, deskripsi kendala, dan foto unit.',
      iconName: 'FileText',
      detail: 'Kami mengumpulkan data pribadi yang Anda masukkan secara sukarela saat memesan layanan (seperti nama, nomor kontak, koordinat alamat di wilayah Cirebon, keluhan perangkat, dan foto unit terkait). OMEANFIX tidak melacak riwayat lokasi terus-menerus, data keuangan rahasia, atau informasi sensitif lainnya di luar kepentingan perbaikan perangkat Anda.'
    },
    {
      id: 'purpose',
      title: 'Tujuan Penggunaan Data',
      summary: 'Penugasan teknisi, konfirmasi jadwal, navigasi rute ke rumah, dan penerbitan invoice resmi.',
      iconName: 'Wrench',
      detail: 'Semua informasi Anda digunakan murni untuk keperluan operasional OMEANFIX: menentukan teknisi terbaik, mengonfirmasi jadwal kedatangan, membantu navigasi peta teknisi menuju lokasi rumah Anda, mengonfirmasi pembayaran DP/pelunasan, serta menerbitkan invoice digital resmi yang tersinkronisasi langsung dengan sistem pembukuan keuangan.'
    },
    {
      id: 'security',
      title: 'Keamanan & Pembagian Data',
      summary: 'Zero-sale policy (data tidak diperjualbelikan), enkripsi Supabase cloud, dan akses staf terbatas.',
      iconName: 'Lock',
      detail: 'Kami menerapkan kebijakan nol-penjualan (Zero-sale policy), di mana data Anda tidak akan pernah dijual atau dibagikan ke pihak ketiga mana pun untuk tujuan periklanan. Seluruh data disimpan dengan aman di sistem cloud terenkripsi Supabase. Akses alamat rumah dan detail kontak hanya diberikan secara terbatas kepada teknisi aktif yang ditugaskan khusus untuk pesanan Anda.'
    },
    {
      id: 'rights',
      title: 'Hak & Kendali Pelanggan',
      summary: 'Hak memperbarui data akun secara mandiri dan hak mengajukan penghapusan riwayat/akun.',
      iconName: 'Sparkles',
      detail: 'Anda memiliki kendali penuh atas informasi pribadi Anda. Anda dapat mengubah foto profil, alamat email, dan nomor WhatsApp secara mandiri melalui halaman "Informasi Akun" di menu Profil. Anda juga berhak mengajukan permohonan penghapusan riwayat transaksi atau penghapusan akun secara permanen dengan menghubungi layanan pelanggan resmi kami.'
    }
  ];

  const [sections, setSections] = useState<any[]>(DEFAULT_SECTIONS);
  const [legalClauses, setLegalClauses] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPrivacyDocs = async () => {
      try {
        const { data, error } = await supabase
          .from('app_information_docs')
          .select('*')
          .eq('doc_type', 'privacy')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any, idx: number) => ({
            id: d.id ? String(d.id) : `db-privacy-${idx}`,
            title: d.title,
            summary: d.summary,
            iconName: d.icon_name || d.icon || 'ShieldCheck',
            detail: d.content || (Array.isArray(d.details) && d.details.length > 0 ? d.details.join(' ') : (d.summary || '')),
            details: Array.isArray(d.details) ? d.details : [],
            content: d.content || null
          }));
          setSections(mapped);
          
          if (mapped.length > 0 && activeAccordionId === null) {
            setActiveAccordionId(mapped[0].id);
          }

          // Extract legal clauses
          const clauses = data.filter((d: any) => Boolean(d.content));
          if (clauses.length > 0) {
            setLegalClauses(clauses);
          }
        }
      } catch (err) {
        console.warn('Hybrid fallback used for Privacy Policy Modal:', err);
      }
    };

    fetchPrivacyDocs();
  }, [isOpen]);

  // Set default initial active accordion if none is set
  useEffect(() => {
    if (sections.length > 0 && activeAccordionId === null) {
      setActiveAccordionId(sections[0].id);
    }
  }, [sections]);

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
      case 'AlertCircle': return <AlertCircle className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Car': return <Car className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Ticket': return <Ticket className={className} />;
      case 'Award': return <Award className={className} />;
      default: return <FileText className={className} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Modal Wrapper with iOS Glassmorphism styling */}
      <div 
        className="w-full max-w-md bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between relative shrink-0">
          <div className="flex gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight leading-snug">Kebijakan Privasi</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal mt-0.5">Ringkasan transparan cara OMEANFIX menjaga data Anda di Cirebon</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 outline-none"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
          {/* Introduction Card */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl text-[12px] text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
            Di OMEANFIX, kami menghargai kepercayaan Anda. Halaman ini menjelaskan secara transparan dan jujur mengenai bagaimana seluruh data pribadi Anda dikumpulkan, digunakan, dan dilindungi dengan aman.
          </div>

          {/* Accordion Container */}
          <div className="space-y-3">
            {sections.map((section) => {
              const isOpen = activeAccordionId === section.id;

              return (
                <div 
                  key={section.id}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'bg-slate-50/40 dark:bg-slate-800/40 border-blue-200 dark:border-blue-900 shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  {/* Accordion Header */}
                  <div 
                    onClick={() => setActiveAccordionId(isOpen ? null : section.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {renderCmsIcon(section.iconName || 'FileText', 'w-4 h-4')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-[12px] font-bold tracking-tight leading-snug ${isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {section.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium pr-1">
                          {section.summary}
                        </p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="px-4 pb-4 pl-12 text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium pt-2 border-t border-slate-100/50 dark:border-slate-800/30 animate-in fade-in duration-200">
                      <div>{section.detail}</div>
                      {Array.isArray(section.details) && section.details.length > 0 && (
                        <ul className="mt-2 space-y-1.5 pl-0">
                          {section.details.map((bullet: string, bIdx: number) => (
                            <li key={bIdx} className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legal Document Toggle Accordion */}
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <button 
              type="button"
              onClick={() => setShowFullLegal(!showFullLegal)}
              className="w-full p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 text-left cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Baca Naskah Hukum Lengkap (Pasal per Pasal)</span>
              </div>
              {showFullLegal ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showFullLegal && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium space-y-3.5 max-h-[220px] overflow-y-auto border-t border-slate-200/80 dark:border-slate-800/80">
                {legalClauses.length > 0 ? (
                  legalClauses.map((clause, cIdx) => (
                    <div key={clause.id || cIdx}>
                      <h5 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1 uppercase">
                        PASAL {clause.display_order ?? cIdx + 1} - {clause.title}
                      </h5>
                      <p>{clause.content}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <h5 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">PASAL 1 - PENGUMPULAN DATA</h5>
                      <p>OMEANFIX mengumpulkan informasi identitas pengguna berupa nama lengkap, nomor WhatsApp aktif, alamat fisik untuk kunjungan teknisi, rincian foto barang yang dilaporkan rusak, serta data transaksi pembayaran demi menunjang keabsahan operasional jasa perbaikan.</p>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">PASAL 2 - TUJUAN DAN PENGOLAHAN</h5>
                      <p>Semua data yang dikumpulkan diproses dengan tujuan tunggal untuk melakukan koordinasi penugasan teknisi lapangan, memandu rute perjalanan mitra teknisi menuju rumah pelanggan, memverifikasi tanda bukti pembayaran atau pelunasan kasir, serta menerbitkan rincian invoice formal.</p>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">PASAL 3 - ENKRIPSI DAN KEAMANAN</h5>
                      <p>Kami bekerja sama dengan Supabase Cloud Storage untuk menjamin keamanan penyimpanan data Anda melalui enkripsi standar SSL/TLS di server cloud. Kami membatasi akses data sensitif pelanggan dari staf internal yang tidak berkepentingan.</p>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">PASAL 4 - HAK PELANGGAN</h5>
                      <p>Pelanggan memiliki hak mutlak untuk memperbarui profil pribadi mereka kapan pun secara langsung di dalam aplikasi. Pelanggan juga dapat mengajukan permohonan penutupan akun beserta penghapusan riwayat transaksi melalui layanan dukungan pelanggan OMEANFIX.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-[13px] shadow-lg shadow-blue-600/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 outline-none"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Saya Mengerti & Setuju</span>
          </button>
        </div>
      </div>
    </div>
  );
}
