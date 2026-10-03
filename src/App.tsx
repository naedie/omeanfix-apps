import React, { useState, useEffect, useRef } from 'react';
import { 
   ChevronRight, ChevronLeft, Settings, HelpCircle, AlertCircle, 
   Wind, Car, ShieldCheck, CheckCircle2, X, FileText, User, 
   Bell, Wrench, Package, Database, ArrowRight, LogOut, 
   ExternalLink, Sparkles, Search, Snowflake, Tv, Ticket, Home,
  Truck, Zap, Smartphone, Award, Loader2, QrCode, History, Plus, Lock, Mail, Phone, Camera, XCircle, Calendar, Image as ImageIcon, MapPin, Clock, CreditCard,
  Sun, Moon
} from 'lucide-react';
import { supabase } from './supabase';
import BookingModal from './components/BookingModal';
import InternalPortal from './components/InternalPortal';
import SparepartTab from './components/SparepartTab';
import TrackerMockup from './components/TrackerMockup'; // <-- IMPORT TRACKER BARU
import { useTheme } from './context/ThemeContext';
import { triggerRipple } from './utils/ripple';
import { 
  sendLocalPushNotification, 
  requestNotificationPermission, 
  playNotificationSound,
  OrderNotificationPayload 
} from './utils/notifications';

const BANNERS_FALLBACK = [
  { 
    id: 1, 
    label: 'INFO LAYANAN', 
    title: 'Layanan 24 Jam', 
    description: 'Kini OMEANFIX siap sedia kapanpun', 
    btn_text: 'Pesan Teknisi',
    bg_url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop'
  }
];

export default function App() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'beranda' | 'pesanan' | 'sparepart' | 'riwayat' | 'profil'>('beranda');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  
  // STATE JEMBATAN: Menyimpan data suku cadang dari Beranda untuk dikirim ke SparepartTab
  const [preSelectedPart, setPreSelectedPart] = useState<any | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [specialCatalogs, setSpecialCatalogs] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [serviceUnits, setServiceUnits] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]); 
  const [claimedVouchers, setClaimedVouchers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // NOTIFIKASI LOKAL (LOCAL PUSH & PERSISTENT TOAST)
  const [persistentNotif, setPersistentNotif] = useState<OrderNotificationPayload | null>(null);
  const [notifHistory, setNotifHistory] = useState<OrderNotificationPayload[]>(() => {
    try {
      const saved = sessionStorage.getItem('omeanfix_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const persistentTimerRef = useRef<any>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('omeanfix_notifs', JSON.stringify(notifHistory));
    } catch (_) {}
  }, [notifHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const dispatchOrderNotification = (
    orderCode: string,
    title: string,
    message: string,
    statusType: 'baru' | 'proses' | 'jadwal' | 'pembayaran' | 'selesai' | 'batal' | 'info',
    orderId?: string
  ) => {
    const payload: OrderNotificationPayload = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderId,
      orderCode,
      title,
      message,
      statusType,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    // 1. Trigger Local Web Notification API & Sound Chime
    sendLocalPushNotification(title, {
      body: message,
      tag: `order-${orderCode}`
    });

    // 2. Set Rich Persistent In-App Notification (12 detik atau hingga ditutup pelanggan)
    if (persistentTimerRef.current) {
      clearTimeout(persistentTimerRef.current);
    }
    setPersistentNotif(payload);
    persistentTimerRef.current = setTimeout(() => {
      setPersistentNotif(null);
    }, 12000);

    // 3. Tambahkan ke riwayat notifikasi
    setNotifHistory((prev) => [payload, ...prev.slice(0, 19)]);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [selectedSpecialService, setSelectedSpecialService] = useState<any | null>(null);
  const [memStep, setMemStep] = useState<'detail' | 'form' | 'success'>('detail');
  const [memName, setMemName] = useState('');
  const [memPhone, setMemPhone] = useState('');
  const [memKecamatan, setMemKecamatan] = useState('Kota Cirebon - Kesambi');
  const [memAddress, setMemAddress] = useState('');
  const [memDuration, setMemDuration] = useState('1_bulan');
  const [memSchedule, setMemSchedule] = useState('');
  const [memNotes, setMemNotes] = useState('');
  const [isSubmittingMem, setIsSubmittingMem] = useState(false);

  const [profileStep, setProfileStep] = useState<'main' | 'edit_profile' | 'edit_password'>('main');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [profName, setProfName] = useState('Pelanggan Setia');
  const [profPhone, setProfPhone] = useState('0812-3456-7890');
  const [profEmail, setProfEmail] = useState('pelanggan@omeanfix.com');
  const [profAvatar, setProfAvatar] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const specialScrollRef = useRef<HTMLDivElement>(null);
  const voucherScrollRef = useRef<HTMLDivElement>(null); 

  const handleScrollSpecialCards = () => {
    if (specialScrollRef.current) {
      const { scrollLeft, clientWidth } = specialScrollRef.current;
      specialScrollRef.current.scrollTo({ left: scrollLeft + clientWidth * 0.75, behavior: 'smooth' });
    }
  };

  const handleScrollVouchers = () => {
    if (voucherScrollRef.current) {
      const { scrollLeft, clientWidth } = voucherScrollRef.current;
      voucherScrollRef.current.scrollTo({ left: scrollLeft + clientWidth * 0.75, behavior: 'smooth' });
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resCat, resBanner, resSpc, resParts, resUnits, resVouchers, resProfile] = await Promise.all([
        supabase.from('service_categories').select('*').order('id', { ascending: true }),
        supabase.from('banners').select('*').order('id', { ascending: false }),
        supabase.from('special_services_catalog').select('*').eq('is_active', true).order('id', { ascending: true }),
        supabase.from('spare_parts').select('*').order('id', { ascending: false }),
        supabase.from('services').select('*'),
        supabase.from('vouchers_promos').select('*').eq('is_active', true).order('id', { ascending: false }),
        supabase.from('customers').select('*').limit(1).maybeSingle()
      ]);

      if (resCat.data) setCategories(resCat.data);
      if (resBanner.data) setBanners(resBanner.data);
      if (resSpc.data) setSpecialCatalogs(resSpc.data);
      if (resParts.data) setSpareParts(resParts.data);
      if (resUnits.data) setServiceUnits(resUnits.data);
      if (resVouchers.data) setVouchers(resVouchers.data);
      
      if (resProfile.data) {
        setCustomerId(resProfile.data.id);
        setProfName(resProfile.data.full_name || 'Pelanggan Setia');
        setProfPhone(resProfile.data.phone_number || '0812-3456-7890');
        setProfEmail(resProfile.data.email || 'pelanggan@omeanfix.com');
        setProfAvatar(resProfile.data.avatar_url || null);
      } else {
        const { data: newCust } = await supabase.from('customers').insert([{
          full_name: 'Pelanggan Setia',
          phone_number: '0812-3456-7890',
          email: 'pelanggan@omeanfix.com'
        }]).select().single();
        if (newCust) setCustomerId(newCust.id);
      }

    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // SUPABASE REALTIME LISTENER FOR INSTANT STATUS UPDATE
    const channel = supabase
      .channel('public-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchInitialData();
        if (payload.eventType === 'UPDATE' && payload.new) {
          const oldSt = (payload.old?.status || payload.old?.order_status || '').toLowerCase();
          const newSt = (payload.new.status || payload.new.order_status || '').toLowerCase();
          const newPSt = (payload.new.payment_status || '').toLowerCase();
          const ordCode = payload.new.order_code || (payload.new.id ? String(payload.new.id).slice(0, 8) : 'ORD');
          const ordId = payload.new.id;

          if (newPSt === 'lunas' || newSt === 'selesai') {
            dispatchOrderNotification(
              ordCode,
              '🎉 Pembayaran Terverifikasi & Lunas!',
              `Pesanan #${ordCode} telah selesai ditangani teknisi dan pembayaran terverifikasi.`,
              'selesai',
              ordId
            );
          } else if (newSt.includes('pembayaran') || newSt === 'menunggu_pembayaran') {
            dispatchOrderNotification(
              ordCode,
              '💳 Tagihan Servis Diterbitkan',
              `Teknisi telah menyelesaikan tindakan untuk pesanan #${ordCode}. Rincian invoice sudah tersedia.`,
              'pembayaran',
              ordId
            );
          } else if (newSt.includes('jadwal') || newSt === 'dijadwalkan') {
            const raw = payload.new.note || '';
            const schedMatch = raw.match(/\[JADWAL:\s*([^\]]+)\]/);
            const schedDetail = schedMatch ? ` (${schedMatch[1]})` : '';
            dispatchOrderNotification(
              ordCode,
              '📅 Jadwal Teknisi Dikonfirmasi',
              `Pesanan #${ordCode} telah dijadwalkan oleh teknisi${schedDetail}. Harap bersiap di lokasi.`,
              'jadwal',
              ordId
            );
          } else if (newSt.includes('ditangani') || newSt.includes('proses') || newSt.includes('dalam_pengerjaan')) {
            dispatchOrderNotification(
              ordCode,
              '🔧 Teknisi Sedang Menangani',
              `Pesanan #${ordCode} saat ini sedang dalam proses pengerjaan dan servis oleh teknisi.`,
              'proses',
              ordId
            );
          } else if (newSt.includes('batal') || newSt === 'dibatalkan') {
            dispatchOrderNotification(
              ordCode,
              '❌ Status Pesanan Dibatalkan',
              `Pesanan #${ordCode} telah dibatalkan.`,
              'batal',
              ordId
            );
          } else if (newSt !== oldSt && newSt) {
            dispatchOrderNotification(
              ordCode,
              '📋 Pembaruan Status Pesanan',
              `Status pesanan #${ordCode} diubah menjadi "${payload.new.status || newSt}".`,
              'info',
              ordId
            );
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCategoryClick = (category: any) => {
    setSelectedCategory(category);
    setIsBookingOpen(true);
  };

  const renderCategoryIcon = (iconValue: string) => {
    if (iconValue && iconValue.startsWith('http')) {
      return <img src={iconValue} alt="kategori" className="w-full h-full object-contain outline-none border-none" onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/128/4151/4151151.png'; }} />;
    }
    const name = (iconValue || '').toLowerCase();
    const fallbackClass = "w-8 h-8 text-slate-400";
    if (name.includes('alat') || name.includes('berat')) return <Truck className={fallbackClass} />;
    if (name.includes('elek')) return <Zap className={fallbackClass} />;
    if (name.includes('gadget') || name.includes('phone') || name.includes('laptop')) return <Smartphone className={fallbackClass} />;
    if (name.includes('oto') || name.includes('mobil') || name.includes('motor')) return <Car className={fallbackClass} />;
    if (name.includes('pendingin') || name.includes('ac') || name.includes('kulkas')) return <Snowflake className={fallbackClass} />;
    return <Wrench className={fallbackClass} />;
  };

  const renderSpecialIcon = (name: string, className: string) => {
    if (name === 'Wind') return <Wind className={className} />;
    if (name === 'Car') return <Car className={className} />;
    if (name === 'ShieldCheck') return <ShieldCheck className={className} />;
    if (name === 'Wrench') return <Wrench className={className} />;
    if (name === 'Snowflake') return <Snowflake className={className} />;
    if (name === 'Truck') return <Truck className={className} />;
    if (name === 'Zap') return <Zap className={className} />;
    if (name === 'Smartphone') return <Smartphone className={className} />;
    return <Award className={className} />;
  };

  const getGradientTheme = (bgClass: string) => {
    if (bgClass?.includes('indigo') || bgClass?.includes('purple')) return { gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white', textCategory: 'text-white/80', textTitle: 'text-white', textDesc: 'text-white/90', iconBg: 'bg-white/20 backdrop-blur-md text-white border border-white/30' };
    if (bgClass?.includes('emerald') || bgClass?.includes('teal')) return { gradient: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white', textCategory: 'text-white/80', textTitle: 'text-white', textDesc: 'text-white/90', iconBg: 'bg-white/20 backdrop-blur-md text-white border border-white/30' };
    if (bgClass?.includes('rose') || bgClass?.includes('red')) return { gradient: 'bg-gradient-to-br from-rose-400 via-red-500 to-amber-500 text-white', textCategory: 'text-white/80', textTitle: 'text-white', textDesc: 'text-white/90', iconBg: 'bg-white/20 backdrop-blur-md text-white border border-white/30' };
    return { gradient: 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white', textCategory: 'text-white/85', textTitle: 'text-white', textDesc: 'text-white/90', iconBg: 'bg-white/20 backdrop-blur-md text-white border border-white/30' };
  };

  const getVoucherTheme = (theme: string) => {
    if (theme === 'rose') return { border: 'border-rose-200 dark:border-rose-900/60', bgIcon: 'bg-rose-50 dark:bg-rose-950/60', textIcon: 'text-rose-500 dark:text-rose-400', textCat: 'text-rose-600 dark:text-rose-400' };
    if (theme === 'amber') return { border: 'border-amber-200 dark:border-amber-900/60', bgIcon: 'bg-amber-50 dark:bg-amber-950/60', textIcon: 'text-amber-500 dark:text-amber-400', textCat: 'text-amber-600 dark:text-amber-400' };
    if (theme === 'indigo') return { border: 'border-indigo-200 dark:border-indigo-900/60', bgIcon: 'bg-indigo-50 dark:bg-indigo-950/60', textIcon: 'text-indigo-500 dark:text-indigo-400', textCat: 'text-indigo-600 dark:text-indigo-400' };
    if (theme === 'teal') return { border: 'border-teal-200 dark:border-teal-900/60', bgIcon: 'bg-teal-50 dark:bg-teal-950/60', textIcon: 'text-teal-500 dark:text-teal-400', textCat: 'text-teal-600 dark:text-teal-400' };
    return { border: 'border-slate-200 dark:border-slate-800', bgIcon: 'bg-slate-50 dark:bg-slate-800', textIcon: 'text-slate-500 dark:text-slate-400', textCat: 'text-slate-600 dark:text-slate-400' };
  };

  const handleClaimVoucher = (voucher: any) => {
    if (!claimedVouchers.includes(voucher.id)) {
      setClaimedVouchers((prev) => [...prev, voucher.id]);
      if (voucher.code) {
        navigator.clipboard.writeText(voucher.code);
        alert(`  Voucher berhasil diklaim!\n\nKode promo [ ${voucher.code} ] telah otomatis disalin ke perangkat Anda. Silakan gunakan kode ini saat mengonfirmasi pembayaran servis.`);
      } else {
        alert(`  Voucher berhasil diklaim!\n\nPromo "${voucher.title}" akan otomatis diterapkan pada pesanan servis Anda berikutnya.`);
      }
    }
  };

  const handleSubmitMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialService) return;
    setIsSubmittingMem(true);
    try {
      const payload = {
        special_service_id: selectedSpecialService.id, custom_service_title: selectedSpecialService.title,
        customer_name: memName, customer_phone: memPhone, customer_kecamatan: memKecamatan,
        customer_address: memAddress, duration: memDuration, preferred_schedule: memSchedule || 'Sesuai kesepakatan',
        notes: memNotes || '-', status: 'menunggu_konfirmasi'
      };
      const { error } = await supabase.from('special_service_subscriptions').insert([payload]);
      if (error) throw error;
      setMemStep('success');
      setTimeout(() => { setSelectedSpecialService(null); setMemStep('detail'); }, 3000);
    } catch (err: any) { alert('Gagal mengirim pendaftaran: ' + err.message); } finally { setIsSubmittingMem(false); }
  };

  const HomeContent = () => {
    const bannerRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const displayBanners = banners.length > 0 ? banners : BANNERS_FALLBACK;
    const [catPage, setCatPage] = useState(0);
    const ITEMS_PER_PAGE = 5; 
    const totalCatPages = Math.ceil(categories.length / ITEMS_PER_PAGE) || 1;
    const paginatedCategories = categories.slice(catPage * ITEMS_PER_PAGE, (catPage + 1) * ITEMS_PER_PAGE);

    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [partCurrentPage, setPartCurrentPage] = useState(0);
    const PARTS_PER_PAGE = 4;

    const handleNextCategoryPage = () => setCatPage((prev) => (prev + 1) % totalCatPages);

    const nextBanner = () => {
      if (bannerRef.current) {
        const nextIndex = (currentSlide + 1) % displayBanners.length;
        bannerRef.current.scrollTo({ left: nextIndex * bannerRef.current.clientWidth, behavior: 'smooth' });
        setCurrentSlide(nextIndex);
      }
    };

    const prevBanner = () => {
      if (bannerRef.current) {
        const prevIndex = currentSlide === 0 ? displayBanners.length - 1 : currentSlide - 1;
        bannerRef.current.scrollTo({ left: prevIndex * bannerRef.current.clientWidth, behavior: 'smooth' });
        setCurrentSlide(prevIndex);
      }
    };

    useEffect(() => {
      if (displayBanners.length <= 1) return;
      const timer = setInterval(() => { nextBanner(); }, 3000);
      return () => clearInterval(timer);
    }, [currentSlide, displayBanners.length]);

    const handleBannerScroll = () => {
      if (bannerRef.current) {
        const newSlide = Math.round(bannerRef.current.scrollLeft / bannerRef.current.clientWidth);
        if (newSlide !== currentSlide) setCurrentSlide(newSlide);
      }
    };

    const filteredParts = spareParts.filter(part => {
        if (!partSearchQuery) return true;
        const q = partSearchQuery.toLowerCase();
        const parentCat = categories.find(c => String(c.id).toLowerCase() === String(part.category_id).toLowerCase());
        const parentUnit = serviceUnits.find(u => String(u.id).toLowerCase() === String(part.unit_id).toLowerCase());
        
        const catName = (parentCat ? parentCat.name : 'UMUM').toLowerCase();
        const unitName = (parentUnit ? parentUnit.name : 'MULTI-UNIT').toLowerCase();
        const partName = (part.name || '').toLowerCase();

        return partName.includes(q) || catName.includes(q) || unitName.includes(q);
    });

    useEffect(() => {
        setPartCurrentPage(0);
    }, [partSearchQuery]);

    const totalPartPages = Math.ceil(filteredParts.length / PARTS_PER_PAGE) || 1;
    const displayedParts = filteredParts.slice(partCurrentPage * PARTS_PER_PAGE, (partCurrentPage + 1) * PARTS_PER_PAGE);

    return (
      <div className="space-y-8 animate-in fade-in bg-[#F8F9FA] dark:bg-[#0B0F19] min-h-screen px-5 pt-2 pb-[120px] transition-colors">
        <div className="mt-1 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Kilas Info & Promo</h3>
            <div className="flex gap-1.5 z-10">
              <button onClick={prevBanner} className="p-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors outline-none active:scale-90"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextBanner} className="p-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors outline-none active:scale-90"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div ref={bannerRef} onScroll={handleBannerScroll} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 scroll-smooth">
            {displayBanners.map((banner) => (
              <div key={banner.id} className="flex-none w-full snap-center rounded-[24px] text-white shadow-sm relative overflow-hidden h-[180px]">
                <img src={banner.bg_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent"></div>
                <div className="relative z-10 flex flex-col h-full justify-center w-[85%] px-6 py-4">
                  <span className="self-start px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest uppercase mb-3 inline-block">{banner.label || 'INFO LAYANAN'}</span>
                  <h2 className="text-[22px] font-bold tracking-tight mb-1 leading-snug text-white drop-shadow-sm">{banner.title}</h2>
                  <p className="text-[12px] text-white/90 font-medium mb-4 line-clamp-1">{banner.description}</p>
                  <button 
                    onClick={(e) => { 
                      triggerRipple(e); 
                      if (categories.length > 0) handleCategoryClick(categories[0]); 
                      else setIsBookingOpen(true); 
                    }} 
                    className="ripple-btn self-start bg-white text-slate-900 px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-sm transition-transform active:scale-95 inline-block outline-none"
                  >
                    {banner.btn_text || 'Pesan Teknisi'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-4">
            {displayBanners.map((_, idx) => (
              <div key={idx} onClick={() => { if (bannerRef.current) { bannerRef.current.scrollTo({ left: idx * bannerRef.current.clientWidth, behavior: 'smooth' }); setCurrentSlide(idx); } }} className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'}`} />
            ))}
          </div>
        </div>

        <div className="min-h-[100px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Kategori Layanan</h3>
            {categories.length > ITEMS_PER_PAGE && (
              <button onClick={handleNextCategoryPage} className="text-[12px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer outline-none active:scale-95 transition-transform hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1">
                Lihat Semua <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                  <div className="w-[50px] h-[50px] bg-slate-200 dark:bg-slate-800 rounded-[14px]"></div>
                  <div className="w-10 h-2 bg-slate-200 dark:bg-slate-800 rounded-md mt-1"></div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">Belum ada kategori layanan.</div>
          ) : (
            <div className="grid grid-cols-5 gap-y-4 gap-x-2 animate-in fade-in slide-in-from-right-4 duration-300" key={catPage}>
              {paginatedCategories.map((cat) => (
                <button key={cat.id} onClick={() => handleCategoryClick(cat)} className="flex flex-col items-center gap-1.5 transition-transform active:scale-90 outline-none">
                  <div className="w-[50px] h-[50px] flex items-center justify-center bg-transparent outline-none border-none">{renderCategoryIcon(cat.icon)}</div>
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight line-clamp-1 mt-0.5">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Layanan Khusus</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">(Perawatan Rutin & Membership)</p>
            </div>
            <button onClick={handleScrollSpecialCards} className="text-[12px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer mb-1 outline-none active:scale-95 transition-transform hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5">Lihat Semua <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          
          <div ref={specialScrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 gap-4 -mx-5 px-5 scroll-smooth">
            {specialCatalogs.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 w-full">Belum ada layanan khusus dari admin.</div>
            ) : (
              specialCatalogs.map((service) => {
                const theme = getGradientTheme(service.bg_class);
                return (
                  <button key={service.id} onClick={() => { setSelectedSpecialService(service); setMemStep('detail'); }} className={`flex-none w-[82%] snap-center p-4 rounded-[22px] ${theme.gradient} transition-transform active:scale-95 text-left flex flex-col justify-between h-[145px] outline-none shadow-lg shadow-blue-500/10`}>
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${theme.iconBg} shadow-sm shrink-0`}>{renderSpecialIcon(service.icon_name, "w-5 h-5 text-white")}</div>
                      <div className="min-w-0">
                        <span className={`text-[8px] font-extrabold tracking-widest uppercase ${theme.textCategory} block mb-0.5`}>{service.category}</span>
                        <span className={`text-[14px] font-bold ${theme.textTitle} leading-snug line-clamp-1 drop-shadow-xs`}>{service.title}</span>
                      </div>
                    </div>
                    <p className={`text-[11px] ${theme.textDesc} line-clamp-1 font-medium px-1`}>{service.description || 'Solusi perawatan profesional dan terpercaya.'}</p>
                    <div className="self-start bg-white/95 backdrop-blur-xs text-slate-900 text-[10px] font-extrabold px-3.5 py-1.5 rounded-full shadow-xs flex items-center gap-1 active:scale-95 transition-transform">
                      <span>Lihat Detail</span><ChevronRight className="w-3 h-3 text-slate-900" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Voucher & Promo</h3>
            <button onClick={handleScrollVouchers} className="text-[12px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer outline-none active:scale-95 transition-transform flex items-center gap-0.5">Lihat Semua <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          
          <div ref={voucherScrollRef} className="flex overflow-x-auto snap-x scrollbar-hide gap-4 -mx-5 px-5 pb-2 scroll-smooth">
            {vouchers.length === 0 ? (
               <div className="w-full text-center py-6 border border-slate-100 dark:border-slate-800 rounded-[24px] bg-white dark:bg-slate-900 shadow-sm snap-center"><p className="text-[12px] font-medium text-slate-400">Belum ada promo aktif saat ini.</p></div>
            ) : (
              vouchers.map((v) => {
                const theme = getVoucherTheme(v.theme_color);
                const isClaimed = claimedVouchers.includes(v.id);
                return (
                  <div key={v.id} className={`snap-center shrink-0 w-[85%] min-w-[280px] bg-white dark:bg-slate-900 border ${theme.border} rounded-[24px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden transition-colors`}>
                    <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FA] dark:bg-[#0B0F19] rounded-full border-r ${theme.border} z-0`}></div>
                    <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FA] dark:bg-[#0B0F19] rounded-full border-l ${theme.border} z-0`}></div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${theme.bgIcon} ${theme.textIcon} ml-1 z-10`}><Ticket className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0 z-10">
                      <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${theme.textCat}`}>{v.category}</p>
                      <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate">{v.title}</h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-400 mt-1 leading-tight line-clamp-2">{v.description}</p>
                    </div>
                    <button 
                      onClick={(e) => { triggerRipple(e); handleClaimVoucher(v); }} 
                      disabled={isClaimed} 
                      className={`ripple-btn px-4 py-2 rounded-full text-[11px] font-bold shrink-0 z-10 mr-1 outline-none transition-all ${isClaimed ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700' : 'bg-slate-900 dark:bg-blue-600 text-white shadow-md hover:bg-slate-800 dark:hover:bg-blue-500 active:scale-95'}`}
                    >
                      {isClaimed ? <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Diklaim</span> : 'Klaim'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="animate-in fade-in">
          <div className="flex justify-between items-end mb-3.5">
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Pusat Suku Cadang</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Pesan part original & bergaransi</p>
            </div>
            <button onClick={() => setActiveTab('sparepart')} className="text-[12px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer mb-1 outline-none active:scale-95 transition-transform flex items-center gap-0.5">Lihat Semua <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>

          <div className="relative mb-4">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
             </div>
             <input
               type="text"
               placeholder="Cari spare part, unit motor/mobil, ac..."
               value={partSearchQuery}
               onChange={(e) => setPartSearchQuery(e.target.value)}
               className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pl-9 pr-4 py-3 rounded-[14px] text-[12px] font-medium outline-none focus:border-blue-500 transition-colors shadow-sm"
             />
          </div>

          {spareParts.length === 0 ? (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shadow-sm">Belum ada suku cadang terdaftar.</div>
          ) : displayedParts.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-[24px] text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
               <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
               <span className="font-bold text-slate-700 dark:text-slate-200">Suku cadang tidak ditemukan</span>
               <span className="text-[10px] mt-1 text-slate-400">Coba kata kunci lain atau lihat semua produk.</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="grid grid-cols-2 gap-3">
                {displayedParts.map((part) => {
                  const parentCat = categories.find(c => String(c.id).toLowerCase() === String(part.category_id).toLowerCase());
                  const parentUnit = serviceUnits.find(u => String(u.id).toLowerCase() === String(part.unit_id).toLowerCase());
                  const catName = parentCat ? parentCat.name : 'UMUM';
                  
                  return (
                    <div 
                       key={part.id} 
                       onClick={() => {
                        setPreSelectedPart(part);
                        setActiveTab('sparepart');
                      }} 
                       className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between cursor-pointer transition-all active:scale-95 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-300 dark:hover:border-slate-700 group relative"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-50 dark:border-slate-700/50 relative p-2">
                        <img src={part.image_url || 'https://cdn-icons-png.flaticon.com/128/683/683100.png'} alt={part.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[8px] font-extrabold uppercase rounded-md inline-block mb-1.5 truncate max-w-[80%]">
                           {catName}
                        </span>
                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 min-h-[36px] pr-2">{part.name}</h4>
                        <div className="flex items-center justify-between mt-1.5">
                           <p className="text-[13.5px] font-black text-blue-600 dark:text-blue-400">Rp {part.price?.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-3 right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-colors group-hover:bg-blue-700">
                         <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {totalPartPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-5">
                  <button
                    onClick={() => setPartCurrentPage(p => Math.max(0, p - 1))}
                    disabled={partCurrentPage === 0}
                    className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:bg-slate-50 dark:disabled:bg-slate-900 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    Halaman {partCurrentPage + 1} dari {totalPartPages}
                  </span>
                  <button
                    onClick={() => setPartCurrentPage(p => Math.min(totalPartPages - 1, p + 1))}
                    disabled={partCurrentPage === totalPartPages - 1}
                    className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:bg-slate-50 dark:disabled:bg-slate-900 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrdersView = ({ isHistory }: { isHistory: boolean }) => {
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    
    const [showInvoiceModal, setShowInvoiceModal] = useState<any | null>(null); 
    const [viewReceiptModal, setViewReceiptModal] = useState<string | null>(null);
    
    // STATE UNTUK TRACKER MODAL
    const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
    
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // STATE SEGMENTED CONTROL: Kini menggunakan 3 Tab (Baru, Diproses, Tagihan)
    const [subTab, setSubTab] = useState<'baru' | 'diproses' | 'tagihan'>('baru');
    
    const [subTabHistory, setSubTabHistory] = useState<'selesai' | 'dibatalkan'>('selesai');
    const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);

    // STATE ALASAN BATAL
    const [cancelReason, setCancelReason] = useState<string>('');

    const fetchMyOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setMyOrders(data);
      } catch (err) {
        console.error("Gagal memuat pesanan:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    useEffect(() => {
      fetchMyOrders();
    }, [isHistory]);

    // FUNGSI UPDATE PEMBATALAN BESERTA ALASAN
    const handleCancelOrder = async (orderId: string, currentNote: string) => {
        if (!cancelReason) {
            alert('Silakan pilih alasan pembatalan terlebih dahulu.');
            return;
        }
        
        try {
           const reasonTag = `[ALASAN_BATAL:${cancelReason}]`;
           let cleanNote = (currentNote || '').replace(/\[ALASAN_BATAL:[^\]]+\]/g, '').trim();
           const newNote = cleanNote ? `${cleanNote} \n${reasonTag}` : reasonTag;
           
           const { error } = await supabase.from('orders').update({
              status: 'Dibatalkan',
              note: newNote
           }).eq('id', orderId);
           
           if(error) throw error;
           alert('Pesanan berhasil dibatalkan beserta rekam alasannya.');
           
           setConfirmingCancelId(null);
           setCancelReason('');
           fetchMyOrders();
        } catch (err: any) {
           alert('Gagal membatalkan pesanan: ' + err.message);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFiles(prev => ({ ...prev, [orderId]: e.target.files![0] }));
        }
    };

    const handleUploadReceipt = (orderId: string, currentNote: string) => {
        const file = selectedFiles[orderId];
        if (!file) return;

        setUploadingId(orderId);
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const base64Str = canvas.toDataURL('image/webp', 0.7);
                
                try {
                    let cleanNote = (currentNote || '').replace(/\[PAYMENT_PROOF:[^\]]+\]/g, '').trim();
                    const newNote = cleanNote ? `${cleanNote} [PAYMENT_PROOF:${base64Str}]` : `[PAYMENT_PROOF:${base64Str}]`;

                    const { error } = await supabase.from('orders').update({
                        note: newNote,
                        payment_status: 'menunggu_verifikasi'
                    }).eq('id', orderId);
                    
                    if (error) throw error;
                    
                    // REAL-TIME STATE UPDATE
                    setMyOrders(prev => prev.map(o => {
                      if (o.id === orderId) {
                        return { ...o, note: newNote, payment_status: 'menunggu_verifikasi' };
                      }
                      return o;
                    }));

                    showToast('✅ Konfirmasi pembayaran terkirim! Status: Menunggu Verifikasi', 'info');
                    
                    setSelectedFiles(prev => {
                        const ns = {...prev};
                        delete ns[orderId];
                        return ns;
                    });

                    fetchMyOrders();
                } catch (err: any) {
                    alert('Gagal unggah: ' + err.message);
                } finally {
                    setUploadingId(null);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // LOGIKA PENYARINGAN SUPER AMAN DENGAN 3 TAB
    const filteredOrders = myOrders.filter(o => {
      let currentStatus = (o.status || o.order_status || '').toLowerCase();
      if (currentStatus === 'selesai ditangani') currentStatus = 'ditangani';
      
      if (isHistory) {
         const isSelesai = ['selesai'].includes(currentStatus);
         const isBatal = ['dibatalkan'].includes(currentStatus);
         if (subTabHistory === 'selesai') return isSelesai;
         if (subTabHistory === 'dibatalkan') return isBatal;
         return false;
      } else {
         const isBaru = ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima'].includes(currentStatus);
         const isDiproses = ['berjalan', 'ditangani', 'dijadwalkan', 'dalam_pengerjaan'].includes(currentStatus);
         const isTagihan = ['menunggu pembayaran'].includes(currentStatus); 
         if (subTab === 'baru') return isBaru;
         if (subTab === 'diproses') return isDiproses;
         if (subTab === 'tagihan') return isTagihan;
         return false;
      }
    });

    // MENGHITUNG JUMLAH BADGE UNTUK SEMUA TAB
    const pesananBaruCount = myOrders.filter(o => {
      let st = (o.status || o.order_status || '').toLowerCase();
      return ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima'].includes(st);
    }).length;

    const tagihanCount = myOrders.filter(o => {
      let st = (o.status || o.order_status || '').toLowerCase();
      return ['menunggu pembayaran'].includes(st);
    }).length;

    const selesaiCount = myOrders.filter(o => {
      let st = (o.status || o.order_status || '').toLowerCase();
      return ['selesai'].includes(st);
    }).length;

    const batalCount = myOrders.filter(o => {
      let st = (o.status || o.order_status || '').toLowerCase();
      return ['dibatalkan'].includes(st);
    }).length;

    return (
      <div className="p-4 flex flex-col h-full animate-in fade-in bg-slate-50 min-h-screen pt-4">
        
        {/* SEGMENTED CONTROL: 3 TAB STRATEGY */}
        {!isHistory && (
          <div className="flex p-1 bg-slate-200/60 backdrop-blur-sm rounded-[14px] mb-5">
            <button 
               onClick={() => setSubTab('baru')} 
               className={`flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all outline-none flex items-center justify-center gap-1.5 ${subTab === 'baru' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Baru
              {pesananBaruCount > 0 && (
                <span className={`${subTab === 'baru' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'} px-1.5 py-0.5 rounded-full text-[9px]`}>
                  {pesananBaruCount}
                </span>
              )}
            </button>
            <button 
               onClick={() => setSubTab('diproses')} 
               className={`flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all outline-none ${subTab === 'diproses' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Diproses
            </button>
            <button 
               onClick={() => setSubTab('tagihan')} 
               className={`flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all outline-none flex items-center justify-center gap-1.5 ${subTab === 'tagihan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tagihan
              {tagihanCount > 0 && (
                <span className={`${subTab === 'tagihan' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'} px-1.5 py-0.5 rounded-full text-[9px]`}>
                  {tagihanCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* SEGMENTED CONTROL UNTUK TAB RIWAYAT */}
        {isHistory && (
          <div className="flex p-1 bg-slate-200/60 backdrop-blur-sm rounded-[14px] mb-5">
            <button 
               onClick={() => setSubTabHistory('selesai')} 
               className={`flex-1 py-2.5 text-[12px] font-bold rounded-xl transition-all outline-none flex items-center justify-center gap-1.5 ${subTabHistory === 'selesai' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Selesai
              {selesaiCount > 0 && (
                <span className={`${subTabHistory === 'selesai' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'} px-1.5 py-0.5 rounded-full text-[9px]`}>
                  {selesaiCount}
                </span>
              )}
            </button>
            <button 
               onClick={() => setSubTabHistory('dibatalkan')} 
               className={`flex-1 py-2.5 text-[12px] font-bold rounded-xl transition-all outline-none flex items-center justify-center gap-1.5 ${subTabHistory === 'dibatalkan' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dibatalkan
              {batalCount > 0 && (
                <span className={`${subTabHistory === 'dibatalkan' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'} px-1.5 py-0.5 rounded-full text-[9px]`}>
                  {batalCount}
                </span>
              )}
            </button>
          </div>
        )}

        {isLoadingOrders ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center mt-6">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-[17px] font-bold text-slate-800 mb-1 tracking-tight">Belum ada pesanan</h3>
            <p className="text-[13px] font-medium text-slate-500 px-4">
               {!isHistory ? "Daftar pesanan Anda akan muncul di sini." : 
                  subTabHistory === 'selesai' ? "Belum ada pesanan yang selesai dikerjakan." : 
                  "Tidak ada riwayat pesanan yang dibatalkan."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              let activeStatus = ord.status || ord.order_status || '';
              if (activeStatus.toLowerCase() === 'selesai ditangani') {
                  activeStatus = 'Ditangani'; 
              }

              const sLower = activeStatus.toLowerCase();
              const pStatus = ord.payment_status || 'belum_dibayar';
              
              const orderDate = new Date(ord.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              let estimasiText = null;
              let invoiceData = null;
              let paymentProofData = null; 
              let rawNote = ord.complaint_description || ord.note || '-';
              
              const invMatch = rawNote.match(/\[INVOICE:J=(\d+)\|P=(\d+)\|L=(\d+)\|T=(\d+)(?:\|D=(.*?))?\]/);
              if (invMatch) {
                  invoiceData = {
                      jasa: parseInt(invMatch[1], 10),
                      part: parseInt(invMatch[2], 10),
                      layanan: parseInt(invMatch[3], 10),
                      total: parseInt(invMatch[4], 10),
                      desc: invMatch[5] || '-'
                  };
                  rawNote = rawNote.replace(/\[INVOICE:[^\]]+\]/g, '');
              }

              const estMatch = rawNote.match(/\[ESTIMASI:([^\]]+)\]/);
              if (estMatch && estMatch[1]) {
                  const nominal = parseInt(estMatch[1].replace(/\D/g, ''), 10);
                  if (!isNaN(nominal)) estimasiText = nominal.toLocaleString('id-ID');
                  rawNote = rawNote.replace(/\[ESTIMASI:[^\]]+\]/g, '');
              }

              const proofMatch = rawNote.match(/\[PAYMENT_PROOF:([^\]]+)\]/);
              if (proofMatch && proofMatch[1]) {
                  paymentProofData = proofMatch[1];
                  rawNote = rawNote.replace(/\[PAYMENT_PROOF:[^\]]+\]/g, '');
              }

              let extractedSchedule = null;
              const schedMatch = rawNote.match(/\[JADWAL:\s*([^\]]+)\]/);
              if (schedMatch && schedMatch[1]) {
                  extractedSchedule = schedMatch[1];
                  rawNote = rawNote.replace(/\[JADWAL:[^\]]+\]/g, '');
              }

              let dpData: { nominal: number; status: string; bank: string } | null = null;
              const dpMatch = rawNote.match(/\[DP:\s*([^\]]+)\]/);
              if (dpMatch && dpMatch[1]) {
                  dpData = { nominal: 50000, status: 'menunggu', bank: 'BCA' };
                  dpMatch[1].split('|').forEach((p: string) => {
                      const [k, v] = p.split('=');
                      if (k && v) {
                          const key = k.trim().toLowerCase();
                          if (key === 'nominal' || key === 'n') dpData!.nominal = Number(v.trim()) || 50000;
                          if (key === 'status' || key === 's') dpData!.status = v.trim().toLowerCase();
                          if (key === 'bank' || key === 'b') dpData!.bank = v.trim();
                      }
                  });
                  rawNote = rawNote.replace(/\[DP:[^\]]+\]/g, '');
              }

              let hasPhoto = false;
              if (rawNote.includes('[FOTO_TERLAMPIR]')) {
                  hasPhoto = true;
                  rawNote = rawNote.replace(/\[FOTO_TERLAMPIR\]/g, '');
              }

              let promoData: { code: string; title: string } | null = null;
              const promoMatch = rawNote.match(/\[PROMO_APPLIED:\s*([^\]]+)\]/);
              if (promoMatch && promoMatch[1]) {
                  const parts = promoMatch[1].split('|');
                  promoData = {
                      code: parts[0]?.trim() || '',
                      title: parts[1]?.trim() || ''
                  };
                  rawNote = rawNote.replace(/\[PROMO_APPLIED:[^\]]+\]/g, '');
              }

              const sparePartRequests: string[] = [];
              const partRegex = /\[PELANGGAN MEMINTA TAMBAHAN PART:\s*([^\]]+)\]/g;
              let match;
              while ((match = partRegex.exec(rawNote)) !== null) {
                  sparePartRequests.push(match[1]);
              }
              
              // EKSTRAK ALASAN BATAL JIKA ADA
              let cancelReasonData = null;
              const cancelMatch = rawNote.match(/\[ALASAN_BATAL:\s*([^\]]+)\]/);
              if (cancelMatch && cancelMatch[1]) {
                  cancelReasonData = cancelMatch[1];
                  rawNote = rawNote.replace(/\[ALASAN_BATAL:[^\]]+\]/g, '');
              }

              let cleanComplaint = rawNote.replace(/\[PELANGGAN MEMINTA TAMBAHAN PART:[^\]]+\]/g, '').trim();
              cleanComplaint = cleanComplaint.replace(/^["']|["']$/g, '').trim();
              if (!cleanComplaint) cleanComplaint = '-';

              let badgeClass = 'bg-slate-100 text-slate-700';
              let displayStatus = activeStatus.replace(/_/g, ' ');
              let statusBadgeIcon = null;

              if (pStatus === 'lunas' || sLower === 'selesai') {
                 badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold shadow-xs';
                 displayStatus = 'Pembayaran Terverifikasi';
                 statusBadgeIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
              } else if (paymentProofData || pStatus === 'menunggu_verifikasi') {
                 badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200 font-extrabold animate-pulse shadow-xs';
                 displayStatus = 'Menunggu Verifikasi';
                 statusBadgeIcon = <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />;
              } else if (['menunggu pembayaran', 'menunggu_pembayaran'].includes(sLower)) {
                 badgeClass = 'bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold';
                 displayStatus = 'Menunggu Pembayaran';
                 statusBadgeIcon = <CreditCard className="w-3.5 h-3.5 text-indigo-600" />;
              } else if (['menunggu_konfirmasi', 'diterima', 'berjalan', 'ditangani', 'dijadwalkan', 'dalam_pengerjaan'].includes(sLower)) {
                 badgeClass = 'bg-amber-100 text-amber-700 border border-amber-200';
                 statusBadgeIcon = <Clock className="w-3.5 h-3.5 text-amber-500" />;
              } else if (['dibatalkan'].includes(sLower)) {
                 badgeClass = 'bg-rose-100 text-rose-700 border border-rose-200';
                 statusBadgeIcon = <XCircle className="w-3.5 h-3.5 text-rose-500" />;
              }

              const canCancel = ['menunggu_konfirmasi', 'berjalan', 'diterima', 'dijadwalkan'].includes(sLower);

              return (
                <div key={ord.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase rounded-full">
                      #{ord.order_code || 'CRB-0000'}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 transition-all duration-300 ${badgeClass}`}>
                      {statusBadgeIcon}
                      <span>{displayStatus}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-[15px]">{ord.custom_service_title || `${ord.unit_name || ''} - ${ord.action_type || ''}`}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mb-1">{orderDate}</p>
                    <p className="text-xs text-slate-500">{ord.customer_kecamatan || ord.location || '-'}</p>
                    
                    <p className="text-[11px] text-slate-600 mt-1.5 italic font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      Keluhan: "{cleanComplaint}"
                    </p>

                    <div className="mt-2.5 space-y-2">
                       {extractedSchedule && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-sky-700 bg-sky-50 px-3 py-2 rounded-xl border border-sky-100 shadow-xs">
                             <Calendar className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                             <span>Jadwal: {extractedSchedule}</span>
                          </div>
                       )}

                       {dpData && (
                          <div className={`flex items-start gap-2.5 text-[11px] p-3 rounded-xl border shadow-xs animate-in fade-in ${
                             dpData.status === 'lunas' 
                                ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                                : 'text-amber-800 bg-amber-50 border-amber-200'
                          }`}>
                             {dpData.status === 'lunas' ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                             ) : (
                                <CreditCard className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                             )}
                             <div className="flex-1 min-w-0">
                                <p className="font-extrabold">
                                   {dpData.status === 'lunas' 
                                      ? `DP Rp ${dpData.nominal.toLocaleString('id-ID')} Terverifikasi (${dpData.bank})` 
                                      : `Uang Muka (DP) Rp ${dpData.nominal.toLocaleString('id-ID')} (${dpData.bank})`}
                                </p>
                                <p className="text-[10px] font-medium mt-0.5 leading-snug opacity-90">
                                   {dpData.status === 'lunas' 
                                      ? 'Slot jadwal reservasi telah dikunci. Teknisi bersiap menuju lokasi sesuai waktu yang ditentukan.' 
                                      : 'Silakan selesaikan pembayaran DP tanda jadi via WhatsApp ke admin untuk mengonfirmasi jadwal & pengerjaan teknisi.'}
                                </p>
                             </div>
                          </div>
                       )}

                       {hasPhoto && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-2 rounded-xl border border-purple-100 shadow-xs">
                             <ImageIcon className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                             <span>Foto Kerusakan Telah Dilampirkan</span>
                          </div>
                       )}

                       {promoData && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-teal-800 bg-teal-50 px-3 py-2 rounded-xl border border-teal-100 shadow-xs">
                             <Ticket className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                             <span>Voucher Digunakan: <span className="font-mono font-black">{promoData.code}</span> ({promoData.title})</span>
                          </div>
                       )}

                       {cancelReasonData && sLower === 'dibatalkan' && (
                          <div className="flex items-start gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-50/50 px-3 py-2 rounded-xl border border-rose-100 shadow-xs">
                             <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                             <span>Alasan Batal: {cancelReasonData}</span>
                          </div>
                       )}

                       {sparePartRequests.length > 0 && (
                          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-1.5">
                             <span className="text-[9px] font-extrabold text-indigo-700 tracking-wider uppercase flex items-center gap-1">
                               <Package className="w-3 h-3" /> Suku Cadang Ditambahkan:
                             </span>
                             {sparePartRequests.map((partReq, idx) => (
                               <div key={idx} className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100 flex items-center justify-between shadow-xs">
                                  <span>&bull; {partReq}</span>
                               </div>
                             ))}
                          </div>
                       )}
                    </div>
                  </div>
                  
                  {(estimasiText && !invoiceData) && (
                    <div className="mt-3 bg-blue-50/50 border border-blue-100 rounded-[14px] p-3 animate-in fade-in">
                       <span className="text-[9px] font-bold tracking-widest uppercase text-blue-600 block mb-0.5">Estimasi Biaya</span>
                       <p className="text-[15px] font-black text-slate-800 tracking-tight">Rp {estimasiText}</p>
                       <p className="text-[9px] font-medium text-slate-500 mt-1 leading-tight">*Dapat berubah menyesuaikan penanganan akhir teknisi dan kebutuhan suku cadang di lapangan.</p>
                    </div>
                  )}

                  {(invoiceData && (sLower === 'menunggu pembayaran' || sLower === 'selesai')) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in">
                       <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl mb-3">
                          <div className="flex items-center gap-2.5">
                             <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm"><FileText className="w-4 h-4" /></div>
                             <div>
                                <p className="text-[9px] font-extrabold text-indigo-800 uppercase tracking-widest">Tagihan {pStatus === 'lunas' ? 'Lunas' : 'Tersedia'}</p>
                                <p className="text-[14px] font-black text-slate-800 tracking-tight">
                                   Rp {dpData?.status === 'lunas' ? Math.max(0, invoiceData.total - dpData.nominal).toLocaleString('id-ID') : invoiceData.total.toLocaleString('id-ID')}
                                </p>
                                {dpData?.status === 'lunas' && (
                                   <p className="text-[9px] text-emerald-700 font-extrabold">Potong DP Rp {dpData.nominal.toLocaleString('id-ID')}</p>
                                )}
                             </div>
                          </div>
                          <button onClick={() => setShowInvoiceModal({ ord, invoiceData })} className="text-[11px] font-bold bg-white text-indigo-600 px-3.5 py-2 rounded-[10px] shadow-sm border border-indigo-100 active:scale-95 transition-transform">
                             Lihat Invoice
                          </button>
                       </div>
                       
                       {sLower === 'menunggu pembayaran' && (
                           (paymentProofData || pStatus === 'menunggu_verifikasi') && pStatus !== 'lunas' ? (
                               <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl animate-in fade-in">
                                   <span className="text-[11px] font-bold text-amber-800 flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                                      <span>Status: Menunggu Verifikasi Admin</span>
                                   </span>
                                   {paymentProofData && (
                                      <button onClick={() => setViewReceiptModal(paymentProofData)} className="text-[10px] font-bold text-amber-800 bg-white px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 active:scale-95 transition-all">Lihat Bukti</button>
                                   )}
                               </div>
                           ) : pStatus === 'lunas' ? (
                               <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-xl animate-in zoom-in-95">
                                   <span className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Pembayaran Terverifikasi (Lunas)</span>
                                   </span>
                               </div>
                           ) : (
                               <div className="mt-2">
                                  <input type="file" accept="image/*" className="hidden" id={`upload-${ord.id}`} onChange={(e) => handleFileSelect(e, ord.id)} />
                                  
                                  {!selectedFiles[ord.id] ? (
                                      <label htmlFor={`upload-${ord.id}`} className="flex items-center justify-center w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-indigo-600 text-[12px] font-bold cursor-pointer active:scale-95 transition-transform">
                                           Unggah Bukti Pembayaran
                                      </label>
                                  ) : (
                                      <div className="flex flex-col gap-2 p-3 border border-indigo-100 bg-indigo-50/30 rounded-xl animate-in fade-in zoom-in-95">
                                         <p className="text-[11px] font-medium text-slate-600 truncate flex items-center gap-1.5">
                                             <FileText className="w-3.5 h-3.5 text-indigo-400" /> {selectedFiles[ord.id].name}
                                         </p>
                                         <div className="flex gap-2 mt-1">
                                             <button 
                                                  onClick={() => {
                                                     setSelectedFiles(prev => { const ns = {...prev}; delete ns[ord.id]; return ns; });
                                                 }} 
                                                  className="px-3 py-2 text-[10px] font-bold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 shadow-sm"
                                             >
                                                 Batal
                                             </button>
                                             <button 
                                                  onClick={() => handleUploadReceipt(ord.id, ord.note || ord.complaint_description || '')} 
                                                  disabled={uploadingId === ord.id}
                                                 className="flex-1 py-2 text-[11px] font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 flex justify-center items-center active:scale-95 transition-transform"
                                             >
                                                 {uploadingId === ord.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Pembayaran'}
                                             </button>
                                         </div>
                                      </div>
                                  )}
                               </div>
                           )
                       )}
                    </div>
                  )}

                  {/* TOMBOL LACAK PROGRESS - Integrasi Baru */}
                  {sLower !== 'dibatalkan' && (
                     <div className="mt-3 border-t border-slate-100 pt-3">
                         <button 
                             onClick={() => setTrackingOrder(ord)} 
                             className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-2.5 rounded-xl text-[12px] font-bold shadow-sm active:scale-95 transition-all outline-none"
                         >
                             <MapPin className="w-4 h-4" /> Lacak Status & Progress
                         </button>
                     </div>
                  )}

                  {canCancel && (
                     <div className="pt-2 flex justify-end">
                        {confirmingCancelId === ord.id ? (
                           <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 animate-in fade-in zoom-in-95 shadow-sm mt-2">
                              <p className="text-[11px] font-bold text-rose-700 mb-1">Yakin ingin membatalkan pesanan?</p>
                              <p className="text-[10px] text-rose-600 mb-3 leading-tight font-medium">
                                 <b>Perhatian:</b> Jika teknisi sudah dijadwalkan, Anda dapat dikenakan penalti/biaya pengecekan.
                              </p>
                              
                              <div className="mb-3">
                                <label className="text-[9px] font-bold text-rose-700 uppercase tracking-widest block mb-1.5">Alasan Batal:</label>
                                <select 
                                   value={cancelReason} 
                                   onChange={(e) => setCancelReason(e.target.value)} 
                                   className="w-full bg-white border border-rose-200 px-3 py-2.5 rounded-lg text-[11px] font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-200 shadow-sm appearance-none"
                                >
                                   <option value="" disabled>-- Pilih Alasan Batal --</option>
                                   <option value="Sudah teratasi">Kendala sudah teratasi sendiri</option>
                                   <option value="Menunggu lama">Menunggu terlalu lama</option>
                                   <option value="Harga tidak sesuai">Estimasi harga tidak sesuai</option>
                                   <option value="Salah Opsi">Salah pilih layanan / opsi unit</option>
                                   <option value="Lainnya">Lainnya / Berubah pikiran</option>
                                </select>
                              </div>

                              <div className="flex gap-2">
                                 <button onClick={() => { setConfirmingCancelId(null); setCancelReason(''); }} className="flex-1 py-2.5 bg-white border border-rose-200 text-rose-600 text-[10px] font-bold rounded-lg active:scale-95 shadow-sm outline-none">
                                    Kembali
                                 </button>
                                 <button 
                                    onClick={() => handleCancelOrder(ord.id, ord.note || ord.complaint_description || '')} 
                                    disabled={!cancelReason}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg active:scale-95 flex items-center justify-center gap-1 shadow-sm shadow-rose-600/20 outline-none disabled:opacity-50 disabled:active:scale-100"
                                 >
                                    <XCircle className="w-3.5 h-3.5" /> Ya, Batalkan
                                 </button>
                              </div>
                           </div>
                        ) : (
                           <button onClick={() => setConfirmingCancelId(ord.id)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[11px] font-bold border border-rose-100 active:scale-95 transition-transform flex items-center gap-1 outline-none">
                              <XCircle className="w-3.5 h-3.5" /> Batalkan Pesanan
                           </button>
                        )}
                     </div>
                  )}

                  {(sLower === 'selesai' && paymentProofData) && (
                     <div className="mt-2 flex justify-end">
                         <button onClick={() => setViewReceiptModal(paymentProofData)} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200">Lihat Bukti Bayar</button>
                     </div>
                  )}
                  
                </div>
              )
            })}
          </div>
        )}

        {/* SPACER BLOCK PENYELAMAT LAYOUT */}
        <div className="h-32 w-full shrink-0 pointer-events-none"></div>

        {/* MODAL CETAK INVOICE */}
        {showInvoiceModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md overflow-y-auto" onClick={() => setShowInvoiceModal(null)}>
               <div className="min-h-full py-24 flex items-center justify-center w-full px-5">
                   <div className="w-full max-w-[320px] bg-[#fdfdfd] shadow-2xl relative flex flex-col rounded-sm animate-in zoom-in-95 print:w-full print:shadow-none print:m-0" onClick={e => e.stopPropagation()}>
                      <div className="p-6 pb-3 text-center text-slate-800">
                          <h2 className="font-bold text-[22px] uppercase tracking-wider font-mono">OMEANFIX</h2>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-mono">Cirebon On-Demand Service</p>
                          <p className="text-[12px] mt-3 font-bold font-mono px-3 py-1 bg-slate-100 border border-slate-200 border-dashed inline-block">#{showInvoiceModal.ord.order_code || 'CRB-INV'}</p>
                      </div>
                      <div className="w-full px-4"><div className="border-b-2 border-dashed border-slate-300"></div></div>
                      
                      <div className="p-5 py-4 space-y-2 text-[11px] font-mono text-slate-700">
                          <div className="flex justify-between"><span className="text-slate-500">Pelanggan:</span> <span className="font-bold text-right truncate w-24">{showInvoiceModal.ord.customer_name || 'Pelanggan'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Layanan:</span> <span className="font-bold text-right truncate w-32">{showInvoiceModal.ord.custom_service_title || showInvoiceModal.ord.unit_name}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Tanggal:</span> <span className="font-bold text-right">{new Date(showInvoiceModal.ord.created_at).toLocaleDateString('id-ID')}</span></div>
                      </div>
                      
                      <div className="w-full px-4"><div className="border-b-2 border-dashed border-slate-300"></div></div>
                      <div className="p-5 py-4 text-[11px] font-mono text-slate-700">
                          <span className="text-slate-500 block mb-1">Deskripsi Tindakan:</span>
                          <span className="font-bold leading-relaxed">{showInvoiceModal.invoiceData.desc || '-'}</span>
                      </div>
                      <div className="w-full px-4"><div className="border-b-2 border-dashed border-slate-300"></div></div>
                      <div className="p-5 py-4 space-y-3 text-[12px] font-mono text-slate-700">
                          <div className="flex justify-between items-center">
                             <span>Biaya Jasa</span>
                             <span className="font-bold">Rp {showInvoiceModal.invoiceData.jasa.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span>Suku Cadang</span>
                             <span className="font-bold">Rp {showInvoiceModal.invoiceData.part.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span>Biaya Layanan</span>
                             <span className="font-bold">Rp {showInvoiceModal.invoiceData.layanan.toLocaleString('id-ID')}</span>
                          </div>
                      </div>
                      <div className="w-full px-4"><div className="border-b-2 border-slate-800"></div></div>
                      
                      <div className="p-5 py-4 flex justify-between items-center font-black text-[15px] font-mono text-slate-900">
                          <span>TOTAL BAYAR</span>
                          <span>Rp {showInvoiceModal.invoiceData.total.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="w-full px-4"><div className="border-b-2 border-dashed border-slate-300"></div></div>
                      <div className="p-5 py-4 flex flex-col items-center justify-center bg-slate-50">
                         <p className="text-[10px] font-bold text-slate-800 mb-2 font-mono">METODE PEMBAYARAN</p>
                         
                         <div className="w-28 h-28 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center p-2 mb-3">
                            <div className="w-full h-full border-2 border-slate-800 flex items-center justify-center relative">
                               <div className="absolute top-0 left-0 w-2 h-2 border-b-2 border-r-2 border-white bg-slate-800"></div>
                               <div className="absolute bottom-0 right-0 w-2 h-2 border-t-2 border-l-2 border-white bg-slate-800"></div>
                               <QrCode className="w-16 h-16 text-slate-800" strokeWidth={1.5} />
                            </div>
                         </div>
                         
                         <div className="text-center font-mono text-[10px] text-slate-600 space-y-1">
                            <p>Atau Transfer Bank:</p>
                            <p className="font-bold text-slate-800">BCA 123-456-7890 a.n OMEANFIX</p>
                            <p className="font-bold text-slate-800">MANDIRI 098-765-4321 a.n OMEANFIX</p>
                         </div>
                      </div>
                      
                      <div className="p-5 text-center">
                          <button onClick={() => setShowInvoiceModal(null)} className="w-full bg-slate-900 text-white font-sans font-bold py-3.5 rounded-xl text-[13px] active:scale-95 shadow-md outline-none">
                             Tutup & Bayar Kasir
                          </button>
                      </div>
                   </div>
               </div>
            </div>
        )}

        {/* MODAL LIHAT BUKTI BAYAR */}
        {viewReceiptModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 transition-opacity" onClick={() => setViewReceiptModal(null)}>
                <div className="bg-white p-2 rounded-[24px] max-w-sm w-full relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewReceiptModal(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg"><X className="w-4 h-4" /></button>
                    <img src={viewReceiptModal} alt="Bukti Pembayaran" className="w-full rounded-[18px] object-contain" />
                </div>
            </div>
        )}

        {/* MODAL TRACKER MOCKUP */}
        {trackingOrder && (
            <TrackerMockup 
                order={trackingOrder} 
                onClose={() => setTrackingOrder(null)} 
            />
        )}
      </div>
    );
  };

  const ProfileContent = () => {
         
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 300; 
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;

              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              const base64Str = canvas.toDataURL('image/webp', 0.8);
              setProfAvatar(base64Str);
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
       e.preventDefault();
       setIsSavingProfile(true);
       try {
           if(customerId) {
              const { error } = await supabase.from('customers').update({
                 full_name: profName,
                 phone_number: profPhone,
                 email: profEmail,
                 avatar_url: profAvatar
              }).eq('id', customerId);
              
              if(error) throw error;
              alert('Profil berhasil diperbarui dan tersimpan di database!');
           } else {
              const { data: newCust, error } = await supabase.from('customers').insert([{
                 full_name: profName,
                 phone_number: profPhone,
                 email: profEmail,
                 avatar_url: profAvatar
              }]).select().single();
              
              if(error) throw error;
              if(newCust) setCustomerId(newCust.id);
              alert('Profil baru berhasil dibuat di database!');
           }
           setProfileStep('main');
       } catch (err: any) {
           alert("Gagal menyimpan profil: " + err.message);
       } finally {
           setIsSavingProfile(false);
       }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
       e.preventDefault();
       setIsSavingProfile(true);
       try {
           const pwdInput = (document.getElementById('new-pwd') as HTMLInputElement)?.value;
           if(customerId && pwdInput) {
              const { error } = await supabase.from('customers').update({
                 password: pwdInput
              }).eq('id', customerId);
              if(error) throw error;
              alert('Kata sandi berhasil diperbarui di database!');
           }
           setProfileStep('main');
       } catch (err: any) {
           alert("Gagal menyimpan kata sandi: " + err.message);
       } finally {
           setIsSavingProfile(false);
       }
    };

    if (profileStep === 'edit_profile') {
      return (
        <div className="p-4 space-y-5 animate-in slide-in-from-right-4 bg-slate-50 dark:bg-[#0B0F19] min-h-screen pt-4 pb-[120px] transition-colors">
           <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setProfileStep('main')} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"><ChevronLeft className="w-5 h-5"/></button>
              <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Edit Profil</h2>
           </div>
           
           <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="flex flex-col items-center justify-center mb-6">
                 <div className="relative">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/60 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border-[3px] border-white dark:border-slate-800 overflow-hidden">
                       {profAvatar ? <img src={profAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10" />}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 dark:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors border-2 border-white dark:border-slate-800 active:scale-95">
                       <Camera className="w-4 h-4" />
                    </label>
                    <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                 </div>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-3">Ketuk ikon kamera untuk mengubah</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Nama Lengkap</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="w-4 h-4 text-slate-400" /></div>
                       <input type="text" value={profName} onChange={(e) => setProfName(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Nomor WhatsApp</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="w-4 h-4 text-slate-400" /></div>
                       <input type="tel" value={profPhone} onChange={(e) => setProfPhone(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Alamat Email</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="w-4 h-4 text-slate-400" /></div>
                       <input type="email" value={profEmail} onChange={(e) => setProfEmail(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors" />
                    </div>
                 </div>
              </div>

              <button type="submit" disabled={isSavingProfile} className="w-full py-4 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-blue-600/30 active:scale-95 transition-transform outline-none disabled:bg-blue-400">
                {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan ke Database'}
              </button>
           </form>
        </div>
      );
    }

    if (profileStep === 'edit_password') {
      return (
        <div className="p-4 space-y-5 animate-in slide-in-from-right-4 bg-slate-50 dark:bg-[#0B0F19] min-h-screen pt-4 pb-[120px] transition-colors">
           <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setProfileStep('main')} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"><ChevronLeft className="w-5 h-5"/></button>
              <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Keamanan Akun</h2>
           </div>
           
           <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Password Saat Ini</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="w-4 h-4 text-slate-400" /></div>
                       <input type="password" required placeholder="Masukkan password lama" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors" />
                    </div>
                 </div>
                 <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-800 my-2"></div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Password Baru</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ShieldCheck className="w-4 h-4 text-slate-400" /></div>
                       <input type="password" id="new-pwd" required placeholder="Minimal 6 karakter" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Konfirmasi Password Baru</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ShieldCheck className="w-4 h-4 text-slate-400" /></div>
                       <input type="password" required placeholder="Ulangi password baru" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors" />
                    </div>
                 </div>
              </div>

              <button type="submit" disabled={isSavingProfile} className="w-full py-4 flex justify-center items-center gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-slate-900/20 dark:shadow-blue-600/30 active:scale-95 transition-transform outline-none disabled:bg-slate-700">
                {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Password Baru'}
              </button>
           </form>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-6 animate-in fade-in bg-slate-50 dark:bg-[#0B0F19] min-h-screen pb-[120px] transition-colors">
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
             {profAvatar ? <img src={profAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-8 h-8" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">{profName}</h3>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{profPhone}</p>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">{profEmail}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* TEMA / MODE GELAP & TERANG TOGGLE */}
          <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 block">Mode Tampilan</span>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 outline-none ${
                  !isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Terang</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 outline-none ${
                  isDark ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Gelap</span>
              </button>
            </div>
          </div>

          <button onClick={() => setProfileStep('edit_profile')} className="w-full flex items-center justify-between p-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800/80 text-left outline-none active:bg-slate-100 dark:active:bg-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl"><User className="w-5 h-5" /></div>
              <div>
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 block">Informasi Akun</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400">Ubah nama, email, foto, dan no WA</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>
          
          <button onClick={() => setProfileStep('edit_password')} className="w-full flex items-center justify-between p-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800/80 text-left outline-none active:bg-slate-100 dark:active:bg-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 block">Keamanan</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400">Perbarui kata sandi Anda</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>

          <button onClick={() => alert('Diarahkan ke WhatsApp Admin OMEANFIX')} className="w-full flex items-center justify-between p-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800/80 text-left outline-none active:bg-slate-100 dark:active:bg-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl"><HelpCircle className="w-5 h-5" /></div>
              <div>
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 block">Pusat Bantuan</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400">Hubungi kami via WhatsApp</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>

          <button onClick={() => alert('Sesi Anda telah diakhiri.')} className="w-full flex items-center justify-between p-4 px-5 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left outline-none active:bg-rose-100 dark:active:bg-rose-950/60 group">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 group-hover:bg-rose-100 dark:group-hover:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl transition-colors"><LogOut className="w-5 h-5" /></div>
              <div>
                <span className="text-[14px] font-bold text-rose-600 dark:text-rose-400 block">Keluar Akun</span>
                <span className="text-[11px] text-rose-400 dark:text-rose-500">Akhiri sesi Anda di perangkat ini</span>
              </div>
            </div>
          </button>
        </div>

        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-[20px] border border-blue-100 dark:border-blue-900/40 text-center">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">OMEANFIX v2.4 &bull; Cirebon On-Demand Service</p>
        </div>
      </div>
    );
  };

  if (isPortalOpen) return <InternalPortal onBackToCustomer={() => setIsPortalOpen(false)} />;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-[100dvh] w-full relative shadow-2xl overflow-hidden font-sans flex flex-col transition-colors duration-200">
      <header className="flex-none z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] pt-7 pb-4 px-5 relative transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[22px] font-black text-blue-600 dark:text-blue-400 tracking-tight leading-none">OMEANFIX</h1>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-1.5 uppercase">Cara Cepat, Solusi Tepat</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { 
                triggerRipple(e); 
                toggleTheme(); 
              }} 
              className="ripple-btn relative p-2.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 outline-none" 
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Toggle Mode Gelap/Terang"
            >
              {isDark ? <Sun className="w-5 h-5 transition-transform duration-300" /> : <Moon className="w-5 h-5 transition-transform duration-300" />}
            </button>
            <button onClick={(e) => { triggerRipple(e); setIsPortalOpen(true); }} className="ripple-btn relative p-2.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 outline-none" title="Portal Admin">
              <Lock className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => {
                triggerRipple(e);
                setIsNotifCenterOpen(true);
                setNotifHistory(prev => prev.map(n => ({ ...n, isRead: true })));
              }} 
              className="ripple-btn relative p-2.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 outline-none"
              title="Pusat Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {notifHistory.some(n => !n.isRead) ? (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              ) : notifHistory.length > 0 ? (
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-slate-900"></span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide relative z-0 bg-[#F8F9FA] dark:bg-[#0B0F19] transition-colors">
        <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out fill-mode-both min-h-full">
          {activeTab === 'beranda' && <HomeContent />}
          {activeTab === 'pesanan' && <OrdersView isHistory={false} />}
          {activeTab === 'sparepart' && <SparepartTab preSelectedPart={preSelectedPart} onClearPreSelectedPart={() => setPreSelectedPart(null)} />}
          {activeTab === 'riwayat' && <OrdersView isHistory={true} />}
          {activeTab === 'profil' && <ProfileContent />}
        </div>
      </main>

      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-[420px] z-40">
        <div 
          style={{ height: '67.2778px', width: '328.194px', paddingLeft: '24px', marginLeft: '12px' }}
          className="glass-nav rounded-[32px] p-1.5 flex justify-between items-center px-3 border border-slate-200/80 dark:border-slate-800/80"
        >
          <button onClick={() => setActiveTab('beranda')} className={`flex flex-col items-center gap-1 py-2 px-2 transition-all outline-none ${activeTab === 'beranda' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
            <Home className="w-5 h-5" strokeWidth={activeTab === 'beranda' ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-tight">Beranda</span>
          </button>
          <button onClick={() => setActiveTab('pesanan')} className={`flex flex-col items-center gap-1 py-2 px-2 transition-all outline-none ${activeTab === 'pesanan' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
            <FileText className="w-5 h-5" strokeWidth={activeTab === 'pesanan' ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-tight">Pesanan</span>
          </button>
          <button onClick={() => setActiveTab('sparepart')} className={`flex flex-col items-center gap-1 py-2 px-2 transition-all outline-none ${activeTab === 'sparepart' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
            <Package className="w-5 h-5" strokeWidth={activeTab === 'sparepart' ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-tight">Spare Part</span>
          </button>
          <button onClick={() => setActiveTab('riwayat')} className={`flex flex-col items-center gap-1 py-2 px-2 transition-all outline-none ${activeTab === 'riwayat' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
            <History className="w-5 h-5" strokeWidth={activeTab === 'riwayat' ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-tight">Riwayat</span>
          </button>
          <button onClick={() => setActiveTab('profil')} className={`flex flex-col items-center gap-1 py-2 px-2 transition-all outline-none ${activeTab === 'profil' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
            <User className="w-5 h-5" strokeWidth={activeTab === 'profil' ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-tight">Profil</span>
          </button>
        </div>
      </nav>

      {selectedSpecialService && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-full duration-300 ease-out shadow-2xl border-t border-slate-100 dark:border-slate-800">
            <div className="w-full flex justify-center pt-3 pb-2 bg-white dark:bg-slate-900 relative z-10 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <button onClick={() => { setSelectedSpecialService(null); setMemStep('detail'); }} className="absolute right-5 top-3 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 scrollbar-hide">
              {memStep === 'success' ? (
                <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-sm"><CheckCircle2 className="w-8 h-8" /></div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Pendaftaran Berhasil!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px]">Admin kami akan segera menghubungi Anda untuk jadwal aktivasi.</p>
                </div>
              ) : memStep === 'form' ? (
                <form onSubmit={handleSubmitMembership} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400 block mb-0.5">Pendaftaran Membership</span>
                    <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug">{selectedSpecialService.title}</h3>
                  </div>
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Durasi / Siklus</label>
                      <select value={memDuration} onChange={(e) => setMemDuration(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3.5 rounded-[16px] text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none">
                        <option value="1_bulan">1 Bulan Uji Coba</option>
                        <option value="3_bulan">3 Bulan (Lebih Hemat)</option>
                        <option value="6_bulan">6 Bulan (Prioritas)</option>
                        <option value="1_tahun">1 Tahun (Member VIP)</option>
                        <option value="rutin_tanpa_batas">Rutin Tanpa Batas (Bebas Berhenti)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Jadwal Preferensi Kedatangan</label>
                      <input type="text" required placeholder="Cth: Setiap hari Sabtu awal bulan jam 10 pagi" value={memSchedule} onChange={(e) => setMemSchedule(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Nama Lengkap</label>
                        <input type="text" required placeholder="Nama Anda" value={memName} onChange={(e) => setMemName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Nomor WhatsApp</label>
                        <input type="tel" required placeholder="0812..." value={memPhone} onChange={(e) => setMemPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Kecamatan (Cirebon)</label>
                      <select value={memKecamatan} onChange={(e) => setMemKecamatan(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none">
                        <option value="Kota Cirebon - Kesambi">Kota Cirebon - Kesambi</option>
                        <option value="Kota Cirebon - Kejaksan">Kota Cirebon - Kejaksan</option>
                        <option value="Kota Cirebon - Harjamukti">Kota Cirebon - Harjamukti</option>
                        <option value="Kabupaten Cirebon - Kedawung">Kab. Cirebon - Kedawung</option>
                        <option value="Kabupaten Cirebon - Sumber">Kab. Cirebon - Sumber</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Alamat & Catatan</label>
                      <textarea required placeholder="Alamat lengkap dan catatan patokan rumah..." value={memAddress} onChange={(e) => setMemAddress(e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3.5 rounded-[16px] text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none resize-none focus:bg-white dark:focus:bg-slate-800" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isSubmittingMem} className="w-full py-4 rounded-2xl text-[14px] font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 outline-none">
                      {isSubmittingMem ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Kirim Pendaftaran</span>}
                    </button>
                    <button type="button" onClick={() => setMemStep('detail')} className="w-full py-3 mt-2 rounded-2xl text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors outline-none">Kembali ke Detail</button>
                  </div>
                </form>
              ) : (
                <div className="animate-in fade-in">
                  {(() => {
                    const theme = getGradientTheme(selectedSpecialService.bg_class);
                    return (
                      <div className={`w-full p-4 rounded-[20px] ${theme.gradient} text-left flex items-center gap-3.5 h-[110px] mb-6 shadow-sm`}>
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.iconBg} shadow-sm shrink-0`}>{renderSpecialIcon(selectedSpecialService.icon_name, "w-6 h-6 text-white")}</div>
                         <div>
                           <span className={`text-[10px] font-extrabold tracking-widest uppercase ${theme.textCategory} block mb-0.5`}>{selectedSpecialService.category}</span>
                           <h3 className={`text-[18px] font-bold ${theme.textTitle} leading-snug drop-shadow-xs`}>{selectedSpecialService.title}</h3>
                         </div>
                      </div>
                    );
                  })()}
                  <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">{selectedSpecialService.description}</p>
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-[20px] p-5 mb-6">
                    <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-wide">Keuntungan Member:</h4>
                    <ul className="space-y-3">
                      {(selectedSpecialService.benefits || []).map((benefit: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[13px] text-slate-700 dark:text-slate-300 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={(e) => { triggerRipple(e); setMemStep('form'); }} 
                    className="ripple-btn w-full py-4 rounded-2xl text-[14px] font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 shadow-slate-900/20 dark:shadow-blue-600/30 outline-none"
                  >
                    <span>{selectedSpecialService.cta_text || 'Daftar Sekarang'}</span><ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RICH PERSISTENT LOCAL PUSH NOTIFICATION SIMULATION BANNER */}
      {persistentNotif && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-[94%] max-w-md animate-in slide-in-from-top-6 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white rounded-[24px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
                  persistentNotif.statusType === 'selesai' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  persistentNotif.statusType === 'pembayaran' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  persistentNotif.statusType === 'jadwal' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                  persistentNotif.statusType === 'proses' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  persistentNotif.statusType === 'batal' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-md text-slate-300">
                      #{persistentNotif.orderCode}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {persistentNotif.timestamp}
                    </span>
                  </div>
                  <h4 className="text-[14px] font-black text-white mt-1 leading-tight drop-shadow-xs">
                    {persistentNotif.title}
                  </h4>
                </div>
              </div>
              <button 
                onClick={() => setPersistentNotif(null)} 
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-colors"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-slate-200/90 font-medium leading-relaxed pl-1">
              {persistentNotif.message}
            </p>

            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <button
                onClick={(e) => {
                  triggerRipple(e);
                  setPersistentNotif(null);
                  if (persistentNotif.statusType === 'selesai' || persistentNotif.statusType === 'batal') {
                    setActiveTab('riwayat');
                  } else {
                    setActiveTab('pesanan');
                  }
                }}
                className="ripple-btn flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[12px] font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5"
              >
                <span>Lihat Pesanan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPersistentNotif(null)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 text-slate-300 text-[12px] font-bold rounded-xl transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUSAT NOTIFIKASI MODAL (NOTIF CENTER) */}
      {isNotifCenterOpen && (
        <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsNotifCenterOpen(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-20 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl relative border-t sm:border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 shrink-0 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-4 shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-900 dark:text-slate-100 leading-tight">Pusat Notifikasi</h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Pembaruan status servis & teknisi</p>
                </div>
              </div>
              <button onClick={() => setIsNotifCenterOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-transform">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* WEB PUSH STATUS & PERMISSION BANNER */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-3.5 mb-4 shrink-0 flex items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">Notifikasi Browser</span>
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  {notifPermission === 'granted' ? 'Push notification aktif di browser Anda.' : 'Aktifkan agar selalu dapat info terbaru dari teknisi.'}
                </p>
              </div>
              {notifPermission !== 'granted' ? (
                <button
                  onClick={async (e) => {
                    triggerRipple(e);
                    const res = await requestNotificationPermission();
                    setNotifPermission(res);
                    if (res === 'granted') {
                      playNotificationSound();
                      showToast('Push notifikasi browser berhasil diaktifkan!', 'success');
                    }
                  }}
                  className="ripple-btn px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-xl shadow-xs active:scale-95 transition-transform shrink-0"
                >
                  Aktifkan
                </button>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1 shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              )}
            </div>

            {/* ACTION SIMULASI TEST NOTIFIKASI */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Riwayat Status</span>
              <button
                onClick={(e) => {
                  triggerRipple(e);
                  dispatchOrderNotification(
                    'CRB-35580',
                    '🔧 Teknisi Menuju Lokasi Anda',
                    'Teknisi OMEANFIX sedang menuju alamat Anda untuk pengecekan unit kulkas.',
                    'proses'
                  );
                  setIsNotifCenterOpen(false);
                }}
                className="ripple-btn text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline active:scale-95 transition-transform"
              >
                Uji Notifikasi Lokal
              </button>
            </div>

            {/* LIST RIWAYAT NOTIFIKASI */}
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2.5 pr-1">
              {notifHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Belum Ada Notifikasi</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Pembaruan dari teknisi akan muncul di sini secara otomatis.</p>
                </div>
              ) : (
                notifHistory.map((notif) => (
                  <div key={notif.id} className="bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                          #{notif.orderCode}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          notif.statusType === 'selesai' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                          notif.statusType === 'pembayaran' ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                          notif.statusType === 'jadwal' ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' :
                          notif.statusType === 'proses' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                          'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {notif.statusType}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{notif.timestamp}</span>
                    </div>
                    <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{notif.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                ))
              )}
            </div>

            {notifHistory.length > 0 && (
              <button
                onClick={() => {
                  setNotifHistory([]);
                  sessionStorage.removeItem('omeanfix_notifs');
                }}
                className="mt-3 py-2 text-center text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 w-full"
              >
                Hapus Semua Riwayat Notifikasi
              </button>
            )}
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION BANNER */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30' 
              : toast.type === 'info'
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/30'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/30'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'info' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'info' ? <Clock className="w-5 h-5 animate-pulse" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <p className="text-[12px] font-bold leading-snug flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} selectedCategory={selectedCategory} />
    </div>
  );
}