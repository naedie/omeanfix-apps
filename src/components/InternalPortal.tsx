import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RefreshCw, Menu, X, FileText, Package, Layers, 
  BarChart3, Settings, Trash2, Edit3, Box, Megaphone, 
  Loader2, Hash, Award, UserPlus, Users, Search, Mail, Phone, User,
  Wind, Car, ShieldCheck, Wrench, Snowflake, Truck, Zap, Smartphone, CheckCircle2, Ticket, QrCode, Printer, Plus, ChevronLeft, ChevronRight, Calendar, Camera, Home, MessageCircle, ChevronDown, ChevronUp, XCircle, Wallet, TrendingUp, TrendingDown, DollarSign, CreditCard 
} from 'lucide-react';
import { supabase } from '../supabase';
import { triggerRipple } from '../utils/ripple';

interface InternalPortalProps {
  onBackToCustomer: () => void;
}

const ADMIN_MODULES = [
  { id: 'dashboard', label: 'Dashboard Analitik', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'pesanan', label: 'Kelola Pesanan', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'pelanggan', label: 'Data Pelanggan', icon: Users, color: 'text-sky-600', bg: 'bg-sky-100' },
  { id: 'banner', label: 'Manajemen Banner', icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-100' },
  { id: 'voucher', label: 'Manajemen Voucher', icon: Ticket, color: 'text-teal-600', bg: 'bg-teal-100' },
  { id: 'katalog', label: 'Katalog Reguler', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'katalog_khusus', label: 'Katalog Khusus', icon: Award, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100' },
  { id: 'stok', label: 'Manajemen Stok', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'laporan', label: 'Laporan & Keuangan', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 'pengaturan', label: 'Pengaturan Sistem', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-200' }
];

const MENU_SECTIONS = [
  { title: 'Ringkasan & Analitik', items: ['dashboard'] },
  { title: 'Operasional Utama', items: ['pesanan', 'pelanggan'] },
  { title: 'Etalase & Beranda', items: ['banner', 'voucher', 'katalog', 'katalog_khusus', 'stok'] },
  { title: 'Sistem & Laporan', items: ['laporan', 'pengaturan'] }
];

export default function InternalPortal({ onBackToCustomer }: InternalPortalProps) {
  // 1. GLOBAL & NAVIGATION STATES
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 2. DATA MASTER STATES
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [specialSubs, setSpecialSubs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceUnits, setServiceUnits] = useState<any[]>([]);
  const [savedBanners, setSavedBanners] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [specialCatalogs, setSpecialCatalogs] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<any[]>([]);

  // 3. UI NOTIFICATIONS & MODALS
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    type?: 'danger' | 'primary' | 'success';
    onConfirm: () => void;
  } | null>(null);
  const [viewPhotoModal, setViewPhotoModal] = useState<string | null>(null);
  const [viewReceiptModal, setViewReceiptModal] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<any | null>(null);

  // 4. MODULE SPECIFIC STATES
  // Dashboard
  const [dashboardTab, setDashboardTab] = useState<'operasional' | 'statistik'>('operasional');

  // Manajemen Pelanggan
  const [customerTab, setCustomerTab] = useState<'reguler' | 'member'>('reguler');
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingCustId, setEditingCustId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);
  
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [subDuration, setSubDuration] = useState('1_bulan');
  const [subStatus, setSubStatus] = useState('aktif');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  // Kelola Pesanan
  const [orderTab, setOrderTab] = useState<'baru' | 'proses' | 'jadwal' | 'selesai' | 'batal'>('baru');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(0);
  const [orderPerPage, setOrderPerPage] = useState(5);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Record<string, string>>({});
  const [estimasiInput, setEstimasiInput] = useState<Record<string, string>>({});
  const [invoiceInputs, setInvoiceInputs] = useState<Record<string, {jasa: string, part: string, layanan: string, desc: string}>>({});
  const [settlingOrderId, setSettlingOrderId] = useState<string | null>(null);
  const [dpNominalInputs, setDpNominalInputs] = useState<Record<string, number>>({});
  const [dpBankInputs, setDpBankInputs] = useState<Record<string, string>>({});
  const [isVerifyingDp, setIsVerifyingDp] = useState<Record<string, boolean>>({});

  // Katalog Reguler & Khusus
  const [katalogTab, setKatalogTab] = useState<'kategori' | 'objek'>('kategori');
  const [objekFilter, setObjekFilter] = useState('Semua');
  const [expandedObjKategori, setExpandedObjKategori] = useState<string[]>([]);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  
  const [unitName, setUnitName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [isSubmittingUnit, setIsSubmittingUnit] = useState(false);

  const [spcTitle, setSpcTitle] = useState('');
  const [spcCategory, setSpcCategory] = useState('');
  const [spcSubtitle, setSpcSubtitle] = useState('');
  const [spcDesc, setSpcDesc] = useState('');
  const [spcBenefits, setSpcBenefits] = useState('');
  const [spcCta, setSpcCta] = useState('');
  const [spcTheme, setSpcTheme] = useState('sky');
  const [spcIcon, setSpcIcon] = useState('Wind');
  const [isSubmittingSpc, setIsSubmittingSpc] = useState(false);
  const [editingSpcId, setEditingSpcId] = useState<string | null>(null);

  // Banner & Voucher
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [bannerLabelFilter, setBannerLabelFilter] = useState('Semua');
  const [bannerBgUrl, setBannerBgUrl] = useState('');
  const [bannerLabel, setBannerLabel] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDesc, setBannerDesc] = useState('');
  const [bannerBtnText, setBannerBtnText] = useState('');
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);

  const [isVoucherFormOpen, setIsVoucherFormOpen] = useState(false);
  const [voucherFilterCat, setVoucherFilterCat] = useState('Semua');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherTitle, setVoucherTitle] = useState('');
  const [voucherCategory, setVoucherCategory] = useState('');
  const [voucherDesc, setVoucherDesc] = useState('');
  const [voucherTheme, setVoucherTheme] = useState('rose');
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);

  // Manajemen Stok (Slide-Up Modal Support)
  const [stokFilter, setStokFilter] = useState('Semua');
  const [stokUnitFilter, setStokUnitFilter] = useState('Semua');
  const [stokSearch, setStokSearch] = useState('');
  const [stokPage, setStokPage] = useState(0);
  const [isStokModalOpen, setIsStokModalOpen] = useState(false);
  const stokPerPage = 6;
  
  const [partName, setPartName] = useState('');
  const [partCategoryId, setPartCategoryId] = useState('');
  const [partUnitId, setPartUnitId] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('');
  const [partImage, setPartImage] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<any | null>(null);

  // Laporan & Keuangan
  const [financeTab, setFinanceTab] = useState<'ringkasan' | 'piutang' | 'pesanan' | 'operasional'>('ringkasan');
  const [financePeriod, setFinancePeriod] = useState<'semua' | 'bulan_ini'>('bulan_ini');
  const [opType, setOpType] = useState('PENGELUARAN');
  const [opCategory, setOpCategory] = useState('Operasional');
  const [opAmount, setOpAmount] = useState('');
  const [opDesc, setOpDesc] = useState('');
  const [opSettled, setOpSettled] = useState('true');
  const [isSubmittingOp, setIsSubmittingOp] = useState(false);

  // --- UTILITY FUNCTIONS ---
  const showToastMsg = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [resCat, resUnit, resBanner, resPart, resOrders, resSpcCat, resSpcSubs, resVouchers, resCustomers, resLedger] = await Promise.all([
        supabase.from('service_categories').select('*').order('id', { ascending: true }),
        supabase.from('services').select('*').order('id', { ascending: false }),
        supabase.from('banners').select('*').order('id', { ascending: false }),
        supabase.from('spare_parts').select('*').order('id', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('special_services_catalog').select('*').order('created_at', { ascending: false }),
        supabase.from('special_service_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('vouchers_promos').select('*').order('id', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_ledger').select('*').order('created_at', { ascending: false })
      ]);

      if (resCat.data) setCategories(resCat.data);
      if (resUnit.data) setServiceUnits(resUnit.data);
      if (resBanner.data) setSavedBanners(resBanner.data);
      if (resPart.data) setSpareParts(resPart.data);
      if (resOrders.data) setAdminOrders(resOrders.data);
      if (resSpcCat.data) setSpecialCatalogs(resSpcCat.data);
      if (resSpcSubs.data) setSpecialSubs(resSpcSubs.data);
      if (resVouchers.data) setVouchers(resVouchers.data);
      if (resCustomers.data) setCustomersData(resCustomers.data);
      if (resLedger.data) setLedgerData(resLedger.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Supabase Realtime Sync
    const channel = supabase
      .channel('portal-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_ledger' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeModule]);

  // Reset order list state when tab/search changes
  useEffect(() => {
    setOrderPage(0);
    setExpandedOrderId(null);
    setConfirmingCancelId(null);
  }, [orderTab, orderSearch, orderPerPage]);

  const getThemeMapping = (theme: string) => {
    if (theme === 'sky') return { bg_class: 'bg-sky-50', icon_color: 'text-sky-500', border_color: 'border-sky-100' };
    if (theme === 'indigo') return { bg_class: 'bg-indigo-50', icon_color: 'text-indigo-500', border_color: 'border-indigo-100' };
    if (theme === 'emerald') return { bg_class: 'bg-emerald-50', icon_color: 'text-emerald-500', border_color: 'border-emerald-100' };
    if (theme === 'rose') return { bg_class: 'bg-rose-50', icon_color: 'text-rose-500', border_color: 'border-rose-100' };
    return { bg_class: 'bg-slate-50', icon_color: 'text-slate-500', border_color: 'border-slate-100' };
  };

  const getIconComponent = (name: string, className: string) => {
    if (name === 'Wind') return <Wind className={className} />;
    if (name === 'Car') return <Car className={className} />;
    if (name === 'ShieldCheck') return <ShieldCheck className={className} />;
    if (name === 'Wrench') return <Wrench className={className} />;
    if (name === 'Snowflake') return <Snowflake className={className} />;
    if (name === 'Truck') return <Truck className={className} />;
    if (name === 'Zap') return <Zap className={className} />;
    if (name === 'Smartphone') return <Smartphone className={className} />;
    return <Layers className={className} />; 
  };

  // ==========================================
  // --- CRUD & OPERATIONAL FUNCTIONS ---
  // ==========================================

  // 1. MANAJEMEN PELANGGAN (REGULER & VIP)
  const cancelEditCust = () => {
    setEditingCustId(null);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
  };

  const handleEditCust = (cust: any) => {
    setEditingCustId(cust.id);
    setCustName(cust.full_name || '');
    setCustPhone(cust.phone_number || '');
    setCustEmail(cust.email || '');
  };

  const handleSaveCust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustId || !custName || !custPhone) return;
    setIsSubmittingCust(true);
    try {
      const { error } = await supabase.from('customers').update({
        full_name: custName,
        phone_number: custPhone,
        email: custEmail
      }).eq('id', editingCustId);
      
      if (error) throw error;
      showToastMsg('Data pelanggan berhasil diperbarui!', 'success');
      cancelEditCust();
      fetchData();
    } catch (err: any) {
      showToastMsg('Gagal update: ' + err.message, 'error');
    } finally {
      setIsSubmittingCust(false);
    }
  };

  // Member VIP
  const cancelEditSub = () => {
    setEditingSubId(null);
    setShowSubForm(false);
    setSubName('');
    setSubPhone('');
    setSubTitle('');
    setSubDuration('1_bulan');
    setSubStatus('aktif');
  };

  const handleEditSub = (sub: any) => {
    setEditingSubId(sub.id);
    setShowSubForm(true);
    setSubName(sub.customer_name || '');
    setSubPhone(sub.customer_phone || '');
    setSubTitle(sub.custom_service_title || '');
    setSubDuration(sub.duration || '1_bulan');
    setSubStatus(sub.status || 'aktif');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subPhone || !subTitle) {
      showToastMsg('Harap isi Nama, WA, dan Paket Layanan!', 'error');
      return;
    }
    setIsSubmittingSub(true);
    try {
      const payload = {
        customer_name: subName,
        customer_phone: subPhone,
        custom_service_title: subTitle,
        duration: subDuration,
        status: subStatus,
        subscription_code: `MBR-${Math.floor(Math.random() * 9000) + 1000}`
      };
      
      if (editingSubId) {
        await supabase.from('special_service_subscriptions').update(payload).eq('id', editingSubId);
      } else {
        await supabase.from('special_service_subscriptions').insert([payload]);
      }
      
      showToastMsg('Data member VIP berhasil disimpan!', 'success');
      cancelEditSub();
      fetchData();
    } catch (err: any) {
      showToastMsg('Gagal menyimpan member: ' + err.message, 'error');
    } finally {
      setIsSubmittingSub(false);
    }
  };


  // 2. KELOLA PESANAN (ORDERS)
  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').update({
        status: 'Dibatalkan'
      }).eq('id', orderId);
      
      if (error) throw error;
      showToastMsg('Pesanan berhasil dibatalkan', 'success');
      setConfirmingCancelId(null);
      fetchData();
    } catch (err: any) {
      showToastMsg('Gagal membatalkan pesanan: ' + err.message, 'error');
    }
  };

  const handleConfirmStatus = async (orderId: string) => {
    const newStatus = pendingStatusUpdates[orderId];
    if (!newStatus) return;
    try {
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'Selesai') {
        updatePayload.payment_status = 'lunas';
      } else if (newStatus === 'Menunggu Pembayaran') {
        updatePayload.payment_status = 'belum_dibayar';
      }
      
      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) throw error;
      
      showToastMsg(`Status pesanan berhasil diperbarui menjadi "${newStatus}"`, 'success');
      fetchData();
      setPendingStatusUpdates(prev => { const ns = { ...prev }; delete ns[orderId]; return ns; });
    } catch (err: any) {
      showToastMsg('Gagal mengubah status: ' + err.message, 'error');
    }
  };

  const handleSendEstimasi = async (orderId: string, currentNote: string) => {
    const val = estimasiInput[orderId];
    if (!val) return;
    try {
      const cleanNote = (currentNote || '').replace(/\[ESTIMASI:[^\]]+\]/g, '').trim();
      const newNote = cleanNote ? `${cleanNote} [ESTIMASI:${val}]` : `[ESTIMASI:${val}]`;
      
      const { error } = await supabase.from('orders').update({ note: newNote }).eq('id', orderId);
      if (error) throw error;
      
      showToastMsg("Estimasi biaya berhasil diinfokan!", "success");
      fetchData();
      setEstimasiInput(prev => { const ns = { ...prev }; delete ns[orderId]; return ns; });
    } catch (err: any) {
      showToastMsg("Gagal menyimpan estimasi: " + err.message, "error");
    }
  };

  const handleSendInvoice = async (orderId: string, currentNote: string) => {
    const inv = invoiceInputs[orderId];
    if (!inv) return;
    const jasa = Number(inv.jasa) || 0;
    const part = Number(inv.part) || 0;
    const layanan = Number(inv.layanan) || 0;
    const total = jasa + part + layanan;
    const desc = (inv.desc || '-').replace(/\|/g, ' ').replace(/\]/g, ' ').trim();
    
    try {
      let cleanNote = (currentNote || '')
        .replace(/\[ESTIMASI:[^\]]+\]/g, '')
        .replace(/\[INVOICE:[^\]]+\]/g, '')
        .trim();
        
      const invString = `[INVOICE:J=${jasa}|P=${part}|L=${layanan}|T=${total}|D=${desc}]`;
      const newNote = cleanNote ? `${cleanNote} ${invString}` : invString;
      
      const { error } = await supabase.from('orders').update({
        note: newNote,
        status: 'Menunggu Pembayaran',
        payment_status: 'belum_dibayar'
      }).eq('id', orderId);
      
      if (error) throw error;
      showToastMsg("Tagihan/Invoice berhasil diterbitkan!", "success");
      fetchData();
      setInvoiceInputs(p => { const ns = {...p}; delete ns[orderId]; return ns; });
      setPendingStatusUpdates(p => { const ns = {...p}; delete ns[orderId]; return ns; });
    } catch (err: any) {
      showToastMsg("Gagal kirim invoice: " + err.message, "error");
    }
  };

  const handleVerifyDpAndProceed = async (ord: any, nominal: number, bank: string) => {
    if (!ord) return;
    const orderId = ord.id;
    setIsVerifyingDp(prev => ({ ...prev, [orderId]: true }));
    try {
      const currentNote = ord.note || ord.complaint || ord.complaint_description || '';
      const cleanNote = currentNote.replace(/\[DP:[^\]]+\]/g, '').trim();
      const dpTag = `[DP:NOMINAL=${nominal}|STATUS=lunas|BANK=${bank}]`;
      const newNote = cleanNote ? `${cleanNote} ${dpTag}` : dpTag;

      // Update status pesanan ke Ditangani
      const { error: updateErr } = await supabase.from('orders').update({
        note: newNote,
        status: 'Ditangani'
      }).eq('id', orderId);

      if (updateErr) throw updateErr;

      // Catat DP ke Financial Ledger sebagai Pemasukan Uang Muka
      const orderRef = String(ord.id);
      const cName = ord.customer_name || 'Pelanggan';
      await supabase.from('financial_ledger').insert([{
        transaction_type: 'PEMASUKAN',
        category: 'Uang Muka (DP) Servis',
        amount: nominal,
        description: `Pemasukan DP / Tanda Jadi #${ord.order_code || orderRef.slice(0, 8)} - ${cName} via ${bank}`,
        reference_order_id: orderRef,
        is_settled: true
      }]);

      showToastMsg(`✅ DP Rp ${nominal.toLocaleString('id-ID')} berhasil diverifikasi! Status pesanan otomatis beralih ke "Ditangani / Tahap Pengerjaan"`, 'success');
      await fetchData();
    } catch (err: any) {
      showToastMsg('Gagal memverifikasi DP: ' + err.message, 'error');
    } finally {
      setIsVerifyingDp(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Otomatisasi Pemecahan Piutang ke Financial Ledger
  const executeSettlement = async (ord: any, invDataParam: any) => {
    setSettlingOrderId(ord.id);
    try {
      const noteStr = ord.note || ord.complaint || ord.complaint_description || '';
      let invData = invDataParam || {};
      
      // Ekstrak invoice jika belum ada
      if (!invData.t && !invData.total && !invData.T && !invData.j && !invData.jasa && !invData.J) {
        const match = noteStr.match(/\[INVOICE:\s*([^\]]+)\]/);
        if (match && match[1]) {
          invData = {};
          match[1].split('|').forEach((p: string) => {
            const [k, v] = p.split('=');
            if (k && v) {
              const key = k.trim().toLowerCase();
              invData[key] = key === 'd' ? v.trim() : Number(v.trim()) || 0;
            }
          });
        }
      }
      
      // Update status orders
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
           status: 'Selesai',
           payment_status: 'lunas'
         })
        .eq('id', ord.id);
        
      if (updateErr) throw updateErr;
      
      // Cek ledger
      const orderRef = String(ord.id);
      const { data: exist } = await supabase
        .from('financial_ledger')
        .select('id')
        .eq('reference_order_id', orderRef);
        
      if (!exist || exist.length === 0) {
        const payloads = [];
        const cName = ord.customer_name || 'Pelanggan';
        const nominalJasa = Number(invData?.j || invData?.jasa || invData?.J || 0);
        const nominalPart = Number(invData?.p || invData?.part || invData?.P || 0);
        const nominalLayanan = Number(invData?.l || invData?.layanan || invData?.L || 0);
        const totalInv = Number(invData?.t || invData?.total || invData?.T || (nominalJasa + nominalPart + nominalLayanan));
        
        if (nominalJasa > 0) {
          payloads.push({
            transaction_type: 'PEMASUKAN',
            category: 'Jasa Servis',
            amount: nominalJasa,
            description: `Pemasukan Jasa Servis #${ord.order_code || orderRef.slice(0, 8)} - ${cName}`,
            reference_order_id: orderRef,
            is_settled: true
          });
        }
        if (nominalPart > 0) {
          payloads.push({
            transaction_type: 'PEMASUKAN',
            category: 'Penjualan Sparepart',
            amount: nominalPart,
            description: `Pemasukan Sparepart #${ord.order_code || orderRef.slice(0, 8)} - ${cName}`,
            reference_order_id: orderRef,
            is_settled: true
          });
        }
        if (nominalLayanan > 0) {
          payloads.push({
            transaction_type: 'PEMASUKAN',
            category: 'Layanan Ekstra',
            amount: nominalLayanan,
            description: `Pemasukan Layanan #${ord.order_code || orderRef.slice(0, 8)} - ${cName}`,
            reference_order_id: orderRef,
            is_settled: true
          });
        }
        if (payloads.length === 0 && totalInv > 0) {
          payloads.push({
            transaction_type: 'PEMASUKAN',
            category: 'Jasa Servis',
            amount: totalInv,
            description: `Pemasukan Tagihan Pesanan #${ord.order_code || orderRef.slice(0, 8)} - ${cName}`,
            reference_order_id: orderRef,
            is_settled: true
          });
        }
        
        if (payloads.length > 0) {
          await supabase.from('financial_ledger').insert(payloads);
        }
      }
      
      showToastMsg("Pembayaran LUNAS! Pesanan selesai & otomatis masuk Buku Kas.", "success");
      await fetchData();
    } catch (err: any) {
      showToastMsg("Gagal memproses verifikasi pelunasan: " + err.message, "error");
    } finally {
      setSettlingOrderId(null);
    }
  };

  const handleVerifyPaymentAndSettle = (ord: any, invData: any) => {
    if (!ord) return;
    setConfirmModal({
      title: "Verifikasi Pembayaran & Pelunasan",
      message: `Konfirmasi pelunasan untuk Pesanan #${ord.order_code || String(ord.id).slice(0, 8)} (${ord.customer_name || 'Pelanggan'})?\n\nPembayaran akan ditandai LUNAS, status pesanan menjadi Selesai, dan nominal otomatis tercatat di Buku Kas.`,
      confirmLabel: "Ya, Verifikasi & Lunasi",
      type: "success",
      onConfirm: () => executeSettlement(ord, invData)
    });
  };

  const generateWaLink = (ord: any, cleanNote: string, schedule: string | null) => {
    const rawPhone = ord.customer_phone || ord.user_phone || '';
    if (!rawPhone) return '#';
    let cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    
    const orderId = ord.order_code ? `#${ord.order_code}` : 'PESANAN BARU';
    const unit = ord.unit_name || '-';
    const action = ord.action_type || 'Servis';
    const name = ord.customer_name || 'Kak';
    
    let text = `Halo kak *${name}*,\nKami dari Admin OMEANFIX ingin mengonfirmasi pesanan jasa Anda:\n\n  *No. Pesanan:* ${orderId}\n  *Unit:* ${unit} - ${action}\n  *Keluhan:* "${cleanNote}"`;
    if (schedule) text += `\n  *Jadwal Reservasi:* ${schedule}`;
    text += `\n\nApakah detail pesanan ini sudah sesuai? Terima kasih!`;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
  };

  const generateDpWaLink = (ord: any, cleanNote: string, schedule: string | null, dpNominal: number, selectedBank: string) => {
    const rawPhone = ord.customer_phone || ord.user_phone || '';
    if (!rawPhone) return '#';
    let cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    
    const orderId = ord.order_code ? `#${ord.order_code}` : 'ORD';
    const unit = ord.unit_name || '-';
    const action = ord.action_type || 'Servis';
    const name = ord.customer_name || 'Kak';

    let bankInfo = '';
    if (selectedBank === 'Mandiri') {
      bankInfo = '🏦 *Bank Mandiri*: 134-00-9876543-1\n  a/n *OMEANFIX SERVIS*';
    } else if (selectedBank === 'BRI') {
      bankInfo = '🏦 *Bank BRI*: 0123-01-002345-50-8\n  a/n *OMEANFIX SERVIS*';
    } else if (selectedBank === 'QRIS') {
      bankInfo = '📱 *QRIS OMEANFIX*: Silakan scan QRIS OMEANFIX dari Mobile Banking atau E-Wallet (GoPay, OVO, ShopeePay, DANA)';
    } else {
      bankInfo = '🏦 *Bank BCA*: 8090-554-321\n  a/n *PT OMEANFIX JAYA*';
    }

    let text = `*BERITA ACARA JADWAL & PEMBAYARAN TANDA JADI (DP)*\n*LAYANAN SERVIS OMEANFIX CIREBON*\n\n` +
      `Halo kak *${name}*,\n` +
      `Pesanan Anda telah kami jadwalkan dengan detail berikut:\n\n` +
      `  📋 *No. Pesanan:* ${orderId}\n` +
      `  🔧 *Unit & Layanan:* ${unit} (${action})\n` +
      `  📅 *Jadwal Kedatangan:* ${schedule || 'Sesuai kesepakatan'}\n` +
      `  📝 *Keluhan:* "${cleanNote}"\n\n` +
      `Sebagai tanda jadi reservasi jadwal teknisi dan persiapan sebelum menuju lokasi pelanggan, mohon untuk melakukan pembayaran *Uang Muka (DP)* sebesar:\n` +
      `👉 *Rp ${dpNominal.toLocaleString('id-ID')}*\n\n` +
      `Pembayaran dapat ditransfer ke:\n${bankInfo}\n\n` +
      `📌 *Petunjuk Konfirmasi:*\n` +
      `1. Silakan balas chat ini dengan mengirimkan foto bukti transfer Anda.\n` +
      `2. Setelah bukti kami terima, status pesanan langsung dialihkan ke *"Ditangani/Tahap Pengerjaan"* dan teknisi segera meluncur sesuai jadwal.\n` +
      `3. Nominal DP ini otomatis memotong total biaya jasa/pelunasan invoice akhir nanti.\n\n` +
      `Terima kasih atas kerja samanya kak! 🙏`;

    return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
  };

  const del = async (table: string, id: any) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        showToastMsg("Data berhasil dihapus", "info");
        fetchData();
      } catch (err: any) {
        showToastMsg("Gagal menghapus: " + err.message, "error");
      }
    }
  };

  const handleDeleteCust = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus akun pelanggan ini secara permanen?')) {
      try {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
        showToastMsg('Akun pelanggan berhasil dihapus', 'info');
        fetchData();
      } catch (err: any) {
        showToastMsg('Gagal menghapus pelanggan: ' + err.message, 'error');
      }
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus status/pendaftaran member ini?')) {
      try {
        const { error } = await supabase.from('special_service_subscriptions').delete().eq('id', id);
        if (error) throw error;
        showToastMsg('Data member VIP berhasil dihapus', 'info');
        fetchData();
      } catch (err: any) {
        showToastMsg('Gagal menghapus member VIP: ' + err.message, 'error');
      }
    }
  };

  const DEFAULT_SPAREPART_DESC = "Suku cadang original/berkualitas. Harga belum termasuk biaya pemasangan oleh teknisi.";

  const handleSavePart = async () => {
    if (!partName || !partCategoryId || !partUnitId || !partPrice || !partStock) {
      showToastMsg("Harap lengkapi nama, kategori, unit, harga, dan stok!", "error");
      return;
    }
    setIsSubmittingPart(true);
    try {
      const payload = { 
        name: partName,
        category_id: String(partCategoryId),
        unit_id: String(partUnitId),
        price: Number(partPrice),
        stock: Number(partStock),
        image_url: partImage,
        description: partDesc.trim() || DEFAULT_SPAREPART_DESC
      };
      if (editingPartId) {
        const { error } = await supabase.from('spare_parts').update(payload).eq('id', editingPartId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('spare_parts').insert([payload]);
        if (error) throw error;
      }
      showToastMsg("Suku cadang berhasil disimpan!", "success");
      setIsStokModalOpen(false);
      setEditingPartId(null);
      setPartName('');
      setPartPrice('');
      setPartStock('');
      setPartImage('');
      setPartDesc('');
      fetchData();
    } catch (err: any) {
      showToastMsg("Gagal menyimpan suku cadang: " + err.message, "error");
    } finally {
      setIsSubmittingPart(false);
    }
  };

  const cancelEditBanner = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerBgUrl('');
    setBannerLabel('');
    setBannerDesc('');
    setBannerBtnText('');
    setIsBannerFormOpen(false);
  };

  const handleEditBanner = (b: any) => {
    setEditingBannerId(b.id);
    setBannerBgUrl(b.bg_url || '');
    setBannerLabel(b.label || '');
    setBannerTitle(b.title || '');
    setBannerDesc(b.description || '');
    setBannerBtnText(b.btn_text || '');
    setIsBannerFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveBanner = async () => {
    if (!bannerTitle || !bannerBgUrl) {
      showToastMsg("URL Gambar dan Judul Utama wajib diisi!", "error");
      return;
    }
    setIsSubmittingBanner(true);
    const payload = {
      label: bannerLabel,
      title: bannerTitle,
      description: bannerDesc,
      btn_text: bannerBtnText,
      bg_url: bannerBgUrl
    };
    try {
      if (editingBannerId) {
        const { error } = await supabase.from('banners').update(payload).eq('id', editingBannerId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert([payload]);
        if (error) throw error;
      }
      showToastMsg("Banner promo berhasil disimpan!", "success");
      cancelEditBanner();
      fetchData();
    } catch (err: any) {
      showToastMsg("Gagal menyimpan banner: " + err.message, "error");
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  const cancelEditVoucher = () => {
    setEditingVoucherId(null);
    setVoucherCode('');
    setVoucherTitle('');
    setVoucherCategory('');
    setVoucherDesc('');
    setVoucherTheme('rose');
    setIsVoucherFormOpen(false);
  };

  const handleEditVoucher = (v: any) => {
    setEditingVoucherId(v.id);
    setVoucherCode(v.code || '');
    setVoucherTitle(v.title || '');
    setVoucherCategory(v.category || '');
    setVoucherDesc(v.description || '');
    setVoucherTheme(v.theme_color || 'rose');
    setIsVoucherFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveVoucher = async () => {
    if (!voucherTitle || !voucherCategory) {
      showToastMsg("Judul dan Kategori Voucher wajib diisi!", "error");
      return;
    }
    setIsSubmittingVoucher(true);
    const payload = {
      code: voucherCode.trim().toUpperCase(),
      title: voucherTitle.trim(),
      category: voucherCategory.trim(),
      description: voucherDesc.trim(),
      theme_color: voucherTheme,
      is_active: true
    };
    try {
      if (editingVoucherId) {
        const { error } = await supabase.from('vouchers_promos').update(payload).eq('id', editingVoucherId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vouchers_promos').insert([payload]);
        if (error) throw error;
      }
      showToastMsg("Voucher promo berhasil disimpan!", "success");
      cancelEditVoucher();
      fetchData();
    } catch (err: any) {
      showToastMsg("Gagal menyimpan voucher: " + err.message, "error");
    } finally {
      setIsSubmittingVoucher(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName) return;
    setIsSubmittingCat(true);
    try {
      if (editingCategoryId) {
        const { error } = await supabase.from('service_categories').update({ name: categoryName, icon: categoryIcon }).eq('id', editingCategoryId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('service_categories').insert([{ name: categoryName, icon: categoryIcon }]);
        if (error) throw error;
      }
      showToastMsg("Kategori jasa berhasil disimpan!", "success");
      setEditingCategoryId(null);
      setCategoryName('');
      setCategoryIcon('');
      fetchData();
    } catch (err: any) {
      showToastMsg("Gagal menyimpan kategori: " + err.message, "error");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleSaveUnit = async () => {
    if (!unitName || !selectedCategoryId) return;
    setIsSubmittingUnit(true);
    try {
      const payload = { name: unitName, category_id: String(selectedCategoryId) };
      if (editingUnitId) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingUnitId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert([payload]);
        if (error) throw error;
      }
      showToastMsg("Unit/Objek berhasil disimpan!", "success");
      setEditingUnitId(null);
      setUnitName('');
      fetchData();
    } catch (err: any) {
      showToastMsg("Gagal menyimpan unit: " + err.message, "error");
    } finally {
      setIsSubmittingUnit(false);
    }
  };

  const handleSaveSpc = async () => {
    if (!spcTitle || !spcCategory) {
      showToastMsg('Judul dan Kategori wajib diisi', 'error');
      return;
    }
    setIsSubmittingSpc(true);
    try {
      const themeColors = getThemeMapping(spcTheme);
      const benefitsArray = spcBenefits.split(',').map(b => b.trim()).filter(b => b.length > 0);
      const payload = {
        title: spcTitle,
        category: spcCategory,
        subtitle: spcSubtitle || 'Member',
        description: spcDesc,
        benefits: benefitsArray,
        cta_text: spcCta || 'Pesan Sekarang',
        icon_name: spcIcon,
        image_url: '',
        ...themeColors
      };
      
      if (editingSpcId) {
        const { error } = await supabase.from('special_services_catalog').update(payload).eq('id', editingSpcId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('special_services_catalog').insert([payload]);
        if (error) throw error;
      }
      
      showToastMsg('Paket VIP berhasil disimpan!', 'success');
      setEditingSpcId(null);
      setSpcTitle('');
      setSpcCategory('');
      setSpcSubtitle('');
      setSpcDesc('');
      setSpcBenefits('');
      setSpcCta('');
      fetchData();
    } catch (err: any) {
      showToastMsg('Gagal menyimpan paket VIP: ' + err.message, 'error');
    } finally {
      setIsSubmittingSpc(false);
    }
  };

  const handleSaveManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opAmount || !opCategory) return;
    setIsSubmittingOp(true);
    try {
      const payload = {
        transaction_type: opType,
        category: opCategory,
        amount: Number(opAmount),
        description: opDesc || '-',
        is_settled: opSettled === 'true'
      };
      const { error } = await supabase.from('financial_ledger').insert([payload]);
      if (error) throw error;
      showToastMsg("Catatan kas manual berhasil disimpan!", "success");
      setOpAmount('');
      setOpDesc('');
      fetchData();
    } catch (err: any) {
      showToastMsg("Gagal menyimpan catatan kas: " + err.message, "error");
    } finally {
      setIsSubmittingOp(false);
    }
  };


  // ==========================================
  // --- RENDER MODULES ---
  // ==========================================

  const renderDashboard = () => {
    const totalOrdersCount = adminOrders.length;
    const newOrdersCount = adminOrders.filter(o => (o.status || o.order_status || '').toLowerCase() === 'baru' || (o.status || o.order_status || '').toLowerCase() === 'menunggu_konfirmasi' || (o.status || o.order_status || '').toLowerCase() === 'menunggu konfirmasi').length;
    const activeOrdersCount = adminOrders.filter(o => ['proses', 'dalam_pengerjaan', 'ditangani', 'dijadwalkan', 'jadwal'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const completedOrdersCount = adminOrders.filter(o => ['selesai', 'lunas', 'menunggu pembayaran'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const cancelledOrdersCount = adminOrders.filter(o => ['dibatalkan', 'batal'].includes((o.status || o.order_status || '').toLowerCase())).length;
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    ledgerData.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.transaction_type === 'PEMASUKAN' && item.is_settled) totalIncome += amt;
      else if (item.transaction_type === 'PENGELUARAN' && item.is_settled) totalExpense += amt;
    });
    
    const netProfit = totalIncome - totalExpense;
    const totalCustomers = customersData.length;
    const vipMembers = specialSubs.filter(s => s.status === 'aktif').length;
    const lowStockParts = spareParts.filter(p => Number(p.stock) <= 3);
    const pendingOrders = adminOrders.filter(o => ['baru', 'menunggu_konfirmasi', 'menunggu konfirmasi'].includes((o.status || o.order_status || '').toLowerCase())).slice(0, 3);

    // Variabel untuk chart
    let omzetJasa = 0;
    let omzetSparepart = 0;
    let omzetLayanan = 0;
    
    ledgerData.forEach(trx => {
      if (trx.transaction_type === 'PEMASUKAN' && trx.is_settled) {
        if (trx.category === 'Jasa Servis') omzetJasa += Number(trx.amount || 0);
        if (trx.category === 'Penjualan Sparepart' || trx.category === 'Sparepart') omzetSparepart += Number(trx.amount || 0);
        if (trx.category === 'Layanan Ekstra' || trx.category === 'Layanan') omzetLayanan += Number(trx.amount || 0);
      }
    });

    return (
      <div className="animate-in fade-in pb-10 space-y-5">
        {/* Banner Utama */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 rounded-[24px] p-5 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10">
            <span className="px-2.5 py-1 bg-white/20 text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full backdrop-blur-md inline-block mb-2">
              Analitik Real-Time
            </span>
            <h2 className="text-[20px] font-black tracking-tight leading-tight">Ringkasan Operasional OMEANFIX</h2>
            <p className="text-[11px] font-medium text-blue-100 mt-1">
              Pantau performa bisnis, pemasukan, pesanan, dan ketersediaan stok secara otomatis.
            </p>
          </div>
        </div>

        {/* 2 Sub-Tabs Dashboard */}
        <div className="flex p-1 bg-slate-200/60 backdrop-blur-sm rounded-xl mb-4">
          <button 
            onClick={() => setDashboardTab('operasional')} 
            className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all outline-none ${dashboardTab === 'operasional' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Operasional
          </button>
          <button 
            onClick={() => setDashboardTab('statistik')} 
            className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all outline-none ${dashboardTab === 'statistik' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Statistik & Evaluasi
          </button>
        </div>

        {dashboardTab === 'operasional' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Omset / Masuk</span>
                <span className="text-[16px] font-black text-slate-900 block mt-0.5">Rp {totalIncome.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Laba Bersih</span>
                <span className={`text-[16px] font-black block mt-0.5 ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  Rp {netProfit.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Status Pesanan
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Total: {totalOrdersCount}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-2xl text-center">
                  <span className="text-[18px] font-black text-amber-600 block">{newOrdersCount}</span>
                  <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter block mt-0.5">Baru</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-2xl text-center">
                  <span className="text-[18px] font-black text-blue-600 block">{activeOrdersCount}</span>
                  <span className="text-[9px] font-bold text-blue-700 uppercase tracking-tighter block mt-0.5">Proses</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl text-center">
                  <span className="text-[18px] font-black text-emerald-600 block">{completedOrdersCount}</span>
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tighter block mt-0.5">Selesai</span>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-2xl text-center">
                  <span className="text-[18px] font-black text-rose-600 block">{cancelledOrdersCount}</span>
                  <span className="text-[9px] font-bold text-rose-700 uppercase tracking-tighter block mt-0.5">Batal</span>
                </div>
              </div>
              {totalOrdersCount > 0 && (
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex mt-2">
                  <div style={{ width: `${(newOrdersCount / totalOrdersCount) * 100}%` }} className="bg-amber-500 h-full"></div>
                  <div style={{ width: `${(activeOrdersCount / totalOrdersCount) * 100}%` }} className="bg-blue-500 h-full"></div>
                  <div style={{ width: `${(completedOrdersCount / totalOrdersCount) * 100}%` }} className="bg-emerald-500 h-full"></div>
                  <div style={{ width: `${(cancelledOrdersCount / totalOrdersCount) * 100}%` }} className="bg-rose-500 h-full"></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800">Pelanggan</span>
                </div>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-[20px] font-black text-slate-900">{totalCustomers}</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                    {vipMembers} VIP
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800">Stok Part</span>
                </div>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-[20px] font-black text-slate-900">{spareParts.length}</span>
                  {lowStockParts.length > 0 ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      {lowStockParts.length} Menipis
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Aman
                    </span>
                  )}
                </div>
              </div>
            </div>

            {lowStockParts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-[20px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-800 flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-amber-600" /> Peringatan Stok ({lowStockParts.length})
                  </span>
                  <button onClick={() => setActiveModule('stok')} className="text-[10px] font-bold text-amber-700 underline">
                    Kelola Stok &rarr;
                  </button>
                </div>
                <div className="space-y-1.5 pt-1">
                  {lowStockParts.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-[11px] bg-white/80 px-3 py-1.5 rounded-xl border border-amber-100">
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">{item.name}</span>
                      <span className="font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">Sisa {item.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-500" /> Pesanan Perlu Konfirmasi
                </h3>
                <button onClick={() => setActiveModule('pesanan')} className="text-[11px] font-bold text-blue-600 hover:underline">
                  Lihat Semua ({newOrdersCount})
                </button>
              </div>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  Tidak ada pesanan baru.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingOrders.map(ord => (
                    <div key={ord.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-blue-600 block mb-0.5">#{ord.order_code || String(ord.id).slice(0,8)}</span>
                        <h4 className="font-bold text-slate-800 text-[12px]">{ord.customer_name || 'Pelanggan'}</h4>
                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">{ord.unit_name || 'Unit Servis'}</p>
                      </div>
                      <button onClick={() => setActiveModule('pesanan')} className="px-3 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all">
                        Proses
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm space-y-2.5">
              <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-400">Akses Cepat Admin</h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setActiveModule('pesanan')} className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-center hover:bg-blue-100 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">Pesanan</span>
                </button>
                <button onClick={() => setActiveModule('stok')} className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center hover:bg-emerald-100 transition-colors">
                  <Package className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">Tambah Stok</span>
                </button>
                <button onClick={() => setActiveModule('laporan')} className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-center hover:bg-amber-100 transition-colors">
                  <Wallet className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block">Buku Kas</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            {/* Native Tailwind Charts */}
            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-4">Grafik Arus Kas Keseluruhan</h3>
              <div className="flex items-end gap-6 h-36 w-full px-4 border-b border-slate-100 pb-2">
                <div className="flex flex-col items-center flex-1 gap-2 h-full justify-end group">
                  <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all shadow-md group-hover:opacity-80" 
                       style={{ height: `${Math.min((totalIncome / (totalIncome + totalExpense || 1)) * 100, 100)}%`, minHeight: '15%' }}>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Pemasukan</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-2 h-full justify-end group">
                  <div className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl transition-all shadow-md group-hover:opacity-80" 
                       style={{ height: `${Math.min((totalExpense / (totalIncome + totalExpense || 1)) * 100, 100)}%`, minHeight: '15%' }}>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Pengeluaran</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 px-2">
                <span className="text-[11px] font-bold text-emerald-600">+ Rp {totalIncome.toLocaleString('id-ID')}</span>
                <span className="text-[11px] font-bold text-rose-600">- Rp {totalExpense.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-4">Distribusi Sumber Omzet</h3>
              <div className="flex w-full h-10 rounded-xl overflow-hidden mb-3 shadow-inner">
                <div className="bg-indigo-500 h-full hover:opacity-90 transition-opacity" style={{ width: `${(omzetJasa / (totalIncome || 1)) * 100}%` }}></div>
                <div className="bg-amber-500 h-full hover:opacity-90 transition-opacity" style={{ width: `${(omzetSparepart / (totalIncome || 1)) * 100}%` }}></div>
                <div className="bg-teal-500 h-full hover:opacity-90 transition-opacity" style={{ width: `${(omzetLayanan / (totalIncome || 1)) * 100}%` }}></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-slate-700">Jasa Servis</span></div>
                  <span className="text-slate-900">Rp {omzetJasa.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-slate-700">Suku Cadang</span></div>
                  <span className="text-slate-900">Rp {omzetSparepart.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-teal-500"></div><span className="text-slate-700">Layanan Ekstra</span></div>
                  <span className="text-slate-900">Rp {omzetLayanan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">Evaluasi Status Pesanan (Total)</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-12 text-slate-600">Selesai</span>
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-emerald-500 h-full rounded-full" style={{width: `${(completedOrdersCount / (totalOrdersCount || 1)) * 100}%`}}></div>
                  </div>
                  <span className="text-[11px] font-black text-slate-800 w-8 text-right">{completedOrdersCount}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-12 text-slate-600">Batal</span>
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-rose-500 h-full rounded-full" style={{width: `${(cancelledOrdersCount / (totalOrdersCount || 1)) * 100}%`}}></div>
                  </div>
                  <span className="text-[11px] font-black text-slate-800 w-8 text-right">{cancelledOrdersCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPesananMasuk = () => {
    // Advanced filtering logic for 5 Tabs
    const filteredOrders = adminOrders.filter(ord => {
      const st = (ord.status || ord.order_status || '').toLowerCase();
      let tabMatch = false;
      
      if (orderTab === 'baru') {
        tabMatch = ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima', 'baru'].includes(st);
      } else if (orderTab === 'proses') {
        tabMatch = ['ditangani', 'dalam_pengerjaan', 'proses'].includes(st);
      } else if (orderTab === 'jadwal') {
        tabMatch = ['dijadwalkan', 'jadwal'].includes(st);
      } else if (orderTab === 'selesai') {
        tabMatch = ['selesai', 'lunas', 'menunggu pembayaran', 'menunggu_pembayaran'].includes(st);
      } else if (orderTab === 'batal') {
        tabMatch = ['dibatalkan', 'batal'].includes(st);
      }
      
      if (!tabMatch) return false;
      
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const code = (ord.order_code || '').toLowerCase();
        const name = (ord.customer_name || '').toLowerCase();
        const phone = (ord.customer_phone || ord.user_phone || '').toLowerCase();
        const unit = (ord.unit_name || '').toLowerCase();
        return code.includes(q) || name.includes(q) || phone.includes(q) || unit.includes(q);
      }
      return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / orderPerPage) || 1;
    const currentOrders = filteredOrders.slice(orderPage * orderPerPage, (orderPage + 1) * orderPerPage);

    // Calculate Badges
    const pesananBaruCount = adminOrders.filter(o => ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima', 'baru'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const prosesCount = adminOrders.filter(o => ['ditangani', 'dalam_pengerjaan', 'proses'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const jadwalCount = adminOrders.filter(o => ['dijadwalkan', 'jadwal'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const selesaiCount = adminOrders.filter(o => ['selesai', 'lunas', 'menunggu pembayaran', 'menunggu_pembayaran'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const batalCount = adminOrders.filter(o => ['dibatalkan', 'batal'].includes((o.status || o.order_status || '').toLowerCase())).length;

    return (
      <div className="animate-in fade-in pb-10 space-y-4">
        {/* 5 Filter Tabs with Badges */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl overflow-x-auto no-scrollbar gap-1">
          <button onClick={() => setOrderTab('baru')} className={`flex-1 min-w-[70px] py-2 px-2 text-[11px] font-bold rounded-lg outline-none flex items-center justify-center gap-1 ${orderTab === 'baru' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Baru</span>
            {pesananBaruCount > 0 && <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] rounded-full font-extrabold">{pesananBaruCount}</span>}
          </button>
          <button onClick={() => setOrderTab('proses')} className={`flex-1 min-w-[75px] py-2 px-2 text-[11px] font-bold rounded-lg outline-none flex items-center justify-center gap-1 ${orderTab === 'proses' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Proses</span>
            {prosesCount > 0 && <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[9px] rounded-full font-extrabold">{prosesCount}</span>}
          </button>
          <button onClick={() => setOrderTab('jadwal')} className={`flex-1 min-w-[75px] py-2 px-2 text-[11px] font-bold rounded-lg outline-none flex items-center justify-center gap-1 ${orderTab === 'jadwal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Jadwal</span>
            {jadwalCount > 0 && <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[9px] rounded-full font-extrabold">{jadwalCount}</span>}
          </button>
          <button onClick={() => setOrderTab('selesai')} className={`flex-1 min-w-[75px] py-2 px-2 text-[11px] font-bold rounded-lg outline-none flex items-center justify-center gap-1 ${orderTab === 'selesai' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Selesai</span>
            {selesaiCount > 0 && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[9px] rounded-full font-extrabold">{selesaiCount}</span>}
          </button>
          <button onClick={() => setOrderTab('batal')} className={`flex-1 min-w-[65px] py-2 px-2 text-[11px] font-bold rounded-lg outline-none flex items-center justify-center gap-1 ${orderTab === 'batal' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Batal</span>
            {batalCount > 0 && <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] rounded-full font-extrabold">{batalCount}</span>}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari no. pesanan, pelanggan, unit..." 
            value={orderSearch} 
            onChange={(e) => setOrderSearch(e.target.value)} 
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-blue-500 shadow-sm transition-colors" 
          />
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 p-6">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 font-medium text-xs">Tidak ada pesanan di kategori ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentOrders.map(ord => {
              const rawNote = ord.note || ord.complaint || ord.complaint_description || '';
              const activeStatus = ord.status || ord.order_status || 'Menunggu Konfirmasi';
              const activeStatusLower = activeStatus.toLowerCase();
              const isExpanded = expandedOrderId === ord.id;
              
              // Safe Data Extraction
              const invMatch = rawNote.match(/\[INVOICE:\s*([^\]]+)\]/);
              let invoiceData: any = null; 
              if (invMatch && invMatch[1]) { 
                invoiceData = {}; 
                invMatch[1].split('|').forEach((p: string) => {
                  const [k, v] = p.split('='); 
                  if (k && v) {
                    const key = k.trim().toLowerCase();
                    invoiceData[key] = key === 'd' ? v.trim() : (Number(v.trim()) || 0);
                  }
                }); 
                // normalize fields
                invoiceData.jasa = invoiceData.j || invoiceData.jasa || 0;
                invoiceData.part = invoiceData.p || invoiceData.part || 0;
                invoiceData.layanan = invoiceData.l || invoiceData.layanan || 0;
                invoiceData.total = invoiceData.t || invoiceData.total || (invoiceData.jasa + invoiceData.part + invoiceData.layanan);
                invoiceData.desc = invoiceData.d || invoiceData.desc || '-';
              }
              
              const estMatch = rawNote.match(/\[ESTIMASI:\s*([^\]]+)\]/); 
              const estimasiData = estMatch ? estMatch[1] : null;
              
              const proofMatch = rawNote.match(/\[PAYMENT_PROOF:\s*([^\]]+)\]/); 
              const paymentProof = proofMatch ? proofMatch[1] : null;
              
              const schedMatch = rawNote.match(/\[JADWAL:\s*([^\]]+)\]/);
              const extractedSchedule = schedMatch ? schedMatch[1] : null;

              // Ekstraksi Uang Muka / DP Tanda Jadi
              const dpMatch = rawNote.match(/\[DP:\s*([^\]]+)\]/);
              let dpData: { nominal: number; status: string; bank: string } | null = null;
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
              }

              // Extracting photo attachments natively
              let photoAttachments: string[] = [];
              const photoMatches = rawNote.matchAll(/\[FOTO:\s*([^\]]+)\]/g);
              for (const m of photoMatches) { if (m[1]) photoAttachments.push(m[1]); }
              if (ord.attachment_image && !photoAttachments.includes(ord.attachment_image)) { photoAttachments.push(ord.attachment_image); }
              const hasFotoTag = rawNote.includes('[FOTO_TERLAMPIR]') || photoAttachments.length > 0;

              // Cleaning Note for display
              let cleanNote = rawNote
                .replace(/\[PAYMENT_PROOF:[^\]]+\]/g, '')
                .replace(/\[INVOICE:[^\]]+\]/g, '')
                .replace(/\[ESTIMASI:[^\]]+\]/g, '')
                .replace(/\[JADWAL:[^\]]+\]/g, '')
                .replace(/\[DP:[^\]]+\]/g, '')
                .replace(/\[FOTO:[^\]]+\]/g, '')
                .replace(/\[FOTO_TERLAMPIR\]/gi, '')
                .replace(/\[PELANGGAN MEMINTA TAMBAHAN PART:[^\]]+\]/g, '')
                .trim();
              if (!cleanNote) cleanNote = '-';

              const isNewOrder = orderTab === 'baru' || ['menunggu_konfirmasi', 'menunggu konfirmasi', 'baru', 'diterima'].includes(activeStatusLower);
              const isScheduled = orderTab === 'jadwal' || ['dijadwalkan', 'jadwal'].includes(activeStatusLower);
              const activeDpNominal = dpNominalInputs[ord.id] !== undefined ? dpNominalInputs[ord.id] : (dpData ? dpData.nominal : 50000);
              const activeDpBank = dpBankInputs[ord.id] || (dpData ? dpData.bank : 'BCA');
              const dpWaLink = generateDpWaLink(ord, cleanNote, extractedSchedule, activeDpNominal, activeDpBank);
              const waLink = generateWaLink(ord, cleanNote, extractedSchedule);
              const currentSelectedStatus = pendingStatusUpdates[ord.id] !== undefined ? pendingStatusUpdates[ord.id] : activeStatus;
              
              let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
              if (['menunggu_konfirmasi', 'menunggu konfirmasi', 'baru'].includes(activeStatusLower)) badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
              else if (['ditangani', 'dalam_pengerjaan', 'proses'].includes(activeStatusLower)) badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
              else if (['dijadwalkan', 'jadwal'].includes(activeStatusLower)) badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
              else if (['selesai', 'selesai ditangani', 'lunas'].includes(activeStatusLower)) badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              else if (['menunggu pembayaran', 'menunggu_pembayaran'].includes(activeStatusLower)) badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
              else if (['dibatalkan', 'batal'].includes(activeStatusLower)) badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div key={ord.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all">
                  <div 
                    onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)} 
                    className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors flex justify-between items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                          #{ord.order_code || (ord.id ? String(ord.id).slice(0, 8) : 'ORD')}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${badgeClass}`}>
                          {activeStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-900 text-[14px] truncate">{ord.customer_name || 'Pelanggan'}</h4>
                      <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {ord.customer_phone || ord.user_phone || '-'}
                        {ord.unit_name && <span className="text-slate-400">&bull; {ord.unit_name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-slate-100 bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
                      
                      <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2 text-xs">
                        <p className="font-bold text-slate-700">Detail Pesanan & Keluhan:</p>
                        <p className="text-slate-600 italic pl-2 border-l-2 border-blue-400 font-medium">"{cleanNote}"</p>
                        
                        {extractedSchedule && (
                          <div className="flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50 p-2 rounded-xl text-[11px] mt-2">
                            <Calendar className="w-3.5 h-3.5" /> Jadwal Reservasi: {extractedSchedule}
                          </div>
                        )}
                        
                        {(photoAttachments.length > 0 || hasFotoTag) && (
                          <div className="pt-2 border-t border-slate-100 mt-2">
                            <button 
                              type="button" 
                              onClick={() => {
                                const targetImg = photoAttachments[0] || ord.attachment_image || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop';
                                setViewPhotoModal(targetImg);
                              }} 
                              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-blue-200/80 flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all outline-none"
                            >
                              <Camera className="w-4 h-4 text-blue-600" />
                              <span>Lihat Foto Kerusakan Pelanggan</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {waLink !== '#' && !isScheduled && (
                        <a 
                          href={waLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                        >
                          <MessageCircle className="w-4 h-4" /> Konfirmasi via WhatsApp
                        </a>
                      )}

                      <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Ubah Status Pesanan:</label>
                        <div className="flex gap-2">
                          <select 
                            value={currentSelectedStatus} 
                            onChange={(e) => setPendingStatusUpdates(prev => ({ ...prev, [ord.id]: e.target.value }))} 
                            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white"
                          >
                            <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                            <option value="Dijadwalkan">Dijadwalkan</option>
                            <option value="Ditangani">Dalam Pengerjaan / Ditangani</option>
                            <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                          {pendingStatusUpdates[ord.id] && pendingStatusUpdates[ord.id] !== activeStatus && (
                            <button 
                              onClick={() => handleConfirmStatus(ord.id)} 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm active:scale-95 transition-transform"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </div>

                      {/* MODUL BERITA ACARA & PEMBAYARAN DP (KHUSUS TAHAP DIJADWALKAN) */}
                      {isScheduled && (
                        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 p-4 rounded-[20px] border border-indigo-100 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-[12px] font-black text-slate-800 tracking-tight">Konfirmasi WhatsApp & Tagihan DP</h5>
                                <p className="text-[10px] text-slate-500 font-medium">Tanda jadi reservasi sebelum menuju tahap pengerjaan</p>
                              </div>
                            </div>
                            {dpData?.status === 'lunas' ? (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> DP Lunas
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                Menunggu DP
                              </span>
                            )}
                          </div>

                          {dpData?.status === 'lunas' ? (
                            <div className="bg-emerald-50/90 border border-emerald-200/90 p-3 rounded-xl flex items-center justify-between gap-2 animate-in zoom-in-95">
                              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <p>DP Rp {dpData.nominal.toLocaleString('id-ID')} Telah Diterima ({dpData.bank})</p>
                                  <p className="text-[10px] text-emerald-700 font-medium">Uang muka otomatis memotong tagihan akhir saat pengerjaan selesai.</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setPendingStatusUpdates(p => ({ ...p, [ord.id]: 'Ditangani' }));
                                  handleConfirmStatus(ord.id);
                                }}
                                className="text-[10px] font-extrabold text-blue-700 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-xs active:scale-95 transition-transform shrink-0"
                              >
                                Lanjut Pengerjaan &rarr;
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-100">
                                Pelanggan diinformasikan untuk membayar DP tanda jadi terlebih dahulu ke nomor rekening/QRIS admin. Begitu bukti transfer diterima via WA, verifikasi untuk melanjutkan pesanan ke status <strong className="text-indigo-600">"Ditangani / Pengerjaan"</strong>.
                              </p>

                              {/* Pilihan Nominal DP */}
                              <div>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Nominal DP Tanda Jadi:</span>
                                  <span className="text-[11px] font-black text-indigo-700">Rp {activeDpNominal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[25000, 50000, 100000].map(amt => (
                                    <button
                                      key={amt}
                                      type="button"
                                      onClick={() => setDpNominalInputs(p => ({ ...p, [ord.id]: amt }))}
                                      className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border transition-all ${
                                        activeDpNominal === amt
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      Rp {amt.toLocaleString('id-ID')}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Pilihan Rekening / QRIS */}
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">Metode / Rekening Tujuan:</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {['BCA', 'Mandiri', 'BRI', 'QRIS'].map(bank => (
                                    <button
                                      key={bank}
                                      type="button"
                                      onClick={() => setDpBankInputs(p => ({ ...p, [ord.id]: bank }))}
                                      className={`py-1.5 px-1 text-center rounded-xl text-[10px] font-bold border transition-all ${
                                        activeDpBank === bank
                                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      {bank}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Tombol Kirim Berita Acara via WhatsApp */}
                              <a
                                href={dpWaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => triggerRipple(e)}
                                className="ripple-btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-95 transition-transform"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>Kirim Berita Acara & Info DP via WhatsApp</span>
                              </a>

                              {/* Tombol Verifikasi DP & Lanjut ke Pengerjaan */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  triggerRipple(e);
                                  handleVerifyDpAndProceed(ord, activeDpNominal, activeDpBank);
                                }}
                                disabled={isVerifyingDp[ord.id]}
                                className="ripple-btn w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-transform"
                              >
                                {isVerifyingDp[ord.id] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Memverifikasi DP & Memperbarui Status...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Verifikasi DP & Lanjut ke "Ditangani / Pengerjaan"</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* FORM ESTIMASI & INVOICE HANYA MUNCUL DI TAHAP PENGERJAAN & PELUNASAN (BUKAN PESANAN BARU & BUKAN DIJADWALKAN) */}
                      {!isNewOrder && !isScheduled && (
                        <>
                          <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Input Estimasi Biaya Awalan:</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Cth: Rp 150.000 - Rp 250.000" 
                                value={estimasiInput[ord.id] || ''} 
                                onChange={(e) => setEstimasiInput(prev => ({ ...prev, [ord.id]: e.target.value }))} 
                                className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-medium outline-none focus:bg-white"
                              />
                              <button 
                                onClick={() => handleSendEstimasi(ord.id, rawNote)} 
                                disabled={!estimasiInput[ord.id]} 
                                className={`font-bold px-3 py-2.5 rounded-xl text-xs shadow-sm active:scale-95 transition-transform ${estimasiInput[ord.id] ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                              >
                                Kirim
                              </button>
                            </div>
                            {estimasiData && (
                              <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl mt-2">Estimasi Terkirim: {estimasiData}</p>
                            )}
                          </div>

                          <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Terbitkan Tagihan / Invoice:</label>
                              {dpData?.status === 'lunas' && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  DP: -Rp {dpData.nominal.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Jasa (Rp)</span>
                                <input type="number" placeholder="0" value={invoiceInputs[ord.id]?.jasa || ''} onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), jasa: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none focus:bg-white" />
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Suku Cadang (Rp)</span>
                                <input type="number" placeholder="0" value={invoiceInputs[ord.id]?.part || ''} onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), part: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none focus:bg-white" />
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Lainnya (Rp)</span>
                                <input type="number" placeholder="0" value={invoiceInputs[ord.id]?.layanan || ''} onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), layanan: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none focus:bg-white" />
                              </div>
                            </div>
                            <input type="text" placeholder="Keterangan Rincian (Opsional)" value={invoiceInputs[ord.id]?.desc || ''} onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), desc: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:bg-white" />
                            
                            {dpData?.status === 'lunas' && (
                              <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] font-bold text-slate-600 flex justify-between items-center border border-slate-100">
                                <span>Sisa Pelunasan Pelanggan:</span>
                                <span className="text-indigo-600 font-extrabold">
                                  Rp {Math.max(0, ((Number(invoiceInputs[ord.id]?.jasa) || 0) + (Number(invoiceInputs[ord.id]?.part) || 0) + (Number(invoiceInputs[ord.id]?.layanan) || 0)) - dpData.nominal).toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}

                            <button 
                              onClick={() => handleSendInvoice(ord.id, rawNote)} 
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 mt-2"
                            >
                              <FileText className="w-4 h-4" /> Terbitkan & Kirim Invoice
                            </button>
                          </div>
                        </>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {(ord.payment_status === 'lunas' || activeStatus.toLowerCase() === 'selesai') ? (
                          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Pembayaran Terverifikasi & Lunas</span>
                          </div>
                        ) : ((activeStatus.toLowerCase().includes('pembayaran') || paymentProof || ord.payment_status === 'menunggu_verifikasi' || invoiceData) && activeStatus.toLowerCase() !== 'dibatalkan') ? (
                          <button 
                            onClick={(e) => { triggerRipple(e); handleVerifyPaymentAndSettle(ord, invoiceData); }} 
                            disabled={settlingOrderId === ord.id} 
                            className="ripple-btn w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          >
                            {settlingOrderId === ord.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Verifikasi Pembayaran...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verifikasi & Lunasi Pembayaran</span>
                              </>
                            )}
                          </button>
                        ) : null}

                        {invoiceData && (
                          <button 
                            onClick={() => setShowInvoiceModal({ ord, invoiceData })} 
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-indigo-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          >
                            <Printer className="w-3.5 h-3.5" /> Cetak Tagihan
                          </button>
                        )}
                        
                        {paymentProof && (
                          <button 
                            onClick={() => setViewReceiptModal(paymentProof)} 
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-emerald-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Bukti Bayar
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        {confirmingCancelId === ord.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in">
                            <span className="text-[11px] font-bold text-rose-600">Yakin batalkan?</span>
                            <button onClick={() => handleCancelOrder(ord.id)} className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95 shadow-sm">Ya, Batalkan</button>
                            <button onClick={() => setConfirmingCancelId(null)} className="bg-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95">Batal</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmingCancelId(ord.id)} className="text-rose-500 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 hover:underline outline-none">
                            <Trash2 className="w-3.5 h-3.5" /> Batalkan Pesanan Ini
                          </button>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-white p-3 rounded-[20px] border border-slate-100 text-xs font-bold text-slate-600 shadow-sm mt-4">
            <button onClick={() => setOrderPage(p => Math.max(0, p - 1))} disabled={orderPage === 0} className={`p-2 rounded-xl border flex items-center gap-1 ${orderPage === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span>Halaman {orderPage + 1} dari {totalPages}</span>
            <button onClick={() => setOrderPage(p => Math.min(totalPages - 1, p + 1))} disabled={orderPage >= totalPages - 1} className={`p-2 rounded-xl border flex items-center gap-1 ${orderPage >= totalPages - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderLaporanKeuangan = () => {
    // Perhitungan Keuangan
    const now = new Date();
    const filteredLedger = ledgerData.filter(trx => {
      if (financePeriod === 'semua') return true;
      const trxDate = new Date(trx.created_at);
      return trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
    });
    
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let omzetJasa = 0;
    let omzetSparepart = 0;
    let omzetLayanan = 0;
    
    filteredLedger.forEach(trx => {
      if (trx.transaction_type === 'PEMASUKAN' && trx.is_settled) {
        totalPemasukan += Number(trx.amount || 0);
        if (trx.category === 'Jasa Servis') omzetJasa += Number(trx.amount || 0);
        if (trx.category === 'Penjualan Sparepart' || trx.category === 'Sparepart') omzetSparepart += Number(trx.amount || 0);
        if (trx.category === 'Layanan Ekstra' || trx.category === 'Layanan') omzetLayanan += Number(trx.amount || 0);
      } else if (trx.transaction_type === 'PENGELUARAN' && trx.is_settled) {
        totalPengeluaran += Number(trx.amount || 0);
      }
    });
    
    const saldoKasAkhir = totalPemasukan - totalPengeluaran;
    
    // Hitung Piutang
    const piutangOrders = adminOrders.filter(ord => {
      const st = (ord.status || ord.order_status || '').toLowerCase();
      return ['menunggu pembayaran', 'menunggu_pembayaran'].includes(st);
    });
    
    let totalPiutang = 0;
    piutangOrders.forEach(ord => {
      const raw = ord.note || ord.complaint || '';
      const invMatch = raw.match(/\[INVOICE:\s*([^\]]+)\]/);
      if (invMatch && invMatch[1]) {
        invMatch[1].split('|').forEach((p: string) => {
          if (p.startsWith('T=')) totalPiutang += Number(p.replace('T=', '')) || 0;
        });
      }
    });

    return (
      <div className="animate-in fade-in pb-10 space-y-4">
        {/* 4 Sub-Tabs Laporan */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl overflow-x-auto no-scrollbar gap-1">
          <button onClick={() => setFinanceTab('ringkasan')} className={`flex-1 min-w-[90px] py-2 px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none ${financeTab === 'ringkasan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Ringkasan Saldo
          </button>
          <button onClick={() => setFinanceTab('piutang')} className={`flex-1 min-w-[70px] py-2 px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none flex items-center justify-center gap-1.5 ${financeTab === 'piutang' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Piutang {piutangOrders.length > 0 && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full text-[9px]">{piutangOrders.length}</span>}
          </button>
          <button onClick={() => setFinanceTab('pesanan')} className={`flex-1 min-w-[90px] py-2 px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none ${financeTab === 'pesanan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Rekap Pesanan
          </button>
          <button onClick={() => setFinanceTab('operasional')} className={`flex-1 min-w-[100px] py-2 px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none ${financeTab === 'operasional' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Catat Operasional
          </button>
        </div>

        {financeTab === 'ringkasan' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-extrabold text-slate-800 text-[15px]">Arus Kas Perusahaan</h3>
              <select value={financePeriod} onChange={(e: any) => setFinancePeriod(e.target.value)} className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-3 rounded-lg outline-none shadow-sm">
                <option value="bulan_ini">Bulan Ini</option>
                <option value="semua">Semua Waktu</option>
              </select>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-5 rounded-[28px] shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 block mb-1">Saldo Kas Bersih</span>
                  <h1 className="text-[28px] font-black tracking-tight leading-none text-emerald-400">
                    Rp {saldoKasAkhir.toLocaleString('id-ID')}
                  </h1>
                </div>
                <div className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                  <Wallet className="w-6 h-6 text-indigo-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-5 mt-2 border-t border-white/10">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-0.5"><TrendingUp className="w-3 h-3 text-emerald-400"/> Pemasukan</span>
                  <span className="text-[14px] font-black text-white">Rp {totalPemasukan.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-0.5"><TrendingDown className="w-3 h-3 text-rose-400"/> Pengeluaran</span>
                  <span className="text-[14px] font-black text-white">Rp {totalPengeluaran.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm mt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-100 pb-2">Riwayat Buku Kas</h4>
              {filteredLedger.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">Belum ada pencatatan kas.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {filteredLedger.map(trx => (
                    <div key={trx.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg mt-0.5 ${trx.transaction_type === 'PEMASUKAN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {trx.transaction_type === 'PEMASUKAN' ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-800">{trx.category}</p>
                          <p className="text-[10px] text-slate-500 max-w-[180px] truncate">{trx.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[12px] font-black ${trx.transaction_type === 'PEMASUKAN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {trx.transaction_type === 'PEMASUKAN' ? '+' : '-'}Rp {Number(trx.amount).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400">{new Date(trx.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {financeTab === 'piutang' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-[24px] flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-0.5">Total Piutang Belum Lunas</span>
                <span className="text-[20px] font-black text-rose-700">Rp {totalPiutang.toLocaleString('id-ID')}</span>
              </div>
              <div className="p-3 bg-white rounded-full text-rose-500 shadow-sm"><DollarSign className="w-5 h-5"/></div>
            </div>
            
            {piutangOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-500 font-bold text-sm">Semua Tagihan Lunas!</p>
                <p className="text-slate-400 font-medium text-[11px] mt-1">Tidak ada piutang pelanggan yang tertunda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {piutangOrders.map(ord => {
                  const raw = ord.note || ord.complaint || '';
                  let invoiceData: any = {};
                  const invMatch = raw.match(/\[INVOICE:\s*([^\]]+)\]/);
                  if (invMatch && invMatch[1]) {
                    invMatch[1].split('|').forEach((p: string) => {
                      const [k, v] = p.split('=');
                      if (k && v) invoiceData[k.trim().toLowerCase()] = Number(v.trim()) || 0;
                    });
                  }
                  
                  let paymentProofData = null;
                  const proofMatch = raw.match(/\[PAYMENT_PROOF:\s*([^\]]+)\]/);
                  if (proofMatch && proofMatch[1]) paymentProofData = proofMatch[1];
                  
                  return (
                    <div key={ord.id} className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">#{ord.order_code || 'ORD'}</span>
                          <h4 className="font-bold text-slate-800 text-[13px]">{ord.customer_name || 'Pelanggan'}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tagihan</span>
                          <span className="text-[15px] font-black text-rose-600">Rp {(invoiceData.t || invoiceData.total || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      
                      {paymentProofData ? (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Upload Bukti Tersedia</span>
                          <button onClick={() => setViewReceiptModal(paymentProofData)} className="text-[10px] font-bold bg-white text-emerald-700 px-3 py-1.5 rounded-lg shadow-sm border border-emerald-200">Lihat</button>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2 text-center border border-amber-100">Menunggu transfer...</p>
                      )}
                      
                      <button
                        onClick={() => handleVerifyPaymentAndSettle(ord, invoiceData)}
                        disabled={settlingOrderId === ord.id}
                        className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl text-[12px] shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 outline-none"
                      >
                        {settlingOrderId === ord.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Verifikasi & Lunasi Tagihan</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {financeTab === 'pesanan' && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-[11px] font-medium text-slate-500 bg-blue-50 border border-blue-100 p-3 rounded-xl">Menampilkan rekap semua transaksi pesanan pelanggan.</p>
            <div className="space-y-3">
              {adminOrders.map(ord => {
                const raw = ord.note || ord.complaint || '';
                let total = 0;
                const invMatch = raw.match(/\[INVOICE:\s*([^\]]+)\]/);
                if (invMatch && invMatch[1]) {
                  invMatch[1].split('|').forEach((p: string) => {
                    if (p.startsWith('T=')) total = Number(p.replace('T=', '')) || 0;
                  });
                }
                const activeStatus = ord.status || ord.order_status || 'Baru';
                return (
                  <div key={ord.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">{new Date(ord.created_at).toLocaleDateString('id-ID')}</span>
                      <h4 className="font-bold text-slate-800 text-[13px]">{ord.customer_name || 'Pelanggan'}</h4>
                      <p className="text-[10px] font-bold text-blue-600">{activeStatus.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-black text-slate-700 block">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {financeTab === 'operasional' && (
          <form onSubmit={handleSaveManualTransaction} className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in">
            <h3 className="font-bold text-slate-800 text-[14px] mb-4 border-b border-slate-100 pb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600"/> Catat Kas Manual</h3>
            <div className="space-y-3.5">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button type="button" onClick={() => setOpType('PENGELUARAN')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${opType === 'PENGELUARAN' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Pengeluaran (-)</button>
                <button type="button" onClick={() => setOpType('PEMASUKAN')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${opType === 'PEMASUKAN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Pemasukan (+)</button>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1 px-1">Kategori Transaksi</label>
                <select value={opCategory} onChange={(e) => setOpCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none">
                  {opType === 'PENGELUARAN' ? (
                    <>
                      <option value="Operasional">Biaya Operasional (Bensin, Makan, dll)</option>
                      <option value="Kulakan Sparepart">Pembelian / Kulakan Sparepart</option>
                      <option value="Gaji Teknisi">Gaji / Insentif Teknisi</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Modal Usaha">Suntikan Modal Usaha</option>
                      <option value="Pendapatan Lain">Pendapatan Lain-lain</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1 px-1">Nominal (Rp)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-[13px] font-bold text-slate-400">Rp</span></div>
                  <input type="number" required placeholder="0" value={opAmount} onChange={(e) => setOpAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-[14px] font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1 px-1">Keterangan Catatan</label>
                <input type="text" required placeholder="Cth: Beli bensin teknisi Budi" value={opDesc} onChange={(e) => setOpDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              {opCategory === 'Kulakan Sparepart' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1 px-1">Status Pembayaran</label>
                  <select value={opSettled} onChange={(e) => setOpSettled(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none">
                    <option value="true">Sudah Lunas</option>
                    <option value="false">Hutang (Belum Lunas)</option>
                  </select>
                </div>
              )}
            </div>
            <button type="submit" disabled={isSubmittingOp} className={`w-full mt-5 py-3.5 font-bold text-white rounded-xl text-[13px] shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2 ${opType === 'PEMASUKAN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}>
              {isSubmittingOp ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan ke Buku Kas'}
            </button>
          </form>
        )}
      </div>
    );
  };

  const renderManajemenStok = () => {
    const filtered = spareParts.filter(p => {
      const matchUnit = stokUnitFilter === 'Semua' || String(p.unit_id) === String(stokUnitFilter);
      const matchCategory = stokFilter === 'Semua' || String(p.category_id) === String(stokFilter);
      const matchSearch = p.name.toLowerCase().includes(stokSearch.toLowerCase());
      return matchUnit && matchCategory && matchSearch;
    });

    const stokPerPage = 6;
    const paginated = filtered.slice(stokPage * stokPerPage, (stokPage + 1) * stokPerPage);
    const totalP = Math.ceil(filtered.length / stokPerPage) || 1;

    return (
      <div className="animate-in fade-in pb-10 space-y-4">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama part suku cadang..." 
              value={stokSearch} 
              onChange={e => { setStokSearch(e.target.value); setStokPage(0); }} 
              className="w-full bg-white border border-slate-200 pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:border-indigo-500 shadow-xs" 
            />
          </div>
          <button 
            onClick={() => { setEditingPartId(null); setPartName(''); setIsStokModalOpen(true); }} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4"/> Tambah Stok
          </button>
        </div>

        {/* Filter Objek/Unit & Filter Kategori */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">Filter:</span>
          <select 
            value={stokUnitFilter} 
            onChange={e => { setStokUnitFilter(e.target.value); setStokPage(0); }}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-xs shrink-0"
          >
            <option value="Semua">🔍 Semua Objek / Unit</option>
            {serviceUnits.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select 
            value={stokFilter} 
            onChange={e => { setStokFilter(e.target.value); setStokPage(0); }}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-xs shrink-0"
          >
            <option value="Semua">📦 Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {(stokUnitFilter !== 'Semua' || stokFilter !== 'Semua' || stokSearch) && (
            <button 
              onClick={() => { setStokUnitFilter('Semua'); setStokFilter('Semua'); setStokSearch(''); setStokPage(0); }}
              className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl border border-rose-100 transition-colors shrink-0"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 p-6">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-bold text-xs">Stok barang tidak ditemukan.</p>
            <p className="text-slate-400 text-[11px] mt-1">Coba sesuaikan pencarian atau filter objek/unit Anda.</p>
          </div>
        ) : (
          /* Grid Kartu Stok (Max 6 per halaman) */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paginated.map(item => {
              const unitObj = serviceUnits.find(u => String(u.id) === String(item.unit_id));
              const unitName = unitObj?.name || item.unit_name || 'Semua Unit';
              const imgUrl = item.image_url && item.image_url.trim() ? item.image_url : null;

              return (
                <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    {/* THUMBNAIL FOTO PRODUK */}
                    <div className="w-full h-28 rounded-xl bg-slate-50 mb-2 overflow-hidden border border-slate-100 flex items-center justify-center relative p-1">
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt={item.name} 
                          className="w-full h-full object-contain mix-blend-multiply" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallbackEl) fallbackEl.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`flex flex-col items-center justify-center text-slate-300 ${imgUrl ? 'hidden' : ''}`}>
                        <Package className="w-8 h-8 mb-0.5 text-slate-300" />
                        <span className="text-[8.5px] font-bold text-slate-400">Tanpa Foto</span>
                      </div>

                      {/* BADGE BERDASARKAN OBJEK/UNIT */}
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-indigo-600/90 text-white text-[8px] font-black uppercase rounded-md tracking-wider shadow-xs backdrop-blur-xs line-clamp-1 max-w-[85%]">
                        {unitName}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{item.name}</h4>
                    
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[10px] text-slate-500 font-medium">Stok: <b className="text-slate-800">{item.stock}</b></span>
                      <span className="text-[11px] text-blue-600 font-black">Rp {Number(item.price || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-3 border-t border-slate-50 pt-2">
                    <button 
                      onClick={() => {
                        setEditingPartId(item.id); 
                        setPartName(item.name); 
                        setPartCategoryId(item.category_id); 
                        setPartUnitId(item.unit_id); 
                        setPartPrice(item.price); 
                        setPartStock(item.stock); 
                        setPartImage(item.image_url || ''); 
                        setPartDesc(item.description || ''); 
                        setIsStokModalOpen(true);
                      }} 
                      className="flex-1 bg-amber-50 text-amber-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center hover:bg-amber-100 transition-colors"
                    >
                      <Edit3 className="w-3 h-3"/>
                    </button>
                    <button 
                      onClick={() => del('spare_parts', item.id)} 
                      className="flex-1 bg-rose-50 text-rose-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Fitur Paginasi (6 tampilan kartu perhalaman) */}
        {totalP > 1 && (
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl text-xs font-bold border border-slate-100 shadow-sm mt-4">
            <button 
              disabled={stokPage === 0} 
              onClick={() => setStokPage(p => Math.max(0, p - 1))} 
              className="px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-all text-slate-700"
            >
              <ChevronLeft className="w-4 h-4"/> Prev
            </button>
            <div className="text-center">
              <span className="text-slate-800 font-black">Halaman {stokPage + 1} dari {totalP}</span>
              <span className="text-[10px] text-slate-400 block font-normal">({filtered.length} total stok)</span>
            </div>
            <button 
              disabled={stokPage >= totalP - 1} 
              onClick={() => setStokPage(p => Math.min(totalP - 1, p + 1))} 
              className="px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-all text-slate-700"
            >
              Next <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        )}

        {/* Modal Stok (Slide-Up) */}
        {isStokModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsStokModalOpen(false)}>
            <div className="w-full max-w-md bg-white rounded-t-[32px] p-6 pb-20 animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800 tracking-tight">{editingPartId ? 'Edit Stok Barang' : 'Tambah Stok Baru'}</h3>
                <button onClick={() => setIsStokModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X className="w-4 h-4"/></button>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Nama Suku Cadang (*Wajib)" value={partName} onChange={e => setPartName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-[16px] text-xs font-bold outline-none focus:bg-white" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={partCategoryId} onChange={e => setPartCategoryId(e.target.value)} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[16px] text-xs outline-none focus:bg-white">
                    <option value="">-- Kategori --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={partUnitId} onChange={e => setPartUnitId(e.target.value)} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[16px] text-xs outline-none focus:bg-white">
                    <option value="">-- Objek/Unit --</option>
                    {serviceUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Harga (Rp)" value={partPrice} onChange={e => setPartPrice(e.target.value)} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[16px] text-xs font-bold outline-none focus:bg-white" />
                  <input type="number" placeholder="Jumlah Stok" value={partStock} onChange={e => setPartStock(e.target.value)} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[16px] text-xs font-bold outline-none focus:bg-white" />
                </div>
                <input type="text" placeholder="URL Foto Gambar (Opsional)" value={partImage} onChange={e => setPartImage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-[16px] text-xs outline-none focus:bg-white" />
                <textarea placeholder="Deskripsi Barang..." value={partDesc} onChange={e => setPartDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-[16px] text-xs h-20 resize-none outline-none focus:bg-white"></textarea>
                <button 
                  onClick={handleSavePart} 
                  disabled={isSubmittingPart}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-md flex justify-center items-center gap-2 mt-2 active:scale-95 transition-transform"
                >
                  {isSubmittingPart ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan Barang'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderManajemenPelanggan = () => {
    const filteredCustomers = customersData.filter(cust => {
      const q = customerSearch.toLowerCase();
      const nama = (cust.full_name || '').toLowerCase();
      const wa = (cust.phone_number || '').toLowerCase();
      return nama.includes(q) || wa.includes(q);
    });

    return (
      <div className="animate-in fade-in pb-10 space-y-4">
        <div className="flex p-1 bg-slate-200/80 rounded-xl">
          <button onClick={() => setCustomerTab('reguler')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${customerTab === 'reguler' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Reguler</button>
          <button onClick={() => setCustomerTab('member')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${customerTab === 'member' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Member VIP</button>
        </div>

        {customerTab === 'reguler' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Cari nama / WhatsApp..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none" />
            </div>
            
            <div className="space-y-3">
              {filteredCustomers.map(cust => {
                const isMember = specialSubs.some(sub => sub.customer_phone === cust.phone_number && sub.status === 'aktif');
                
                if (editingCustId === cust.id) {
                  return (
                    <form key={cust.id} onSubmit={handleSaveCust} className="bg-sky-50 p-4 rounded-[20px] border border-sky-200 space-y-3 shadow-sm">
                      <input type="text" value={custName} onChange={e => setCustName(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border border-sky-200 outline-none" />
                      <input type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border border-sky-200 outline-none" />
                      <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border border-sky-200 outline-none" />
                      <div className="flex gap-2">
                        <button type="button" onClick={cancelEditCust} className="flex-1 py-2 bg-white border border-sky-200 text-sky-700 font-bold text-xs rounded-xl">Batal</button>
                        <button type="submit" disabled={isSubmittingCust} className="flex-1 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-sm flex justify-center">{isSubmittingCust ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan'}</button>
                      </div>
                    </form>
                  );
                }
                
                return (
                  <div key={cust.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 overflow-hidden ${isMember ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-100 border-white text-slate-400'}`}>
                      {cust.avatar_url ? <img src={cust.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5 gap-2">
                        <h4 className="font-bold text-slate-800 text-[13px] truncate">{cust.full_name || 'Tanpa Nama'}</h4>
                        {isMember ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-md tracking-widest shrink-0 border border-amber-200 flex items-center gap-1"><Award className="w-3 h-3"/> VIP</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase rounded-md tracking-widest shrink-0 border border-slate-200">Reguler</span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/> {cust.phone_number || '-'}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0 border-l border-slate-100 pl-2">
                      <button onClick={() => handleEditCust(cust)} className="p-1.5 text-amber-500 bg-amber-50 border border-amber-100 rounded-lg shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCust(cust.id)} className="p-1.5 text-rose-500 bg-rose-50 border border-rose-100 rounded-lg shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {customerTab === 'member' && (
          <div className="space-y-4 animate-in fade-in">
            {!showSubForm && (
              <button onClick={() => setShowSubForm(true)} className="w-full bg-purple-100 text-purple-700 py-3 rounded-2xl text-xs font-bold flex justify-center items-center gap-2 hover:bg-purple-200 transition-colors">
                <Plus className="w-4 h-4"/> Tambah Member VIP Manual
              </button>
            )}
            
            {showSubForm && (
              <form onSubmit={handleSaveSub} className="bg-white p-5 rounded-[24px] border border-purple-200 shadow-lg shadow-purple-500/10 space-y-3.5">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-[14px] text-purple-800 flex items-center gap-2"><Award className="w-4 h-4"/> {editingSubId ? 'Edit Data Member' : 'Daftar Member Baru'}</h4>
                  <button type="button" onClick={cancelEditSub} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X className="w-4 h-4"/></button>
                </div>
                <input type="text" placeholder="Nama Pelanggan (*Wajib)" value={subName} onChange={e => setSubName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none" />
                <input type="tel" placeholder="Nomor WhatsApp (*Wajib)" value={subPhone} onChange={e => setSubPhone(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Paket (Cth: Cuci AC Rutin)" value={subTitle} onChange={e => setSubTitle(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-xs font-medium outline-none" />
                  <select value={subDuration} onChange={e => setSubDuration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none">
                    <option value="1_bulan">1 Bulan</option>
                    <option value="3_bulan">3 Bulan</option>
                    <option value="6_bulan">6 Bulan</option>
                    <option value="1_tahun">1 Tahun</option>
                    <option value="rutin_tanpa_batas">Rutin (Tanpa Batas)</option>
                  </select>
                </div>
                <select value={subStatus} onChange={e => setSubStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none">
                  <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
                  <option value="aktif">Aktif (Member VIP)</option>
                  <option value="selesai">Selesai / Nonaktif</option>
                </select>
                <button type="submit" disabled={isSubmittingSub} className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 flex justify-center items-center gap-2">
                  {isSubmittingSub ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan Member'}
                </button>
              </form>
            )}

            {specialSubs.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-[20px] border border-purple-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-[9px] font-bold uppercase rounded-full tracking-wider border border-purple-100">
                    {s.subscription_code || 'MBR'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${['menunggu_konfirmasi'].includes(s.status) ? 'bg-amber-100 text-amber-700' : s.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.status ? s.status.replace(/_/g, ' ') : ''}
                    </span>
                    <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                      <button onClick={() => handleEditSub(s)} className="p-1.5 text-amber-500 bg-amber-50 rounded-lg hover:bg-amber-100"><Edit3 className="w-3.5 h-3.5"/></button>
                      <button onClick={() => handleDeleteSub(s.id)} className="p-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[14px]">{s.custom_service_title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1"><b>{s.customer_name}</b> ({s.customer_phone})</p>
                  <p className="text-[11px] text-slate-600">Durasi: {s.duration ? s.duration.replace(/_/g, ' ') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderManajemenBanner = () => {
    // Ekstraksi Unique Label Badges untuk Filter Dropdown
    const uniqueLabels = Array.from(
      new Set(savedBanners.map(b => (b.label || 'PROMO').trim()))
    ).filter(Boolean);

    const filteredBanners = savedBanners.filter(b => {
      if (bannerLabelFilter === 'Semua') return true;
      return (b.label || 'PROMO').trim().toLowerCase() === bannerLabelFilter.toLowerCase();
    });

    const previewBg = bannerBgUrl?.trim() || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop';
    const previewLabel = bannerLabel?.trim() || 'PROMO SPESIAL';
    const previewTitle = bannerTitle?.trim() || 'Judul Utama Banner Promosi';
    const previewDesc = bannerDesc?.trim() || 'Deskripsi singkat promo atau informasi layanan yang akan tampil kepada pelanggan...';
    const previewBtnText = bannerBtnText?.trim() || 'Pesan Sekarang';

    return (
      <div className="animate-in fade-in pb-10 space-y-4">
        {/* HEADER ATAS DENGAN TOMBOL TAMBAH BANNER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">Manajemen Banner</h3>
              <p className="text-[11px] text-slate-500 font-medium">Kelola kilas info promosi & penawaran di beranda pelanggan</p>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              triggerRipple(e);
              if (isBannerFormOpen) {
                cancelEditBanner();
              } else {
                setEditingBannerId(null);
                setBannerTitle('');
                setBannerBgUrl('');
                setBannerLabel('PROMO SPESIAL');
                setBannerDesc('');
                setBannerBtnText('Pesan Sekarang');
                setIsBannerFormOpen(true);
              }
            }}
            className={`ripple-btn px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
              isBannerFormOpen 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
            }`}
          >
            {isBannerFormOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>Tutup Formulir</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Tambah Banner</span>
              </>
            )}
          </button>
        </div>

        {/* FORMULIR HANYA TAMPIL SAAT DIMINTA (isBannerFormOpen === true) */}
        {isBannerFormOpen && (
          <div className={`bg-white p-5 sm:p-6 rounded-[28px] border shadow-sm space-y-5 animate-in fade-in slide-in-from-top-3 duration-300 ${editingBannerId ? 'border-amber-300' : 'border-rose-100'}`}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${editingBannerId ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`}></span>
                <h4 className="font-extrabold text-slate-800 text-[14px]">
                  {editingBannerId ? 'Edit Banner Promo' : 'Form Tambah Banner Baru'}
                </h4>
              </div>
              <button
                type="button"
                onClick={cancelEditBanner}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIVE PREVIEW BANNER NYATA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Live Preview (Tampilan Beranda Pelanggan)
                </span>
                <span className="text-[10px] text-slate-400 font-medium italic">Preview otomatis ter-update</span>
              </div>

              <div className="w-full rounded-[24px] text-white shadow-md relative overflow-hidden h-[180px] bg-slate-900 border border-slate-200">
                <img 
                  src={previewBg} 
                  alt="Banner Live Preview" 
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/75 to-transparent"></div>
                <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-center h-full max-w-[80%]">
                  <span className="text-[9.5px] font-extrabold tracking-widest uppercase bg-rose-600 text-white px-2.5 py-1 rounded-md w-fit mb-2 shadow-xs line-clamp-1">
                    {previewLabel}
                  </span>
                  <h4 className="text-[17px] font-black leading-tight text-white mb-1.5 drop-shadow-xs line-clamp-1">
                    {previewTitle}
                  </h4>
                  <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed mb-3 font-medium">
                    {previewDesc}
                  </p>
                  <div className="text-[11px] font-extrabold text-rose-500 bg-white px-3.5 py-1.5 rounded-xl w-fit flex items-center gap-1 shadow-sm">
                    <span>{previewBtnText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* INPUT FORM FIELDS */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  URL Gambar Background (*Wajib)
                </label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..." 
                  value={bannerBgUrl} 
                  onChange={e => setBannerBgUrl(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none focus:border-rose-500 focus:bg-white transition-colors" 
                />
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[9px] text-slate-400 font-bold self-center shrink-0">Contoh Cepat:</span>
                  {[
                    { name: 'Teknisi AC', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop' },
                    { name: 'Peralatan & Servis', url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop' },
                    { name: 'Elektronik Modern', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBannerBgUrl(sample.url)}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0 transition-colors"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Label Badge
                  </label>
                  <input 
                    type="text" 
                    placeholder="Cth: PROMO SPESIAL, INFO LAYANAN" 
                    value={bannerLabel} 
                    onChange={e => setBannerLabel(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none focus:border-rose-500 focus:bg-white transition-colors" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Teks Tombol CTA
                  </label>
                  <input 
                    type="text" 
                    placeholder="Cth: Ambil Promo, Pesan Sekarang" 
                    value={bannerBtnText} 
                    onChange={e => setBannerBtnText(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none focus:border-rose-500 focus:bg-white transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Judul Utama (*Wajib)
                </label>
                <input 
                  type="text" 
                  placeholder="Cth: Diskon Servis AC Cuci Bersih 30%" 
                  value={bannerTitle} 
                  onChange={e => setBannerTitle(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-rose-500 focus:bg-white transition-colors" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Deskripsi Singkat
                </label>
                <textarea 
                  placeholder="Deskripsi penawaran atau informasi yang ingin disampaikan..." 
                  value={bannerDesc} 
                  onChange={e => setBannerDesc(e.target.value)} 
                  rows={2} 
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium resize-none outline-none focus:border-rose-500 focus:bg-white transition-colors" 
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={cancelEditBanner} 
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handleSaveBanner} 
                disabled={isSubmittingBanner} 
                className={`ripple-btn flex-1 py-3 font-bold text-white rounded-xl text-xs flex justify-center items-center gap-2 shadow-md active:scale-95 transition-all ${
                  editingBannerId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {isSubmittingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingBannerId ? 'Perbarui Banner' : 'Simpan & Publikasikan Banner'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* DAFTAR BANNER TERSIMPAN DENGAN FILTERISASI DROPDOWN BERDASARKAN LABEL BADGE */}
        <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>Daftar Banner Tersimpan</span>
                <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                  {filteredBanners.length} Banner
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Banner yang aktif tampil bergiliran pada beranda aplikasi pelanggan</p>
            </div>

            {/* FILTERISASI DROPDOWN BERDASARKAN LABEL BADGE */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Label:</span>
              <select
                value={bannerLabelFilter}
                onChange={e => setBannerLabelFilter(e.target.value)}
                className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-rose-500 transition-colors shadow-xs cursor-pointer"
              >
                <option value="Semua">🏷️ Semua Label Badge ({savedBanners.length})</option>
                {uniqueLabels.map(label => {
                  const count = savedBanners.filter(b => (b.label || 'PROMO').trim().toLowerCase() === label.toLowerCase()).length;
                  return (
                    <option key={label} value={label}>
                      {label} ({count})
                    </option>
                  );
                })}
              </select>

              {bannerLabelFilter !== 'Semua' && (
                <button
                  onClick={() => setBannerLabelFilter('Semua')}
                  className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {filteredBanners.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-xs">Tidak ada banner yang sesuai filter</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {bannerLabelFilter !== 'Semua' 
                  ? `Tidak ada banner dengan label badge "${bannerLabelFilter}".` 
                  : 'Belum ada banner tersimpan. Klik "+ Tambah Banner" di atas untuk menambahkan.'}
              </p>
              {bannerLabelFilter !== 'Semua' && (
                <button
                  onClick={() => setBannerLabelFilter('Semua')}
                  className="mt-3 text-xs font-bold text-rose-600 hover:underline"
                >
                  Tampilkan Semua Banner
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBanners.map(b => (
                <div key={b.id} className="p-3.5 sm:p-4 rounded-[20px] border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex justify-between items-center gap-3 transition-colors">
                  <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative bg-slate-900">
                    <img src={b.bg_url} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase">
                        {b.label || 'PROMO'}
                      </span>
                      {b.btn_text && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          CTA: "{b.btn_text}"
                        </span>
                      )}
                    </div>
                    <h5 className="font-extrabold text-slate-800 text-[13px] truncate">{b.title}</h5>
                    {b.description && (
                      <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">{b.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button 
                      onClick={() => handleEditBanner(b)} 
                      className="p-2 text-amber-600 bg-white hover:bg-amber-50 rounded-xl shadow-xs border border-slate-200/80 transition-colors"
                      title="Edit Banner"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => del('banners', b.id)} 
                      className="p-2 text-rose-600 bg-white hover:bg-rose-50 rounded-xl shadow-xs border border-slate-200/80 transition-colors"
                      title="Hapus Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getVoucherCardTheme = (tm: string) => {
    switch (tm) {
      case 'rose':
        return {
          border: 'border-rose-200',
          bgIcon: 'bg-rose-50',
          textIcon: 'text-rose-500',
          textCat: 'text-rose-600',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          glow: 'shadow-rose-500/10',
          codeBg: 'bg-rose-600 text-white'
        };
      case 'amber':
        return {
          border: 'border-amber-200',
          bgIcon: 'bg-amber-50',
          textIcon: 'text-amber-500',
          textCat: 'text-amber-600',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          glow: 'shadow-amber-500/10',
          codeBg: 'bg-amber-600 text-white'
        };
      case 'emerald':
        return {
          border: 'border-emerald-200',
          bgIcon: 'bg-emerald-50',
          textIcon: 'text-emerald-500',
          textCat: 'text-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          glow: 'shadow-emerald-500/10',
          codeBg: 'bg-emerald-600 text-white'
        };
      case 'sky':
        return {
          border: 'border-sky-200',
          bgIcon: 'bg-sky-50',
          textIcon: 'text-sky-500',
          textCat: 'text-sky-600',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          glow: 'shadow-sky-500/10',
          codeBg: 'bg-sky-600 text-white'
        };
      case 'indigo':
        return {
          border: 'border-indigo-200',
          bgIcon: 'bg-indigo-50',
          textIcon: 'text-indigo-500',
          textCat: 'text-indigo-600',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          glow: 'shadow-indigo-500/10',
          codeBg: 'bg-indigo-600 text-white'
        };
      case 'teal':
      default:
        return {
          border: 'border-teal-200',
          bgIcon: 'bg-teal-50',
          textIcon: 'text-teal-500',
          textCat: 'text-teal-600',
          badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
          glow: 'shadow-teal-500/10',
          codeBg: 'bg-teal-600 text-white'
        };
    }
  };

  const renderManajemenVoucher = () => {
    // Ekstraksi Unique Kategori untuk Filter Dropdown
    const uniqueCategories = Array.from(
      new Set(vouchers.map(v => (v.category || 'PROMO').trim()))
    ).filter(Boolean);

    const filteredVouchers = vouchers.filter(v => {
      if (voucherFilterCat === 'Semua') return true;
      return (v.category || 'PROMO').trim().toLowerCase() === voucherFilterCat.toLowerCase();
    });

    const previewCode = voucherCode?.trim().toUpperCase() || 'HEMAT50K';
    const previewTitle = voucherTitle?.trim() || 'Potongan Servis Cuci AC Rp 50.000';
    const previewCategory = voucherCategory?.trim() || 'PROMO SPESIAL';
    const previewDesc = voucherDesc?.trim() || 'Gunakan kode kupon untuk mendapatkan potongan harga pada pesanan servis Anda.';
    const themeStyle = getVoucherCardTheme(voucherTheme);

    return (
      <div className="animate-in fade-in pb-10 space-y-4">
        {/* HEADER ATAS DENGAN TOMBOL TAMBAH VOUCHER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">Manajemen Voucher</h3>
              <p className="text-[11px] text-slate-500 font-medium">Kelola kupon diskon & penawaran promosi untuk pelanggan</p>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              triggerRipple(e);
              if (isVoucherFormOpen) {
                cancelEditVoucher();
              } else {
                setEditingVoucherId(null);
                setVoucherCode('');
                setVoucherTitle('');
                setVoucherCategory('Diskon Servis');
                setVoucherDesc('');
                setVoucherTheme('teal');
                setIsVoucherFormOpen(true);
              }
            }}
            className={`ripple-btn px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
              isVoucherFormOpen 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
            }`}
          >
            {isVoucherFormOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>Tutup Formulir</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Tambah Voucher</span>
              </>
            )}
          </button>
        </div>

        {/* FORMULIR HANYA TAMPIL SAAT DIMINTA (isVoucherFormOpen === true) */}
        {isVoucherFormOpen && (
          <div className={`bg-white p-5 sm:p-6 rounded-[28px] border shadow-sm space-y-5 animate-in fade-in slide-in-from-top-3 duration-300 ${editingVoucherId ? 'border-amber-300' : 'border-teal-100'}`}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${editingVoucherId ? 'bg-amber-500' : 'bg-teal-500'} animate-pulse`}></span>
                <h4 className="font-extrabold text-slate-800 text-[14px]">
                  {editingVoucherId ? 'Edit Voucher Promo' : 'Form Tambah Voucher Baru'}
                </h4>
              </div>
              <button
                type="button"
                onClick={cancelEditVoucher}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIVE PREVIEW VOUCHER DIATAS SEBELUM KOLOM PENGISIAN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Live Preview (Tampilan Beranda Pelanggan)
                </span>
                <span className="text-[10px] text-slate-400 font-medium italic">Preview otomatis ter-update</span>
              </div>

              {/* TAMPILAN KARTU VOUCHER LIVE PREVIEW PERSIS SEPERTI DI BERANDA PELANGGAN */}
              <div className="w-full bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-dashed border-slate-200 flex justify-center items-center">
                <div className={`w-full max-w-[420px] bg-white border ${themeStyle.border} rounded-[24px] p-4 flex items-center gap-3.5 shadow-sm relative overflow-hidden transition-all duration-300`}>
                  {/* Tiket Notches di kiri & kanan */}
                  <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FA] rounded-full border-r ${themeStyle.border} z-0 shadow-inner`}></div>
                  <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FA] rounded-full border-l ${themeStyle.border} z-0 shadow-inner`}></div>

                  {/* Icon Tiket */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${themeStyle.bgIcon} ${themeStyle.textIcon} ml-1 z-10 shadow-xs border border-white/80`}>
                    <Ticket className="w-6 h-6" />
                  </div>

                  {/* Konten Voucher */}
                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className={`text-[9px] font-extrabold uppercase tracking-widest ${themeStyle.textCat}`}>
                        {previewCategory}
                      </p>
                      {previewCode && (
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.2 bg-slate-900 text-amber-300 rounded tracking-wider">
                          {previewCode}
                        </span>
                      )}
                    </div>
                    <h4 className="text-[13px] font-extrabold text-slate-800 truncate leading-snug">
                      {previewTitle}
                    </h4>
                    <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                      {previewDesc}
                    </p>
                  </div>

                  {/* Tombol Klaim Mockup */}
                  <div className="shrink-0 z-10 mr-1">
                    <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-xs inline-flex items-center gap-1 cursor-default select-none opacity-90">
                      Klaim
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM PENGISIAN FORMULIR */}
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Kode Kupon Voucher (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Cth: DISKON50K, PROMOAC"
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                  <span className="text-[9.5px] text-slate-400 mt-1 block">Otomatis huruf kapital, pelanggan dapat menyalin kode ini.</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Kategori Voucher (*Wajib)
                  </label>
                  <input
                    type="text"
                    placeholder="Cth: Diskon AC, Promo Pelanggan"
                    value={voucherCategory}
                    onChange={e => setVoucherCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                  {/* Quick preset chips */}
                  <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[9px] text-slate-400 font-bold self-center shrink-0">Pilihan Cepat:</span>
                    {['Diskon Servis', 'Kupon AC', 'Promo Spesial', 'Cashback', 'Member VIP'].map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setVoucherCategory(cat)}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0 transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Judul Voucher Promosi (*Wajib)
                </label>
                <input
                  type="text"
                  placeholder="Cth: Potongan Servis Cuci AC Rp 50.000"
                  value={voucherTitle}
                  onChange={e => setVoucherTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Deskripsi / Syarat & Ketentuan Singkat
                </label>
                <textarea
                  placeholder="Deskripsi promo atau cara penggunaan kupon oleh pelanggan..."
                  value={voucherDesc}
                  onChange={e => setVoucherDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium resize-none outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Tema Warna Voucher
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'rose', name: 'Rose', color: 'bg-rose-500' },
                    { id: 'amber', name: 'Amber', color: 'bg-amber-500' },
                    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500' },
                    { id: 'sky', name: 'Sky', color: 'bg-sky-500' },
                    { id: 'indigo', name: 'Indigo', color: 'bg-indigo-500' },
                    { id: 'teal', name: 'Teal', color: 'bg-teal-500' },
                  ].map(tm => (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => setVoucherTheme(tm.id)}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        voucherTheme === tm.id
                          ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs ring-1 ring-teal-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${tm.color}`}></span>
                      <span>{tm.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={cancelEditVoucher}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveVoucher}
                disabled={isSubmittingVoucher}
                className={`ripple-btn flex-1 py-3 font-bold text-white rounded-xl text-xs flex justify-center items-center gap-2 shadow-md active:scale-95 transition-all ${
                  editingVoucherId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                }`}
              >
                {isSubmittingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingVoucherId ? 'Perbarui Voucher' : 'Simpan & Publikasikan Voucher'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* DAFTAR VOUCHER TERSIMPAN */}
        <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>Daftar Voucher Tersimpan</span>
                <span className="text-[10px] font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">
                  {filteredVouchers.length} Voucher
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Voucher aktif yang dapat diklaim pelanggan pada aplikasi</p>
            </div>

            {/* Filter Dropdown Berdasarkan Kategori Voucher */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Kategori:</span>
              <select
                value={voucherFilterCat}
                onChange={e => setVoucherFilterCat(e.target.value)}
                className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-teal-500 transition-colors shadow-xs cursor-pointer"
              >
                <option value="Semua">🏷️ Semua Kategori ({vouchers.length})</option>
                {uniqueCategories.map(cat => {
                  const count = vouchers.filter(v => (v.category || 'PROMO').trim().toLowerCase() === cat.toLowerCase()).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>

              {voucherFilterCat !== 'Semua' && (
                <button
                  onClick={() => setVoucherFilterCat('Semua')}
                  className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200 transition-colors shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {filteredVouchers.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-xs">Tidak ada voucher yang sesuai</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {voucherFilterCat !== 'Semua' 
                  ? `Tidak ada voucher dalam kategori "${voucherFilterCat}".` 
                  : 'Belum ada voucher promo tersimpan. Klik "+ Tambah Voucher" di atas untuk menambahkan.'}
              </p>
              {voucherFilterCat !== 'Semua' && (
                <button
                  onClick={() => setVoucherFilterCat('Semua')}
                  className="mt-3 text-xs font-bold text-teal-600 hover:underline"
                >
                  Tampilkan Semua Voucher
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVouchers.map(v => {
                const cardTheme = getVoucherCardTheme(v.theme_color || 'rose');
                return (
                  <div key={v.id} className="p-3.5 sm:p-4 rounded-[20px] border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex justify-between items-center gap-3 transition-colors">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cardTheme.bgIcon} ${cardTheme.textIcon} border border-slate-200/60`}>
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${cardTheme.badgeBg}`}>
                          {v.category || 'PROMO'}
                        </span>
                        {v.code && (
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 tracking-wider">
                            {v.code}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 capitalize hidden sm:inline">
                          Tema: {v.theme_color || 'rose'}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-slate-800 text-[13px] truncate">{v.title}</h5>
                      {v.description && (
                        <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">{v.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button 
                        onClick={() => handleEditVoucher(v)} 
                        className="p-2 text-amber-600 bg-white hover:bg-amber-50 rounded-xl shadow-xs border border-slate-200/80 transition-colors"
                        title="Edit Voucher"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Yakin ingin menghapus voucher "${v.title}"?`)) {
                            del('vouchers_promos', v.id);
                          }
                        }} 
                        className="p-2 text-rose-600 bg-white hover:bg-rose-50 rounded-xl shadow-xs border border-slate-200/80 transition-colors"
                        title="Hapus Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderKatalogJasa = () => (
    <div className="animate-in fade-in pb-10 space-y-4">
      <div className="flex p-1 bg-slate-200/80 rounded-xl mb-4">
        <button onClick={() => setKatalogTab('kategori')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${katalogTab === 'kategori' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Kategori Jasa</button>
        <button onClick={() => setKatalogTab('objek')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${katalogTab === 'objek' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Objek / Unit</button>
      </div>

      {katalogTab === 'kategori' && (
        <div className={`bg-white p-6 rounded-[28px] border shadow-sm ${editingCategoryId ? 'border-amber-300' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Layers className="w-5 h-5" /></div>
            <h3 className="font-extrabold text-slate-800 text-[15px]">{editingCategoryId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
          </div>
          <div className="space-y-3.5 mb-6">
            <input type="text" placeholder="Nama Kategori" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-[16px] text-xs outline-none" />
            <input type="text" placeholder="Nama Ikon (Opsional)" value={categoryIcon} onChange={e => setCategoryIcon(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-[16px] text-xs outline-none" />
          </div>
          <div className="flex gap-2">
            {editingCategoryId && <button onClick={() => {setEditingCategoryId(null); setCategoryName('');}} className="px-5 bg-slate-100 font-bold rounded-[16px] text-xs">Batal</button>}
            <button onClick={handleSaveCategory} disabled={isSubmittingCat} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-xs flex justify-center gap-2 ${editingCategoryId ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {isSubmittingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Kategori'}
            </button>
          </div>
          
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-[10px] font-bold text-slate-400 mb-3 px-1">Kategori Tersimpan:</h4>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="p-3.5 rounded-[18px] border bg-slate-50 flex justify-between items-center">
                  <span className="font-bold text-xs">{cat.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingCategoryId(cat.id); setCategoryName(cat.name); setCategoryIcon(cat.icon||''); }} className="p-1.5 text-amber-600 bg-white rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del('service_categories', cat.id)} className="p-1.5 text-rose-600 bg-white rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {katalogTab === 'objek' && (
        <div className={`bg-white p-6 rounded-[28px] border shadow-sm ${editingUnitId ? 'border-amber-300' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Box className="w-5 h-5" /></div>
            <h3 className="font-extrabold text-slate-800 text-[15px]">{editingUnitId ? 'Edit Objek Unit' : 'Tambah Objek Baru'}</h3>
          </div>
          <div className="space-y-3.5 mb-6">
            <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-[16px] text-xs font-bold outline-none">
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <input type="text" placeholder="Nama Unit (Cth: AC Split)" value={unitName} onChange={e => setUnitName(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-[16px] text-xs outline-none" />
          </div>
          <div className="flex gap-2">
            {editingUnitId && <button onClick={() => {setEditingUnitId(null); setUnitName('');}} className="px-5 bg-slate-100 font-bold rounded-[16px] text-xs">Batal</button>}
            <button onClick={handleSaveUnit} disabled={isSubmittingUnit} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-xs flex justify-center gap-2 ${editingUnitId ? 'bg-amber-500' : 'bg-blue-600'}`}>
              {isSubmittingUnit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Unit'}
            </button>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 px-1 -mx-1">
              <button onClick={() => setObjekFilter('Semua')} className={`flex-none px-4 py-1.5 rounded-full text-[11px] font-bold ${objekFilter === 'Semua' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Semua</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setObjekFilter(cat.id)} className={`flex-none px-4 py-1.5 rounded-full text-[11px] font-bold ${objekFilter === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{cat.name}</button>
              ))}
            </div>
            
            <div className="space-y-3">
              {(() => {
                const filtered = serviceUnits.filter(u => objekFilter === 'Semua' || String(u.category_id) === objekFilter);
                const grouped: Record<string, any[]> = {};
                filtered.forEach(u => { if (!grouped[u.category_id]) grouped[u.category_id] = []; grouped[u.category_id].push(u); });
                
                return Object.keys(grouped).map(catId => {
                  const cat = categories.find(c => String(c.id) === catId);
                  const isExpanded = expandedObjKategori.includes(catId) || objekFilter === catId;
                  return (
                    <div key={catId} className="bg-white border rounded-[20px] shadow-sm overflow-hidden">
                      <button onClick={() => {
                        if (isExpanded && objekFilter !== catId) setExpandedObjKategori(prev => prev.filter(id => id !== catId));
                        else setExpandedObjKategori(prev => [...prev, catId]);
                      }} className="w-full flex items-center justify-between p-3.5 bg-slate-50 outline-none">
                        <div className="text-left">
                          <h5 className="text-[13px] font-bold text-slate-800">{cat?.name || 'Umum'}</h5>
                          <span className="text-[10px] text-slate-500">{grouped[catId].length} Unit</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {isExpanded && (
                        <div className="p-3 bg-white space-y-2">
                          {grouped[catId].map(u => (
                            <div key={u.id} className="p-3 border rounded-xl flex justify-between items-center bg-slate-50">
                              <h6 className="font-bold text-[12px]">{u.name}</h6>
                              <div className="flex gap-1.5">
                                <button onClick={() => { setEditingUnitId(u.id); setUnitName(u.name); setSelectedCategoryId(String(u.category_id)); }} className="p-2 text-amber-600 bg-white rounded-xl shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => del('services', u.id)} className="p-2 text-rose-600 bg-white rounded-xl shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderKatalogKhusus = () => (
    <div className="animate-in fade-in pb-10 space-y-4">
      <div className={`bg-white p-6 rounded-[28px] border shadow-sm ${editingSpcId ? 'border-amber-300' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-fuchsia-50 text-fuchsia-600"><Award className="w-5 h-5" /></div>
          <h3 className="font-extrabold text-slate-800 text-[15px]">{editingSpcId ? 'Edit Paket VIP' : 'Tambah Paket VIP Baru'}</h3>
        </div>
        <div className="space-y-3.5 mb-6">
          <input type="text" placeholder="Judul Paket (*Wajib)" value={spcTitle} onChange={e => setSpcTitle(e.target.value)} className="w-full bg-slate-50 border p-3.5 rounded-[16px] text-xs outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Kategori" value={spcCategory} onChange={e => setSpcCategory(e.target.value)} className="bg-slate-50 border p-3.5 rounded-[16px] text-xs outline-none" />
            <input type="text" placeholder="Subtitle" value={spcSubtitle} onChange={e => setSpcSubtitle(e.target.value)} className="bg-slate-50 border p-3.5 rounded-[16px] text-xs outline-none" />
          </div>
          <textarea placeholder="Deskripsi Paket..." value={spcDesc} onChange={e => setSpcDesc(e.target.value)} rows={2} className="w-full bg-slate-50 border p-3.5 rounded-[16px] text-xs resize-none outline-none" />
          <textarea placeholder="Keuntungan (pisahkan dgn koma)" value={spcBenefits} onChange={e => setSpcBenefits(e.target.value)} rows={2} className="w-full bg-slate-50 border p-3.5 rounded-[16px] text-xs resize-none outline-none" />
          <input type="text" placeholder="Teks Tombol CTA" value={spcCta} onChange={e => setSpcCta(e.target.value)} className="w-full bg-slate-50 border p-3.5 rounded-[16px] text-xs outline-none" />
          
          <div className="grid grid-cols-2 gap-3">
            <select value={spcIcon} onChange={e => setSpcIcon(e.target.value)} className="bg-slate-50 border p-3 rounded-xl text-xs outline-none">
              {['Wind', 'Car', 'ShieldCheck', 'Wrench', 'Snowflake', 'Truck', 'Zap', 'Smartphone'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <select value={spcTheme} onChange={e => setSpcTheme(e.target.value)} className="bg-slate-50 border p-3 rounded-xl text-xs outline-none">
              <option value="sky">Sky Blue</option><option value="indigo">Indigo</option><option value="emerald">Emerald Green</option><option value="rose">Rose Red</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          {editingSpcId && <button onClick={() => {setEditingSpcId(null); setSpcTitle('');}} className="px-5 bg-slate-100 font-bold rounded-[16px] text-xs">Batal</button>}
          <button onClick={handleSaveSpc} disabled={isSubmittingSpc} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-xs flex justify-center gap-2 ${editingSpcId ? 'bg-amber-500' : 'bg-fuchsia-600'}`}>
            {isSubmittingSpc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Paket'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] border shadow-sm">
        <h4 className="text-[10px] font-bold text-slate-400 mb-3">Katalog Tersimpan:</h4>
        <div className="space-y-3">
          {specialCatalogs.map(item => (
            <div key={item.id} className="p-4 rounded-[20px] border bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${item.bg_class || 'bg-slate-100'}`}>
                  {getIconComponent(item.icon_name || 'Wind', `w-5 h-5 ${item.icon_color || 'text-slate-600'}`)}
                </div>
                <div>
                  <h5 className="font-bold text-xs">{item.title}</h5>
                  <p className="text-[10px] text-slate-500">{item.category}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => {
                  setEditingSpcId(item.id); setSpcTitle(item.title); setSpcCategory(item.category); setSpcSubtitle(item.subtitle);
                  setSpcDesc(item.description); setSpcBenefits((item.benefits||[]).join(', ')); setSpcCta(item.cta_text); setSpcIcon(item.icon_name||'Wind');
                  setSpcTheme(item.bg_class?.includes('indigo')?'indigo':item.bg_class?.includes('emerald')?'emerald':item.bg_class?.includes('rose')?'rose':'sky');
                  window.scrollTo(0,0);
                }} className="p-2 text-amber-600 bg-white rounded-xl shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => del('special_services_catalog', item.id)} className="p-2 text-rose-600 bg-white rounded-xl shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = () => {
    const modData = ADMIN_MODULES.find(m => m.id === activeModule) || ADMIN_MODULES[0];
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center animate-in fade-in">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-100 ${modData.bg}`}>
          <modData.icon className={`w-12 h-12 ${modData.color}`} />
        </div>
        <h3 className="text-[18px] font-bold text-slate-800 mb-2">Modul {modData.label}</h3>
        <p className="text-[13px] text-slate-500">Telah dirender utuh sesuai permintaan.</p>
      </div>
    );
  };

  // MAIN SHELL RENDER
  const currentModuleData = ADMIN_MODULES.find(m => m.id === activeModule) || ADMIN_MODULES[0];

  return (
    <div className="max-w-md mx-auto bg-slate-50 h-[100dvh] w-full relative shadow-2xl overflow-hidden font-sans flex flex-col">
      {/* HEADER UTAMA ADMIN */}
      <header className="flex-none z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] pt-7 pb-4 px-5 relative">
        <div className="flex justify-between items-center mb-1.5">
          <button onClick={onBackToCustomer} className="p-2.5 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 border border-slate-100 shadow-sm outline-none">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-extrabold tracking-widest uppercase rounded-full border border-indigo-100/50">
            Portal Admin
          </span>
          <button onClick={fetchData} className={`p-2.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100/50 shadow-sm outline-none ${isRefreshing ? 'animate-spin' : 'hover:bg-blue-100'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between px-1">
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">{currentModuleData.label}</h1>
          <button onClick={() => setIsMenuOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 active:scale-95 shadow-md shadow-slate-900/20 outline-none">
            <Menu className="w-4 h-4" /><span className="text-[12px] font-bold">Menu</span>
          </button>
        </div>
      </header>

      {/* CONTENT UTAMA SWITCHER */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 relative z-0">
        <div key={activeModule} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out fill-mode-both min-h-full">
          {activeModule === 'dashboard' ? renderDashboard() :
           activeModule === 'pesanan' ? renderPesananMasuk() :
           activeModule === 'pelanggan' ? renderManajemenPelanggan() :
           activeModule === 'voucher' ? renderManajemenVoucher() :
           activeModule === 'katalog_khusus' ? renderKatalogKhusus() :
           activeModule === 'katalog' ? renderKatalogJasa() :
           activeModule === 'banner' ? renderManajemenBanner() :
           activeModule === 'stok' ? renderManajemenStok() :
           activeModule === 'laporan' ? renderLaporanKeuangan() :
           renderPlaceholder()}
        </div>
      </main>

      {/* MODAL: BUKTI FOTO & RECEIPT */}
      {viewPhotoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 transition-opacity" onClick={() => setViewPhotoModal(null)}>
          <div className="relative w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewPhotoModal(null)} className="absolute -top-12 right-0 w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center border border-slate-600 hover:bg-rose-500 outline-none"><X className="w-5 h-5" /></button>
            <img src={viewPhotoModal} alt="Lampiran" className="w-full rounded-2xl object-contain bg-slate-900 shadow-2xl" />
          </div>
        </div>
      )}
      
      {viewReceiptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 transition-opacity" onClick={() => setViewReceiptModal(null)}>
          <div className="bg-white p-2 rounded-[24px] max-w-sm w-full relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewReceiptModal(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg outline-none"><X className="w-4 h-4" /></button>
            <img src={viewReceiptModal} alt="Bukti" className="w-full rounded-[18px] object-contain" />
          </div>
        </div>
      )}

      {/* MODAL: TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
            toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30' : 
            toast.type === 'error' ? 'bg-rose-950/90 text-rose-200 border-rose-500/30' : 
            'bg-slate-900/90 text-slate-200 border-slate-700/50'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <p className="text-[12px] font-bold leading-snug flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM BOX */}
      {confirmModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setConfirmModal(null)}>
          <div className="bg-white p-6 rounded-[28px] max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${confirmModal.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-[16px] tracking-tight">{confirmModal.title}</h3>
            </div>
            <p className="text-[12px] text-slate-600 font-medium whitespace-pre-line leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-all">
                Batal
              </button>
              <button 
                onClick={() => { const action = confirmModal.onConfirm; setConfirmModal(null); action(); }} 
                className={`flex-1 py-3 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}`}
              >
                {confirmModal.confirmLabel || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MENU NAVIGASI SAMPING/BAWAH */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[32px] flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-full flex justify-center pt-4 pb-2 bg-white relative">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              <button onClick={() => setIsMenuOpen(false)} className="absolute right-5 top-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 outline-none"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 pb-6 pt-2 overflow-y-auto no-scrollbar space-y-6">
              <div>
                <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Navigasi Admin</h2>
                <p className="text-[11px] text-slate-500 font-medium">Pilih modul untuk mengelola OMEANFIX</p>
              </div>
              {MENU_SECTIONS.map((section, idx) => (
                <div key={idx} className="space-y-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 mb-1">{section.title}</h3>
                  <div className="space-y-2">
                    {section.items.map(itemId => {
                      const modul = ADMIN_MODULES.find(m => m.id === itemId);
                      if (!modul) return null;
                      return (
                        <button
                          key={modul.id}
                          onClick={() => { setActiveModule(modul.id); setIsMenuOpen(false); }}
                          className={`w-full flex items-center justify-between p-3.5 rounded-[20px] transition-all duration-200 outline-none border ${activeModule === modul.id ? 'bg-white border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-100' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shadow-sm ${activeModule === modul.id ? modul.bg : 'bg-slate-100'}`}>
                              <modul.icon className={`w-5 h-5 ${activeModule === modul.id ? modul.color : 'text-slate-400'}`} />
                            </div>
                            <span className={`text-[14px] font-bold ${activeModule === modul.id ? 'text-slate-900' : 'text-slate-600'}`}>{modul.label}</span>
                          </div>
                          {activeModule === modul.id && <div className="w-2 h-2 rounded-full bg-blue-600 mr-2 shadow-sm"></div>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}