import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, Wrench, Settings, AlertCircle, Phone, 
  MapPin, User, FileText, CheckCircle2, Package, Loader2, ArrowRight, Camera, Calendar, Truck, Home
} from 'lucide-react';
import { supabase } from '../supabase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: any | null;
}

export default function BookingModal({ isOpen, onClose, selectedCategory }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedOrderCode, setGeneratedOrderCode] = useState('');

  // DATA MASTER UNIT
  const [units, setUnits] = useState<any[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);

  // SELECTIONS (Langkah 1)
  const [searchUnit, setSearchUnit] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>(''); 
  const [selectedMethod, setSelectedMethod] = useState<string>(''); 

  // USER FORM (Langkah 2 & 3)
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custLocation, setCustLocation] = useState('Kota Cirebon - Kesambi');
  const [custAddress, setCustAddress] = useState('');
  const [complaint, setComplaint] = useState('');

  // TANGGAL, WAKTU, FOTO
  const [reserveDate, setReserveDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && selectedCategory) {
      setStep(1);
      setSubmitSuccess(false);
      setSearchUnit('');
      setSelectedUnit(null);
      setSelectedAction('');
      setSelectedMethod('');
      setCustName('');
      setCustPhone('');
      setCustLocation('Kota Cirebon - Kesambi');
      setCustAddress('');
      setComplaint('');
      setReserveDate('');
      setTimeSlot('');
      setAttachmentBase64(null);
      
      fetchMasterData();
      fetchUserProfile();
      generateCalendar();
    }
  }, [isOpen, selectedCategory]);

  // AUTO-GENERATE DATA PELANGGAN
  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase.from('customers').select('*').limit(1).maybeSingle();
      if (data) {
        setCustName(data.full_name || 'Pelanggan Setia');
        setCustPhone(data.phone_number || '0812-0000-0000');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // GENERATE KALENDER CUSTOM
  const generateCalendar = () => {
    const days = [];
    const todayDate = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      const isFull = i === 2 || i === 5; // Simulasi Hari Penuh

      days.push({
        fullDate: dateStr,
        dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        dayNum: d.getDate(),
        isFull: isFull
      });
    }
    setCalendarDays(days);
  };

  const fetchMasterData = async () => {
    if (!selectedCategory) return;
    setIsLoadingMaster(true);
    try {
      const { data } = await supabase.from('services').select('*').eq('category_id', selectedCategory.id);
      if (data) setUnits(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMaster(false);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep = () => {
    setStep(prev => prev + 1);
    scrollToTop();
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
    scrollToTop();
  };

  // === FUNGSI KOMPRESI FOTO ===
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const base64Str = canvas.toDataURL('image/webp', 0.7);
            setAttachmentBase64(base64Str);
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCancelImage = () => {
    setAttachmentBase64(null);
    const fileInput = document.getElementById('damage-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedUnit || !selectedAction || !selectedMethod) return;
    
    setIsSubmitting(true);
    try {
      const orderCode = `CRB-${Math.floor(Math.random() * 90000) + 10000}`;
      setGeneratedOrderCode(orderCode);

      let combinedNotes = complaint;
      if (reserveDate && timeSlot) {
        combinedNotes += `\n[JADWAL: ${reserveDate} | ${timeSlot}]`;
      }
      if (attachmentBase64) {
        combinedNotes += `\n[FOTO_TERLAMPIR]`;
      }

      const isBawaSendiri = selectedMethod === 'Bawa Sendiri';
      const finalLocation = isBawaSendiri ? 'Drop-off Bengkel' : custLocation;
      const finalAddress = isBawaSendiri ? 'Pelanggan membawa unit langsung ke workshop/bengkel.' : custAddress;

      // PAYLOAD DIPERBARUI: category_name dan customer_name DIHAPUS agar 100% cocok dengan Database Anda
      const payload = {
        order_code: orderCode,
        user_phone: custPhone,
        unit_name: selectedUnit.name,
        action_type: selectedAction, 
        method: selectedMethod,      
        location: finalLocation,
        address: finalAddress,
        note: combinedNotes,             
        status: 'Menunggu Konfirmasi',
        booking_date: reserveDate || null,              
        booking_time: timeSlot || null,                 
        attachment_image: attachmentBase64 || null      
      };

      const { error } = await supabase.from('orders').insert([payload]);
      
      if (error) throw error;
      
      setSubmitSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert('Gagal mengirim pesanan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUnits = units.filter(u => u.name.toLowerCase().includes(searchUnit.toLowerCase()));
  const isBawaSendiri = selectedMethod === 'Bawa Sendiri'; 

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center">
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-slate-50 rounded-t-[32px] sm:rounded-[32px] flex flex-col h-[90vh] sm:h-[85vh] animate-in slide-in-from-bottom-full duration-300 ease-out shadow-2xl relative overflow-hidden"
      >
        <div className="w-full flex justify-between items-center p-5 pb-4 bg-white relative z-10 shrink-0 border-b border-slate-100 shadow-sm">
           <div>
             <h2 className="text-[18px] font-black text-slate-800 tracking-tight">
               {submitSuccess ? 'Pesanan Berhasil' : 'Formulir Servis'}
             </h2>
             {!submitSuccess && (
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mt-0.5">
                  Langkah {step} dari 3
                </p>
             )}
           </div>
           <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 active:scale-95 transition-colors outline-none">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="w-full bg-slate-100 h-1 shrink-0">
           {!submitSuccess && (
             <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }}></div>
           )}
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
          {submitSuccess ? (
            <div className="p-6 py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-sm relative">
                 <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                 <CheckCircle2 className="w-10 h-10 relative z-10" />
               </div>
               <h3 className="text-[20px] font-black text-slate-800 mb-1 tracking-tight">Yeay! Pesanan Terkirim</h3>
               <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-md mb-4 border border-blue-100">
                 #{generatedOrderCode}
               </span>
               <p className="text-[12px] text-slate-500 max-w-[260px] leading-relaxed mb-6 font-medium">
                 Teknisi OMEANFIX telah menerima permintaan Anda. Kami akan segera menghubungi nomor WhatsApp Anda untuk konfirmasi jadwal.
               </p>
               <button onClick={onClose} className="w-full max-w-[240px] bg-slate-900 text-white font-bold py-3.5 rounded-xl text-[13px] active:scale-95 shadow-md outline-none">
                 Selesai & Tutup
               </button>
            </div>
          ) : (
            <div className="p-5">
              
              {/* === STEP 1: OBJEK & LAYANAN === */}
              {step === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300 pb-10">
                  
                  {/* PEMILIHAN UNIT */}
                  <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Package className="w-5 h-5"/></div>
                       <div>
                         <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">Kategori Layanan</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedCategory?.name}</p>
                       </div>
                    </div>

                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">Pilih Objek / Unit</label>
                    <div className="relative mb-3">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="w-4 h-4 text-slate-400" /></div>
                       <input type="text" placeholder="Cari unit (cth: Kulkas 2 Pintu)..." value={searchUnit} onChange={(e) => setSearchUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-3 rounded-[14px] text-[12px] font-medium outline-none focus:border-blue-500 transition-colors" />
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
                       {isLoadingMaster ? (
                         <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                       ) : filteredUnits.length === 0 ? (
                         <div className="text-center py-4 text-[11px] text-slate-400 bg-slate-50 rounded-xl border border-slate-100">Unit tidak ditemukan.</div>
                       ) : (
                         filteredUnits.map((u) => (
                           <button key={u.id} onClick={() => setSelectedUnit(u)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left outline-none ${selectedUnit?.id === u.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                             <span className={`text-[12px] font-bold ${selectedUnit?.id === u.id ? 'text-blue-700' : 'text-slate-700'}`}>{u.name}</span>
                             <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedUnit?.id === u.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                               {selectedUnit?.id === u.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                             </div>
                           </button>
                         ))
                       )}
                    </div>
                  </div>

                  {/* PILIHAN TINDAKAN & METODE */}
                  {selectedUnit && (
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 space-y-5">
                      
                      {/* TINDAKAN */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 ml-1">Pilihan Tindakan</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSelectedAction('Perawatan')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all outline-none ${selectedAction === 'Perawatan' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                <Wrench className={`w-5 h-5 mb-1.5 ${selectedAction === 'Perawatan' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className={`text-[11px] font-bold text-center leading-tight ${selectedAction === 'Perawatan' ? 'text-blue-700' : 'text-slate-600'}`}>Perawatan</span>
                            </button>
                            <button onClick={() => setSelectedAction('Perbaikan')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all outline-none ${selectedAction === 'Perbaikan' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                <Settings className={`w-5 h-5 mb-1.5 ${selectedAction === 'Perbaikan' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className={`text-[11px] font-bold text-center leading-tight ${selectedAction === 'Perbaikan' ? 'text-blue-700' : 'text-slate-600'}`}>Perbaikan</span>
                            </button>
                          </div>
                      </div>

                      {/* METODE PELAYANAN */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 ml-1">Metode Pelayanan</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSelectedMethod('Panggil Teknisi')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all outline-none ${selectedMethod === 'Panggil Teknisi' ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                <Truck className={`w-5 h-5 mb-1.5 ${selectedMethod === 'Panggil Teknisi' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-[11px] font-bold text-center leading-tight ${selectedMethod === 'Panggil Teknisi' ? 'text-indigo-700' : 'text-slate-600'}`}>Panggil Teknisi</span>
                            </button>
                            <button onClick={() => setSelectedMethod('Bawa Sendiri')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all outline-none ${selectedMethod === 'Bawa Sendiri' ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                <Home className={`w-5 h-5 mb-1.5 ${selectedMethod === 'Bawa Sendiri' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className={`text-[11px] font-bold text-center leading-tight ${selectedMethod === 'Bawa Sendiri' ? 'text-emerald-700' : 'text-slate-600'}`}>Bawa Sendiri</span>
                            </button>
                          </div>
                      </div>

                    </div>
                  )}

                  <div className="pt-2">
                    <button onClick={handleNextStep} disabled={!selectedUnit || !selectedAction || !selectedMethod} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-[13px] shadow-lg shadow-slate-900/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 outline-none">
                      Selanjutnya <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* === STEP 2: DATA PELANGGAN & RESERVASI TANGGAL === */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 pb-10">
                  
                  {/* AUTO GENERATED INFO */}
                  <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                     <h3 className="text-[12px] font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600"/> Data Diri & Lokasi
                     </h3>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Nama Lengkap</label>
                           <input type="text" readOnly value={custName} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-[16px] text-[12px] font-bold text-slate-500 outline-none cursor-not-allowed" />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">No. WhatsApp</label>
                           <input type="tel" readOnly value={custPhone} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-[16px] text-[12px] font-bold text-slate-500 outline-none cursor-not-allowed" />
                        </div>
                     </div>

                     {/* KONDISIONAL LOGIC LOKASI */}
                     {!isBawaSendiri ? (
                        <>
                           <div className="animate-in fade-in zoom-in-95 duration-300">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Wilayah Kecamatan</label>
                              <select value={custLocation} onChange={(e) => setCustLocation(e.target.value)} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-[16px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none cursor-pointer shadow-sm">
                                 <option value="Kota Cirebon - Kesambi">Kota Cirebon - Kesambi</option>
                                 <option value="Kota Cirebon - Kejaksan">Kota Cirebon - Kejaksan</option>
                                 <option value="Kota Cirebon - Harjamukti">Kota Cirebon - Harjamukti</option>
                                 <option value="Kota Cirebon - Lemahwungkuk">Kota Cirebon - Lemahwungkuk</option>
                                 <option value="Kota Cirebon - Pekalipan">Kota Cirebon - Pekalipan</option>
                                 <option value="Kabupaten Cirebon - Kedawung">Kab. Cirebon - Kedawung</option>
                                 <option value="Kabupaten Cirebon - Sumber">Kab. Cirebon - Sumber</option>
                                 <option value="Kabupaten Cirebon - Gunung Jati">Kab. Cirebon - Gunung Jati</option>
                              </select>
                           </div>

                           <div className="animate-in fade-in zoom-in-95 duration-300">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Alamat Lengkap & Patokan</label>
                              <textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="Tuliskan jalan, nomor rumah, dan patokan..." rows={2} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-[16px] text-[12px] font-medium outline-none resize-none focus:border-blue-500 shadow-sm" />
                           </div>
                        </>
                     ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-[16px] p-4 flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                           <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-emerald-600" />
                              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Lokasi Workshop (Bengkel)</span>
                           </div>
                           <p className="text-[12px] font-medium text-emerald-900 leading-relaxed pl-1">
                              <strong>OMEANFIX Workshop Cirebon</strong><br/>
                              Jl. Perjuangan No. 10 (Samping Alfamart), Kesambi, Kota Cirebon, Jawa Barat 45131.
                           </p>
                           <a href="https://maps.google.com/?q=Cirebon" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-3 py-2.5 rounded-[12px] text-[11px] font-bold shadow-sm shadow-emerald-600/20 active:scale-95 transition-transform text-center outline-none">
                              <MapPin className="w-3.5 h-3.5" /> Buka Lokasi di Google Maps
                           </a>
                        </div>
                     )}
                  </div>

                  {/* CUSTOM CALENDAR UI */}
                  <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                     <h3 className="text-[12px] font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600"/> Jadwal Kedatangan
                     </h3>
                     
                     <div>
                        <div className="flex justify-between items-center mb-2.5">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pilih Tanggal</label>
                           <div className="flex gap-2">
                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Tersedia</span>
                              <span className="flex items-center gap-1 text-[9px] font-bold text-rose-400"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Penuh</span>
                           </div>
                        </div>

                        {/* HORIZONTAL DATE PILLS */}
                        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                           {calendarDays.map((item, idx) => (
                              <button
                                 key={idx}
                                 type="button"
                                 disabled={item.isFull}
                                 onClick={() => setReserveDate(item.fullDate)}
                                 className={`flex-none w-[65px] h-[75px] rounded-[18px] border flex flex-col items-center justify-center gap-1 transition-all outline-none 
                                    ${item.isFull 
                                       ? 'bg-rose-50 border-rose-100 opacity-60 cursor-not-allowed' 
                                       : reserveDate === item.fullDate 
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30 transform scale-105' 
                                          : 'bg-white border-slate-200 hover:border-emerald-300'
                                    }`}
                              >
                                 <span className={`text-[11px] font-bold uppercase tracking-wider ${item.isFull ? 'text-rose-400' : reserveDate === item.fullDate ? 'text-emerald-100' : 'text-slate-400'}`}>{item.dayName}</span>
                                 <span className={`text-[20px] font-black leading-none ${item.isFull ? 'text-rose-500' : reserveDate === item.fullDate ? 'text-white' : 'text-slate-700'}`}>{item.dayNum}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="pt-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Pilih Slot Waktu</label>
                        <select 
                          value={timeSlot} 
                          onChange={(e) => setTimeSlot(e.target.value)} 
                          className="w-full bg-white border border-slate-200 px-4 py-3.5 rounded-[16px] text-[12px] font-bold text-slate-700 outline-none focus:border-emerald-500 appearance-none cursor-pointer shadow-sm"
                        >
                           <option value="" disabled>-- Pilih Slot Waktu --</option>
                           <option value="Pagi (09:00 - 12:00)">Pagi (09:00 - 12:00)</option>
                           <option value="Siang (13:00 - 15:00)">Siang (13:00 - 15:00)</option>
                           <option value="Sore (15:00 - 17:00)">Sore (15:00 - 17:00)</option>
                           <option value="Malam (Sesuai Konfirmasi)">Malam / Darurat</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button onClick={handlePrevStep} className="px-5 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl active:scale-95 transition-transform outline-none shadow-sm">
                      Kembali
                    </button>
                    {/* Logika Validasi Aman untuk Tombol Selanjutnya */}
                    <button onClick={handleNextStep} disabled={(!isBawaSendiri && !custAddress) || !reserveDate || !timeSlot} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl text-[13px] shadow-lg shadow-slate-900/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 outline-none">
                      Selanjutnya <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* === STEP 3: KELUHAN & FOTO === */}
              {step === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 pb-10">
                  <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                     <h3 className="text-[12px] font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600"/> Detail Keluhan
                     </h3>
                     
                     <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Jelaskan Masalah</label>
                        <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="AC kurang dingin, mesin cuci mati total..." rows={3} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-[16px] text-[12px] font-medium outline-none resize-none focus:border-blue-500 focus:bg-white" />
                     </div>

                     {/* UNGGAH FOTO KERUSAKAN */}
                     <div className="mt-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1 flex items-center gap-1"><Camera className="w-3 h-3"/> Lampiran Foto (Opsional)</label>
                        
                        {!attachmentBase64 ? (
                            <div className="w-full relative group">
                                <input 
                                    type="file" 
                                    id="damage-upload" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                />
                                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[16px] py-6 flex flex-col items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:border-blue-300 transition-colors">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-blue-500"><Camera className="w-6 h-6" /></div>
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600">Ketuk untuk unggah foto unit/kerusakan</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-40 bg-slate-100 rounded-[16px] border border-slate-200 overflow-hidden shadow-sm animate-in zoom-in-95">
                                <img src={attachmentBase64} alt="Pratinjau Kerusakan" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                                   <span className="text-white text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400"/> Terlampir</span>
                                </div>
                                <button type="button" onClick={handleCancelImage} className="absolute top-3 right-3 p-1.5 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 active:scale-95 transition-transform"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                     </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-[20px] p-4 flex gap-3">
                     <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                     <p className="text-[11px] text-blue-800 leading-relaxed font-medium">Pastikan semua data sudah benar. Teknisi kami akan menyiapkan peralatan berdasarkan keluhan dan foto yang Anda lampirkan.</p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button onClick={handlePrevStep} className="px-5 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl active:scale-95 transition-transform outline-none shadow-sm">
                      Kembali
                    </button>
                    <button onClick={handleSubmit} disabled={!complaint || isSubmitting} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl text-[13px] shadow-lg shadow-blue-600/30 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 outline-none">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Kirim Pesanan</span>}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}